import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/apiError';
import { firebaseAuth } from '../../config/firebase';

export class AuthController {
  static async sync(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw ApiError.unauthorized('Bearer token required to sync user', 'INVALID_TOKEN');
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await firebaseAuth().verifyIdToken(token);

      const user = await AuthService.syncUser({
        firebaseUid: decodedToken.uid,
        name: req.body.name || decodedToken.name || 'FarmLink User',
        email: req.body.email || decodedToken.email || null,
        phone: req.body.phone || decodedToken.phone_number || null,
        role: req.body.role,
        farmName: req.body.farmName,
        bio: req.body.bio,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pincode,
      });

      return sendSuccess(res, user, 200);
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required', 'UNAUTHORIZED');
      }

      const user = await AuthService.getCurrentUser(req.user.id);
      return sendSuccess(res, user, 200);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user) {
        await AuthService.logout(req.user.firebaseUid);
      }
      return sendSuccess(res, { message: 'Logged out successfully' }, 200);
    } catch (error) {
      next(error);
    }
  }
}
