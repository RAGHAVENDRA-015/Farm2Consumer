import { Request, Response, NextFunction } from 'express';
import { ProductService } from './product.service';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { ApiError } from '../../utils/apiError';
import { Role } from '@prisma/client';

export class ProductController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductService.getAll(req.query);
      return sendPaginated(res, result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.getById(req.params.id);
      return sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.farmerProfile) {
        throw ApiError.forbidden('Farmer profile is required to list products', 'FORBIDDEN');
      }

      const product = await ProductService.create(req.user.farmerProfile.id, req.body);
      return sendSuccess(res, product, 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const farmerId = req.user.farmerProfile?.id || '';
      const isAdmin = req.user.role === Role.ADMIN;

      const updated = await ProductService.update(req.params.id, farmerId, req.body, isAdmin);
      return sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  static async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const farmerId = req.user.farmerProfile?.id || '';
      const isAdmin = req.user.role === Role.ADMIN;

      const updated = await ProductService.updateStock(
        req.params.id,
        farmerId,
        req.body.stockQuantity,
        isAdmin
      );
      return sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const farmerId = req.user.farmerProfile?.id || '';
      const isAdmin = req.user.role === Role.ADMIN;

      await ProductService.delete(req.params.id, farmerId, isAdmin);
      return sendSuccess(res, { message: 'Product removed successfully' });
    } catch (error) {
      next(error);
    }
  }
}
