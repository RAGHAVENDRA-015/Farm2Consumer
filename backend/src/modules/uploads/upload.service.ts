import { cloudinary } from '../../config/cloudinary';
import { env } from '../../config/env';
import { ApiError } from '../../utils/apiError';
import { logger } from '../../utils/logger';

export class UploadService {
  static generateSignature(folder = 'farmlink/products') {
    if (!env.CLOUDINARY_API_SECRET || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_CLOUD_NAME) {
      throw ApiError.badRequest('Cloudinary credentials are not configured on the server', 'CLOUDINARY_NOT_CONFIGURED');
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = {
      folder,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, env.CLOUDINARY_API_SECRET);

    return {
      signature,
      timestamp,
      apiKey: env.CLOUDINARY_API_KEY,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      folder,
    };
  }

  static async uploadFile(
    file: Express.Multer.File,
    baseUrl: string,
    _folder = 'farmlink/products'
  ): Promise<{ imageUrl: string; publicId: string }> {
    // Serve the local file stored securely on the backend server
    const localUrl = `${baseUrl}/uploads/products/${file.filename}`;
    logger.info(`[Upload] Produce image saved locally: ${file.filename}`);
    return {
      imageUrl: localUrl,
      publicId: `local-${file.filename}`,
    };
  }

  static async destroyImage(publicId: string): Promise<boolean> {
    try {
      if (!env.CLOUDINARY_API_SECRET) return false;
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (err) {
      logger.error('Failed to destroy Cloudinary image:', err);
      return false;
    }
  }
}
