import { Request, Response, NextFunction } from 'express';
import { FarmerService } from './farmer.service';
import { OrderService } from '../orders/order.service';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { ApiError } from '../../utils/apiError';

export class FarmerController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const profile = await FarmerService.getProfile(req.user.id);
      return sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const updated = await FarmerService.updateProfile(req.user.id, req.body);
      return sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.farmerProfile) {
        throw ApiError.forbidden('Farmer profile not found', 'FARMER_PROFILE_MISSING');
      }
      const dashboard = await FarmerService.getDashboard(req.user.farmerProfile.id);
      return sendSuccess(res, dashboard);
    } catch (error) {
      next(error);
    }
  }

  static async getEarnings(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.farmerProfile) {
        throw ApiError.forbidden('Farmer profile not found', 'FARMER_PROFILE_MISSING');
      }
      const earnings = await FarmerService.getEarnings(req.user.farmerProfile.id);
      return sendSuccess(res, earnings);
    } catch (error) {
      next(error);
    }
  }

  static async getMyProducts(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.farmerProfile) {
        throw ApiError.forbidden('Farmer profile not found', 'FARMER_PROFILE_MISSING');
      }
      const result = await FarmerService.getFarmerProducts(req.user.farmerProfile.id, req.query);
      return sendPaginated(res, result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.farmerProfile) {
        throw ApiError.forbidden('Farmer profile not found', 'FARMER_PROFILE_MISSING');
      }
      const result = await OrderService.getFarmerOrders(req.user.farmerProfile.id, req.query);
      return sendPaginated(res, result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.farmerProfile) {
        throw ApiError.forbidden('Farmer profile not found', 'FARMER_PROFILE_MISSING');
      }
      const updated = await OrderService.updateFarmerOrderStatus(
        req.user.farmerProfile.id,
        req.params.id,
        req.body.status
      );
      return sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  static async getPublicFarmers(_req: Request, res: Response, next: NextFunction) {
    try {
      const farmers = await FarmerService.getPublicFarmers();
      return sendSuccess(res, farmers);
    } catch (error) {
      next(error);
    }
  }

  static async getPublicFarmerById(req: Request, res: Response, next: NextFunction) {
    try {
      const farmer = await FarmerService.getPublicFarmerById(req.params.id);
      return sendSuccess(res, farmer);
    } catch (error) {
      next(error);
    }
  }
}
