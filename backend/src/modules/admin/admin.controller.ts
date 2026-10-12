import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { ProductService } from '../products/product.service';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { ApiError } from '../../utils/apiError';

export class AdminController {
  static async getDashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getDashboard();
      return sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  static async getFarmers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getFarmers(req.query);
      return sendPaginated(res, result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getFarmerById(req: Request, res: Response, next: NextFunction) {
    try {
      const farmer = await AdminService.getFarmerById(req.params.id);
      return sendSuccess(res, farmer);
    } catch (error) {
      next(error);
    }
  }

  static async approveFarmer(req: Request, res: Response, next: NextFunction) {
    try {
      const approved = await AdminService.approveFarmer(req.params.id);
      return sendSuccess(res, approved);
    } catch (error) {
      next(error);
    }
  }

  static async rejectFarmer(req: Request, res: Response, next: NextFunction) {
    try {
      const rejected = await AdminService.rejectFarmer(req.params.id);
      return sendSuccess(res, rejected);
    } catch (error) {
      next(error);
    }
  }

  static async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getCustomers(req.query);
      return sendPaginated(res, result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const updated = await AdminService.updateUserStatus(req.user.id, req.params.id, req.body.isActive);
      return sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const updated = await AdminService.updateUserRole(req.user.id, req.params.id, req.body.role);
      return sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductService.getAll({ ...req.query, includeInactive: true });
      return sendPaginated(res, result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      await ProductService.delete(req.params.id, '', true);
      return sendSuccess(res, { message: 'Product deleted by admin' });
    } catch (error) {
      next(error);
    }
  }

  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getAllOrders(req.query);
      return sendPaginated(res, result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getAnalytics(_req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await AdminService.getAnalytics();
      return sendSuccess(res, analytics);
    } catch (error) {
      next(error);
    }
  }
}
