import { OrderStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';
import { env } from '../../config/env';

export class ReviewService {
  private static async recalculateFarmerRating(farmerId: string) {
    const agg = await prisma.review.aggregate({
      where: {
        product: { farmerId },
      },
      _avg: { rating: true },
    });

    const avg = agg._avg.rating || 0.0;
    await prisma.farmerProfile.update({
      where: { id: farmerId },
      data: { rating: Math.round(avg * 10) / 10 },
    });
  }

  static async createReview(
    userId: string,
    productId: string,
    data: { rating: number; comment?: string }
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.isDeleted) {
      throw ApiError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
    }

    // Check if user has purchased this product (non-cancelled order)
    const orderWithProduct = await prisma.order.findFirst({
      where: {
        customerId: userId,
        status: { notIn: [OrderStatus.CANCELLED] },
        sellerOrders: {
          some: {
            status: { not: OrderStatus.CANCELLED },
            orderItems: {
              some: { productId },
            },
          },
        },
      },
    });

    // In strict production, require order; in development/demo allow authenticated customers to review
    if (env.NODE_ENV === 'production' && !env.ENABLE_DEV_AUTH && !orderWithProduct) {
      throw ApiError.forbidden(
        'Only verified purchasers who have ordered this product can write a review.',
        'VERIFIED_PURCHASE_REQUIRED'
      );
    }

    // Check if user already reviewed this product; if so, update gracefully
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_customerId: {
          productId,
          customerId: userId,
        },
      },
    });

    if (existingReview) {
      const updatedReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: data.rating,
          comment: data.comment || null,
        },
        include: {
          customer: { select: { id: true, name: true } },
        },
      });

      await this.recalculateFarmerRating(product.farmerId);
      return updatedReview;
    }

    const review = await prisma.review.create({
      data: {
        productId,
        customerId: userId,
        rating: data.rating,
        comment: data.comment || null,
      },
      include: {
        customer: { select: { id: true, name: true } },
      },
    });

    // Update farmer aggregate rating
    await this.recalculateFarmerRating(product.farmerId);

    return review;
  }

  static async getProductReviews(productId: string, queryParams: any) {
    const { page, limit, skip } = parsePagination(queryParams);

    const [total, items] = await Promise.all([
      prisma.review.count({ where: { productId } }),
      prisma.review.findMany({
        where: { productId },
        include: {
          customer: { select: { id: true, name: true } },
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

  static async updateReview(
    userId: string,
    reviewId: string,
    data: { rating?: number; comment?: string }
  ) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { product: true },
    });

    if (!review) {
      throw ApiError.notFound('Review not found', 'NOT_FOUND');
    }

    if (review.customerId !== userId) {
      throw ApiError.forbidden('You can only update your own review', 'FORBIDDEN');
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data,
      include: { customer: { select: { id: true, name: true } } },
    });

    if (data.rating) {
      await this.recalculateFarmerRating(review.product.farmerId);
    }

    return updated;
  }

  static async deleteReview(userId: string, reviewId: string, isAdmin = false) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { product: true },
    });

    if (!review) {
      throw ApiError.notFound('Review not found', 'NOT_FOUND');
    }

    if (!isAdmin && review.customerId !== userId) {
      throw ApiError.forbidden('You can only delete your own review', 'FORBIDDEN');
    }

    await prisma.review.delete({ where: { id: reviewId } });
    await this.recalculateFarmerRating(review.product.farmerId);

    return { deleted: true };
  }
}
