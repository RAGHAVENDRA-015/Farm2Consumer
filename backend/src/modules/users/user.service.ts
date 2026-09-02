import { prisma } from '../../config/database';
import { ApiError } from '../../utils/apiError';

export class UserService {
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        farmerProfile: true,
        addresses: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    return user;
  }

  static async updateProfile(userId: string, data: { name?: string; email?: string | null; phone?: string | null }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      include: { farmerProfile: true },
    });
  }

  static async deleteAccount(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  static async getAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  static async createAddress(userId: string, data: any) {
    // If setting as default, unset previous default
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    } else {
      // If this is the user's first address, make it default automatically
      const count = await prisma.address.count({ where: { userId } });
      if (count === 0) {
        data.isDefault = true;
      }
    }

    return prisma.address.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  static async updateAddress(userId: string, addressId: string, data: any) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw ApiError.notFound('Address not found or does not belong to user', 'NOT_FOUND');
    }

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    return prisma.address.update({
      where: { id: addressId },
      data,
    });
  }

  static async deleteAddress(userId: string, addressId: string) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw ApiError.notFound('Address not found or does not belong to user', 'NOT_FOUND');
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    // If deleted address was default, make the most recent one default if any remain
    if (address.isDefault) {
      const remaining = await prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (remaining) {
        await prisma.address.update({
          where: { id: remaining.id },
          data: { isDefault: true },
        });
      }
    }

    return { deleted: true };
  }
}
