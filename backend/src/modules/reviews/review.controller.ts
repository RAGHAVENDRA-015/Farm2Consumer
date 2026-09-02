import { Request, Response, NextFunction } from 'express';
import { ReviewService } from './review.service';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { ApiError } from '../../utils/apiError';
import { Role } from '@prisma/client';

export class ReviewController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const review = await ReviewService.createReview(req.user.id, req.params.id, req.body);
      return sendSuccess(res, review, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getByProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ReviewService.getProductReviews(req.params.id, req.query);
      return sendPaginated(res, result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const updated = await ReviewService.updateReview(req.user.id, req.params.id, req.body);
      return sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const isAdmin = req.user.role === Role.ADMIN;
      await ReviewService.deleteReview(req.user.id, req.params.id, isAdmin);
      return sendSuccess(res, { message: 'Review deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
