import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/apiError';

export class PaymentController {
  /**
   * POST /api/v1/payments/create-order
   * Creates a Razorpay order from user's current cart before creating any DB order.
   */
  static async createRazorpayOrder(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const order = await PaymentService.createRazorpayOrder(req.user.id, req.body);
      return sendSuccess(res, order, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payments/verify
   * Verifies HMAC SHA256 signature server-side and creates DB order upon verified payment.
   */
  static async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const order = await PaymentService.verifyPaymentAndCreateOrder(req.user.id, req.body);
      return sendSuccess(res, order, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payments/webhook
   * Handles asynchronous webhooks from Razorpay.
   */
  static async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const rawBody = JSON.stringify(req.body);
      const result = await PaymentService.handleWebhook(rawBody, signature);
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payments/confirm
   * Manual confirmation for COD on delivery or admin status update.
   */
  static async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const payment = await PaymentService.confirmPayment(
        {
          id: req.user.id,
          role: req.user.role,
          farmerProfile: req.user.farmerProfile,
        },
        req.body
      );
      return sendSuccess(res, payment, 200);
    } catch (error) {
      next(error);
    }
  }
}
