import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/apiError';
import { Role } from '@prisma/client';

export class PaymentController {
  static async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const isAdmin = req.user.role === Role.ADMIN;
      const payment = await PaymentService.confirmPayment(req.user.id, req.body, isAdmin);
      return sendSuccess(res, payment);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const isAdmin = req.user.role === Role.ADMIN;
      const payment = await PaymentService.getPaymentById(req.params.id, req.user.id, isAdmin);
      return sendSuccess(res, payment);
    } catch (error) {
      next(error);
    }
  }
}
