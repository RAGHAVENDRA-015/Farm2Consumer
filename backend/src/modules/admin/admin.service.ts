import { Role, OrderStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { ApiError } from '../../utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';

export class AdminService {
  static async getDashboard() {
    const [
      totalCustomers,
      totalFarmers,
      approvedFarmers,
      totalProducts,
      totalOrders,
      completedOrders,
      cancelledOrders,
      orders,
    ] = await Promise.all([
      prisma.user.count({ where: { role: Role.CUSTOMER } }),
      prisma.farmerProfile.count(),
      prisma.farmerProfile.count({ where: { isApproved: true } }),
      prisma.product.count({ where: { isDeleted: false } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      prisma.order.findMany({
        where: { status: { not: OrderStatus.CANCELLED } },
        select: { totalAmount: true },
      }),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const commissionPercent = env.PLATFORM_COMMISSION_PERCENTAGE;
    const platformCommission = (totalRevenue * commissionPercent) / 100;

    return {
      totalCustomers,
      totalFarmers,
      approvedFarmers,
      pendingFarmers: totalFarmers - approvedFarmers,
      totalProducts,
      totalOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      platformCommission,
    };
  }

  static async getFarmers(queryParams: any) {
    const { page, limit, skip } = parsePagination(queryParams);
    const isApproved = queryParams.isApproved !== undefined
      ? queryParams.isApproved === 'true'
      : undefined;

    const where: any = {};
    if (isApproved !== undefined) {
      where.isApproved = isApproved;
    }

    const [total, items] = await Promise.all([
      prisma.farmerProfile.count({ where }),
      prisma.farmerProfile.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true } },
          _count: {
            select: { products: true, sellerOrders: true },
          },
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

  static async getFarmerById(farmerId: string) {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { id: farmerId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
        products: { where: { isDeleted: false }, include: { category: true, images: true } },
        sellerOrders: { include: { order: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!farmer) {
      throw ApiError.notFound('Farmer not found', 'NOT_FOUND');
    }

    return farmer;
  }

  static async approveFarmer(farmerId: string) {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { id: farmerId },
    });

    if (!farmer) {
      throw ApiError.notFound('Farmer not found', 'NOT_FOUND');
    }

    const updated = await prisma.farmerProfile.update({
      where: { id: farmerId },
      data: {
        isApproved: true,
        approvedAt: new Date(),
      },
      include: { user: true },
    });

    // Notify farmer
    await prisma.notification.create({
      data: {
        userId: farmer.userId,
        type: 'FARMER_APPROVED',
        title: 'Farm Account Approved! 🎉',
        message: 'Congratulations! Your farmer account has been approved. You can now list and sell products on FarmLink.',
      },
    });

    return updated;
  }

  static async rejectFarmer(farmerId: string) {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { id: farmerId },
    });

    if (!farmer) {
      throw ApiError.notFound('Farmer not found', 'NOT_FOUND');
    }

    const updated = await prisma.farmerProfile.update({
      where: { id: farmerId },
      data: {
        isApproved: false,
      },
    });

    // Notify farmer
    await prisma.notification.create({
      data: {
        userId: farmer.userId,
        type: 'FARMER_REJECTED',
        title: 'Farm Account Status Updated',
        message: 'Your farmer profile status has been suspended/rejected by the administration.',
      },
    });

    return updated;
  }

  static async getCustomers(queryParams: any) {
    const { page, limit, skip } = parsePagination(queryParams);

    const where = { role: Role.CUSTOMER };

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: {
          _count: { select: { orders: true, reviews: true } },
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

  static async updateUserStatus(userId: string, isActive: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  }

  static async getAllOrders(queryParams: any) {
    const { page, limit, skip } = parsePagination(queryParams);

    const [total, items] = await Promise.all([
      prisma.order.count(),
      prisma.order.findMany({
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          sellerOrders: {
            include: {
              farmer: { select: { id: true, farmName: true } },
              orderItems: true,
            },
          },
          payments: true,
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

  static async getAnalytics() {
    const categoriesWithOrderCount = await prisma.category.findMany({
      include: {
        products: {
          include: {
            orderItems: true,
          },
        },
      },
    });

    const categoryStats = categoriesWithOrderCount.map((cat) => {
      let totalSold = 0;
      cat.products.forEach((p) => {
        p.orderItems.forEach((oi) => {
          totalSold += oi.quantity;
        });
      });
      return {
        categoryName: cat.name,
        totalSold,
      };
    });

    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
      },
    });

    return {
      categoryStats,
      recentOrders,
    };
  }
}
