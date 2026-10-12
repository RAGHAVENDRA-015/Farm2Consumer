import { Request, Response, NextFunction } from 'express';
import { UploadService } from './upload.service';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/apiError';

export class UploadController {
  static getSignature(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const folder = (req.query.folder as string) || 'farmlink/products';
      const signatureData = UploadService.generateSignature(folder);
      return sendSuccess(res, signatureData);
    } catch (error) {
      next(error);
    }
  }

  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      if (!req.file) {
        throw ApiError.badRequest('No image file provided', 'FILE_REQUIRED');
      }

      const folder = (req.query.folder as string) || 'farmlink/products';
      const protocol = req.protocol;
      const host = req.get('host') || 'localhost:5001';
      const baseUrl = `${protocol}://${host}`;

      const result = await UploadService.uploadFile(req.file, baseUrl, folder);
      return sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }
}
