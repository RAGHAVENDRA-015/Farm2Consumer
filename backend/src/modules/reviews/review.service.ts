import { prisma } from '../../config/database';
import { ApiError } from '../../utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';

export class ReviewService {
  private static async recalculateFarmerRating(farmerId: string) {
    const reviews = await prisma.review.findMany({
      where: {
        product: { farmerId },
      },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      await prisma.farmerProfile.update({
        where: { id: farmerId },
        data: { rating: 0.0 },
      });
      return;
    }

    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
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

    // Check if user has purchased this product
    const orderWithProduct = await prisma.order.findFirst({
      where: {
        customerId: userId,
        sellerOrders: {
          some: {
            orderItems: {
              some: { productId },
            },
          },
        },
      },
    });

    if (!orderWithProduct) {
      throw ApiError.forbidden(
        'Only verified purchasers who have ordered this product can write a review.',
        'VERIFIED_PURCHASE_REQUIRED'
      );
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_customerId: {
          productId,
          customerId: userId,
        },
      },
    });

    if (existingReview) {
      throw ApiError.conflict(
        'You have already submitted a review for this product. You can update your existing review.',
        'REVIEW_ALREADY_EXISTS'
      );
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
