import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { ApiError } from '../../utils/apiError';

export class NotificationController {
  static async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const result = await NotificationService.getUserNotifications(req.user.id, req.query);
      return sendPaginated(res, result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      await NotificationService.markAsRead(req.user.id, req.params.id);
      return sendSuccess(res, { message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      await NotificationService.markAllAsRead(req.user.id);
      return sendSuccess(res, { message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }
}
