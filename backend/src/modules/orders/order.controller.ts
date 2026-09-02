import { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { ApiError } from '../../utils/apiError';
import { Role } from '@prisma/client';

export class OrderController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const order = await OrderService.createOrderFromCart(req.user.id, req.body);
      return sendSuccess(res, order, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const result = await OrderService.getCustomerOrders(req.user.id, req.query);
      return sendPaginated(res, result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const isAdmin = req.user.role === Role.ADMIN;
      const order = await OrderService.getOrderById(req.params.id, req.user.id, isAdmin);
      return sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const isAdmin = req.user.role === Role.ADMIN;
      const cancelled = await OrderService.cancelOrder(req.params.id, req.user.id, isAdmin);
      return sendSuccess(res, cancelled);
    } catch (error) {
      next(error);
    }
  }
}
