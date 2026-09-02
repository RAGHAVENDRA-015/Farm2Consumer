import { Request, Response, NextFunction } from 'express';
import { CartService } from './cart.service';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/apiError';

export class CartController {
  static async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const cart = await CartService.getOrCreateCart(req.user.id);
      return sendSuccess(res, cart);
    } catch (error) {
      next(error);
    }
  }

  static async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const { productId, quantity } = req.body;
      const cart = await CartService.addItem(req.user.id, productId, quantity);
      return sendSuccess(res, cart, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const cart = await CartService.updateItemQuantity(req.user.id, req.params.id, req.body.quantity);
      return sendSuccess(res, cart);
    } catch (error) {
      next(error);
    }
  }

  static async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const cart = await CartService.removeItem(req.user.id, req.params.id);
      return sendSuccess(res, cart);
    } catch (error) {
      next(error);
    }
  }

  static async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      await CartService.clearCart(req.user.id);
      return sendSuccess(res, { message: 'Cart cleared successfully' });
    } catch (error) {
      next(error);
    }
  }
}
