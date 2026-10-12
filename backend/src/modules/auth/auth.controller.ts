import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/apiError';
import { firebaseAuth } from '../../config/firebase';
import { env } from '../../config/env';

export class AuthController {
  /**
   * Register a new user with password and email verification.
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login with email and password.
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email OTP.
   */
  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;
      const result = await AuthService.verifyOtp(email, otp);
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend email verification OTP.
   */
  static async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await AuthService.resendOtp(email);
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot password - request password reset OTP.
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password with OTP and new password.
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.resetPassword(req.body);
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sync user for legacy/Firebase tokens.
   */
  static async sync(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw ApiError.unauthorized('Bearer token required to sync user', 'INVALID_TOKEN');
      }

      const token = authHeader.split('Bearer ')[1];

      let uid: string;
      let email: string | null = null;
      let phone: string | null = null;
      let name: string = req.body.name || 'FarmLink User';

      if (env.ENABLE_DEV_AUTH && env.NODE_ENV !== 'production' && token.startsWith('dev-')) {
        const roleType = token.replace('dev-', '');
        uid = roleType === 'admin'
          ? 'admin-seed-uid-001'
          : roleType === 'farmer'
          ? 'farmer-seed-uid-001'
          : roleType === 'customer'
          ? 'customer-seed-uid-001'
          : roleType;
        email = req.body.email || `${roleType}@farmlink.local`;
        phone = req.body.phone || null;
      } else {
        const decodedToken = await firebaseAuth().verifyIdToken(token);
        uid = decodedToken.uid;
        name = req.body.name || decodedToken.name || 'FarmLink User';
        email = decodedToken.email || req.body.email || null;
        phone = decodedToken.phone_number || req.body.phone || null;
      }

      const user = await AuthService.syncUser({
        firebaseUid: uid,
        name,
        email,
        phone,
        registerAsFarmer: req.body.registerAsFarmer === true,
        farmName: req.body.farmName,
        bio: req.body.bio,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pincode,
      });

      return sendSuccess(res, user, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current authenticated user profile.
   */
  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required', 'UNAUTHORIZED');
      }

      const user = await AuthService.getCurrentUser(req.user.id);
      return sendSuccess(res, user, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user.
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.firebaseUid) {
        await AuthService.logout(req.user.firebaseUid);
      }
      return sendSuccess(res, { message: 'Logged out successfully' }, 200);
    } catch (error) {
      next(error);
    }
  }
}
