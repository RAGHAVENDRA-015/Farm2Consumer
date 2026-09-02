import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { firebaseAuth } from '../../config/firebase';
import { ApiError } from '../../utils/apiError';

export interface SyncUserData {
  firebaseUid: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: Role;
  farmName?: string;
  bio?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export class AuthService {
  static async syncUser(data: SyncUserData) {
    const { firebaseUid, name, email, phone, role = Role.CUSTOMER, ...farmerData } = data;

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { firebaseUid },
      include: { farmerProfile: true, cart: true },
    });

    if (!user) {
      // Create user and auto-create cart for customer
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            firebaseUid,
            name,
            email: email || null,
            phone: phone || null,
            role,
          },
        });

        // Initialize cart
        await tx.cart.create({
          data: { userId: newUser.id },
        });

        // If registered as a farmer, create unapproved farmer profile
        if (role === Role.FARMER) {
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
      // Update existing user profile if info provided
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          email: email !== undefined ? email : user.email,
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

    return user;
  }

  static async logout(firebaseUid: string) {
    try {
      await firebaseAuth().revokeRefreshTokens(firebaseUid);
    } catch {
      // Ignore if already revoked
    }
    return { loggedOut: true };
  }
}
