import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/apiError';

export class UserController {
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const profile = await UserService.getProfile(req.user.id);
      return sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const updated = await UserService.updateProfile(req.user.id, req.body);
      return sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  static async deleteMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      await UserService.deleteAccount(req.user.id);
      return sendSuccess(res, { message: 'Account deactivated successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const addresses = await UserService.getAddresses(req.user.id);
      return sendSuccess(res, addresses);
    } catch (error) {
      next(error);
    }
  }

  static async createAddress(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const address = await UserService.createAddress(req.user.id, req.body);
      return sendSuccess(res, address, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const address = await UserService.updateAddress(req.user.id, req.params.id, req.body);
      return sendSuccess(res, address);
    } catch (error) {
      next(error);
    }
  }

  static async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      await UserService.deleteAddress(req.user.id, req.params.id);
      return sendSuccess(res, { message: 'Address removed successfully' });
    } catch (error) {
      next(error);
    }
  }
}
