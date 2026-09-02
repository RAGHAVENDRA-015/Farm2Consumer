import { OrderStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { ApiError } from '../../utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';

export class FarmerService {
  static async getProfile(userId: string) {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    if (!farmer) {
      throw ApiError.notFound('Farmer profile not found', 'FARMER_NOT_FOUND');
    }

    return farmer;
  }

  static async updateProfile(userId: string, data: any) {
    const farmer = await prisma.farmerProfile.findUnique({ where: { userId } });
    if (!farmer) {
      throw ApiError.notFound('Farmer profile not found', 'FARMER_NOT_FOUND');
    }

    return prisma.farmerProfile.update({
      where: { userId },
      data,
      include: { user: { select: { name: true, email: true, phone: true } } },
    });
  }

  static async getDashboard(farmerId: string) {
    const [
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      sellerOrders,
    ] = await Promise.all([
      prisma.product.count({ where: { farmerId, isDeleted: false } }),
      prisma.product.count({ where: { farmerId, isDeleted: false, isActive: true } }),
      prisma.sellerOrder.count({ where: { farmerId } }),
      prisma.sellerOrder.count({
        where: { farmerId, status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING] } },
      }),
      prisma.sellerOrder.findMany({
        where: { farmerId, status: { not: OrderStatus.CANCELLED } },
        select: { subtotal: true },
      }),
    ]);

    const grossSales = sellerOrders.reduce((sum, order) => sum + order.subtotal, 0);
    const commissionPercent = env.PLATFORM_COMMISSION_PERCENTAGE;
    const commissionAmount = (grossSales * commissionPercent) / 100;
    const netEarnings = grossSales - commissionAmount;

    return {
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      grossSales,
      commissionPercent,
      commissionAmount,
      netEarnings,
    };
  }

  static async getEarnings(farmerId: string) {
    const [allOrders, refundedOrders] = await Promise.all([
      prisma.sellerOrder.findMany({
        where: { farmerId, status: { not: OrderStatus.CANCELLED } },
        include: {
          order: { select: { orderNumber: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sellerOrder.findMany({
        where: { farmerId, status: OrderStatus.REFUNDED },
        select: { subtotal: true },
      }),
    ]);

    const grossSales = allOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const totalRefunds = refundedOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const commissionRate = env.PLATFORM_COMMISSION_PERCENTAGE;
    const platformCommission = (grossSales * commissionRate) / 100;
    const netEarnings = grossSales - platformCommission - totalRefunds;

    return {
      summary: {
        grossSales,
        platformCommissionRate: `${commissionRate}%`,
        platformCommission,
        totalRefunds,
        netEarnings,
      },
      transactions: allOrders.map((o) => {
        const commission = (o.subtotal * commissionRate) / 100;
        return {
          id: o.id,
          orderNumber: o.order.orderNumber,
          date: o.createdAt,
          subtotal: o.subtotal,
          commission,
          net: o.subtotal - commission,
          status: o.status,
        };
      }),
    };
  }

  static async getFarmerProducts(farmerId: string, queryParams: any) {
    const { page, limit, skip } = parsePagination(queryParams);

    const where = {
      farmerId,
      isDeleted: false,
    };

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: { orderBy: { displayOrder: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }
}
