import { Role } from '@prisma/client';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { firebaseAuth } from '../../config/firebase';
import { ApiError } from '../../utils/apiError';
import {
  hashPassword,
  verifyPassword,
  verifyPasswordAsync,
  createSessionToken,
  generateOtp,
} from '../../utils/security';
import { sendPasswordResetOtp, sendVerificationOtp } from '../../utils/email';
import { RegisterDTO, LoginDTO, ResetPasswordDTO } from './auth.validation';

export interface SyncUserData {
  firebaseUid: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  registerAsFarmer?: boolean;
  farmName?: string;
  bio?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export class AuthService {
  /**
   * Register a new user with secure password hash and email verification OTP.
   */
  static async register(data: RegisterDTO) {
    const normalizedEmail = data.email.trim().toLowerCase();

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        throw ApiError.conflict(
          `An account with email "${normalizedEmail}" already exists. Please sign in instead.`,
          'EMAIL_ALREADY_EXISTS'
        );
      }

      // If existing but unverified, update their details & send a fresh OTP
      const otp = generateOtp();
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const passwordHash = hashPassword(data.password);

      const updated = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: data.name.trim(),
          passwordHash,
          role: (data.role as Role) || Role.CUSTOMER,
          phone: data.phone || existingUser.phone,
          verificationOtp: otp,
          otpExpiresAt,
        },
      });

      // Send OTP via email securely (await delivery confirmation)
      await sendVerificationOtp(updated.email ?? normalizedEmail, data.name.trim(), otp);

      return {
        requiresVerification: true,
        email: updated.email,
        message: 'A verification code has been sent to your email. Valid for 15 minutes.',
      };
    }

    const assignedRole = (data.role as Role) || Role.CUSTOMER;
    const passwordHash = hashPassword(data.password);
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const generatedUid = `fl-${crypto.randomUUID()}`;

    // Create user, cart, and farmer profile if applicable in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firebaseUid: generatedUid,
          name: data.name.trim(),
          email: normalizedEmail,
          phone: data.phone || null,
          role: assignedRole,
          passwordHash,
          isEmailVerified: false,
          verificationOtp: otp,
          otpExpiresAt,
        },
      });

      // Initialize cart
      await tx.cart.create({
        data: { userId: user.id },
      });

      // If farmer role, create farmer profile
      if (assignedRole === Role.FARMER) {
        await tx.farmerProfile.create({
          data: {
            userId: user.id,
            farmName: data.farmName || `${data.name}'s Farm`,
            bio: data.bio || '',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            pincode: data.pincode || '',
            isApproved: false,
          },
        });
      }

      return user;
    });

    // Send verification OTP via email securely (await delivery confirmation)
    await sendVerificationOtp(newUser.email ?? normalizedEmail, data.name.trim(), otp);

    return {
      requiresVerification: true,
      email: newUser.email,
      message: 'Account created! A 6-digit verification code has been sent to your email.',
    };
  }

  /**
   * Login with email and password, validating credentials directly against PostgreSQL.
   */
  static async login(data: LoginDTO) {
    const normalizedEmail = data.email.trim().toLowerCase();

    // 1. Find user in database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        farmerProfile: true,
      },
    });

    if (!user) {
      throw ApiError.notFound(
        `No account found with email "${normalizedEmail}". Please register for an account before signing in.`,
        'USER_NOT_FOUND'
      );
    }

    // 2. Verify password asynchronously (non-blocking)
    const isPasswordValid = await verifyPasswordAsync(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw ApiError.unauthorized(
        'Incorrect password. Please verify your credentials and try again.',
        'INVALID_CREDENTIALS'
      );
    }

    // 3. Verify role match if specified
    if (data.role && user.role !== (data.role as Role)) {
      throw ApiError.forbidden(
        `Role mismatch: This account is registered as ${user.role}, but you selected ${data.role}. Please select ${user.role} to proceed.`,
        'ROLE_MISMATCH'
      );
    }

    // 4. Verify account active status
    if (!user.isActive) {
      throw ApiError.forbidden(
        'Your account has been deactivated by an administrator.',
        'ACCOUNT_DEACTIVATED'
      );
    }

    // 5. If user logs in with valid credentials, ensure isEmailVerified is set
    if (!user.isEmailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          verificationOtp: null,
          otpExpiresAt: null,
        },
      });
      user.isEmailVerified = true;
    }

    // 6. Generate strong signed session token
    const token = createSessionToken({
      userId: user.id,
      email: user.email || '',
      role: user.role,
    });

    const { passwordHash: _, verificationOtp: __, otpExpiresAt: ___, ...sanitizedUser } = user;

    return {
      user: sanitizedUser,
      token,
      requiresVerification: false,
    };
  }

  /**
   * Verify email using 6-digit OTP code.
   */
  static async verifyOtp(email: string, otp: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        farmerProfile: true,
        cart: true,
      },
    });

    if (!user) {
      throw ApiError.notFound(
        `No account found with email "${normalizedEmail}". Please register first.`,
        'USER_NOT_FOUND'
      );
    }

    if (user.verificationOtp !== otp.trim()) {
      throw ApiError.badRequest(
        'Invalid 6-digit verification code. Please check and try again.',
        'INVALID_OTP'
      );
    }

    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      throw ApiError.badRequest(
        'Verification code has expired. Please click "Resend Code".',
        'OTP_EXPIRED'
      );
    }

    // Mark email as verified
    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationOtp: null,
        otpExpiresAt: null,
      },
      include: {
        farmerProfile: true,
        cart: true,
      },
    });

    const token = createSessionToken({
      userId: verifiedUser.id,
      email: verifiedUser.email || '',
      role: verifiedUser.role,
    });

    const { passwordHash: _, verificationOtp: __, otpExpiresAt: ___, ...sanitizedUser } = verifiedUser;

    return {
      user: sanitizedUser,
      token,
    };
  }

  /**
   * Resend fresh OTP verification code.
   */
  static async resendOtp(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw ApiError.notFound(
        `No account found with email "${normalizedEmail}".`,
        'USER_NOT_FOUND'
      );
    }

    if (user.isEmailVerified) {
      throw ApiError.badRequest(
        'This account is already verified. Please sign in.',
        'ALREADY_VERIFIED'
      );
    }

    const newOtp = generateOtp();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationOtp: newOtp,
        otpExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // Send fresh OTP via email securely (await delivery confirmation)
    await sendVerificationOtp(user.email ?? normalizedEmail, user.name, newOtp);

    return {
      success: true,
      email: user.email,
      message: 'A fresh 6-digit code has been sent to your email. Valid for 15 minutes.',
    };
  }

  /**
   * Request password reset code for an existing account.
   */
  static async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw ApiError.notFound(
        `No account found with email "${normalizedEmail}". Please check the address or sign up.`,
        'USER_NOT_FOUND'
      );
    }

    if (!user.isActive) {
      throw ApiError.forbidden(
        'Your account has been deactivated by an administrator.',
        'ACCOUNT_DEACTIVATED'
      );
    }

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordOtp: otp,
        resetPasswordExpiresAt: otpExpiresAt,
      },
    });

    // Send OTP via email securely
    await sendPasswordResetOtp(user.email ?? normalizedEmail, user.name, otp);

    return {
      success: true,
      email: user.email,
      message: 'A 6-digit password reset code has been sent to your Gmail. Valid for 15 minutes.',
    };
  }

  /**
   * Reset user password using the 6-digit reset code.
   */
  static async resetPassword(data: ResetPasswordDTO) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const cleanOtp = data.otp.trim();
    const cleanPassword = data.newPassword.trim();

    if (cleanPassword.length < 6) {
      throw ApiError.badRequest(
        'Password must be at least 6 characters long.',
        'WEAK_PASSWORD'
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw ApiError.notFound(
        `No account found with email "${normalizedEmail}".`,
        'USER_NOT_FOUND'
      );
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== cleanOtp) {
      throw ApiError.badRequest(
        'Invalid 6-digit reset code. Please check and try again.',
        'INVALID_OTP'
      );
    }

    if (user.resetPasswordExpiresAt && user.resetPasswordExpiresAt < new Date()) {
      throw ApiError.badRequest(
        'Password reset code has expired. Please request a new code.',
        'OTP_EXPIRED'
      );
    }

    const passwordHash = hashPassword(cleanPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordOtp: null,
        resetPasswordExpiresAt: null,
      },
    });

    return {
      success: true,
      message: 'Your password has been successfully reset. You can now sign in with your new password.',
    };
  }

  /**
   * Sync user helper with email-collision safety.
   */
  static async syncUser(data: SyncUserData) {
    const { firebaseUid, name, email, phone, registerAsFarmer = false, ...farmerData } = data;
    const normalizedEmail = email ? email.trim().toLowerCase() : null;

    // 1. Check if user already exists by firebaseUid
    let user = await prisma.user.findUnique({
      where: { firebaseUid },
      include: { farmerProfile: true, cart: true },
    });

    // 2. If not found by firebaseUid, check by email to prevent P2002 collision
    if (!user && normalizedEmail) {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { farmerProfile: true, cart: true },
      });

      if (user) {
        // Link firebaseUid to existing user record
        user = await prisma.user.update({
          where: { id: user.id },
          data: { firebaseUid },
          include: { farmerProfile: true, cart: true },
        });
      }
    }

    if (!user) {
      const assignedRole = registerAsFarmer ? Role.FARMER : Role.CUSTOMER;

      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            firebaseUid,
            name,
            email: normalizedEmail,
            phone: phone || null,
            role: assignedRole,
            isEmailVerified: true,
          },
        });

        await tx.cart.create({
          data: { userId: newUser.id },
        });

        if (assignedRole === Role.FARMER) {
          await tx.farmerProfile.create({
            data: {
              userId: newUser.id,
              farmName: farmerData.farmName || `${name}'s Farm`,
              bio: farmerData.bio || '',
              address: farmerData.address || '',
              city: farmerData.city || '',
              state: farmerData.state || '',
              pincode: farmerData.pincode || '',
              isApproved: false,
            },
          });
        }

        return tx.user.findUnique({
          where: { id: newUser.id },
          include: { farmerProfile: true, cart: true },
        });
      });
    } else {
      if (!user.isActive) {
        throw ApiError.forbidden('Your account has been deactivated by an administrator.', 'ACCOUNT_DEACTIVATED');
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          phone: phone !== undefined ? phone : user.phone,
        },
        include: { farmerProfile: true, cart: true },
      });
    }

    return user;
  }

  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        farmerProfile: true,
        cart: {
          include: {
            items: {
              include: {
                product: {
                  include: { images: true },
                },
              },
            },
          },
        },
        addresses: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User profile not found', 'USER_NOT_FOUND');
    }

    const { passwordHash: _, verificationOtp: __, otpExpiresAt: ___, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  static async logout(firebaseUid: string) {
    try {
      await firebaseAuth().revokeRefreshTokens(firebaseUid);
    } catch {
      // Ignore if not a Firebase user
    }
    return { loggedOut: true };
  }
}
