import { OrderStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { ApiError } from '../../utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';

import { UpdateFarmerProfileDTO } from './farmer.validation';

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

  static async updateProfile(userId: string, data: UpdateFarmerProfileDTO) {
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
      salesAggregate,
    ] = await Promise.all([
      prisma.product.count({ where: { farmerId, isDeleted: false } }),
      prisma.product.count({ where: { farmerId, isDeleted: false, isActive: true } }),
      prisma.sellerOrder.count({ where: { farmerId } }),
      prisma.sellerOrder.count({
        where: { farmerId, status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING] } },
      }),
      prisma.sellerOrder.aggregate({
        where: { farmerId, status: { not: OrderStatus.CANCELLED } },
        _sum: { subtotal: true },
      }),
    ]);

    const grossSales = salesAggregate._sum.subtotal || 0;
    const commissionPercent = env.PLATFORM_COMMISSION_PERCENTAGE;
    const commissionAmount = (grossSales * commissionPercent) / 100;
    const netEarnings = grossSales - commissionAmount;

    // Fetch recent seller orders for the farmer's dashboard table
    const recentOrders = await prisma.sellerOrder.findMany({
      where: { farmerId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        order: { select: { id: true, orderNumber: true } },
        orderItems: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    });

    return {
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      grossSales,
      commissionPercent,
      commissionAmount,
      netEarnings,
      recentOrders,
    };
  }

  static async getEarnings(farmerId: string) {
    const [grossSalesAggregate, refundsAggregate, allOrders] = await Promise.all([
      prisma.sellerOrder.aggregate({
        where: { farmerId, status: { not: OrderStatus.CANCELLED } },
        _sum: { subtotal: true },
      }),
      prisma.sellerOrder.aggregate({
        where: { farmerId, status: OrderStatus.REFUNDED },
        _sum: { subtotal: true },
      }),
      prisma.sellerOrder.findMany({
        where: { farmerId, status: { not: OrderStatus.CANCELLED } },
        include: {
          order: { select: { orderNumber: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const grossSales = grossSalesAggregate._sum.subtotal || 0;
    const totalRefunds = refundsAggregate._sum.subtotal || 0;
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
        const net = o.subtotal - commission;
        return {
          id: o.id,
          orderId: o.orderId || o.id,
          orderNumber: o.order?.orderNumber,
          date: o.createdAt,
          subtotal: o.subtotal,
          commission,
          net,
          netAmount: net,
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

  static async getPublicFarmers() {
    return prisma.farmerProfile.findMany({
      where: { isApproved: true },
      include: {
        user: { select: { name: true } },
        _count: {
          select: {
            products: {
              where: { isActive: true, isDeleted: false },
            },
          },
        },
      },
      orderBy: { rating: 'desc' },
    });
  }

  static async getPublicFarmerById(id: string) {
    const farmer = await prisma.farmerProfile.findFirst({
      where: { id, isApproved: true },
      include: {
        user: { select: { name: true } },
        products: {
          where: { isActive: true, isDeleted: false },
          include: {
            category: true,
            images: { orderBy: { displayOrder: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!farmer) {
      throw ApiError.notFound('Farmer profile not found', 'FARMER_NOT_FOUND');
    }

    return farmer;
  }
}
