import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../config/firebase';
import { prisma } from '../config/database';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

import { env } from '../config/env';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const devUserQuery = req.query.devUser as string | undefined;

    // Development convenience: Allow testing directly in browser with ?devUser=admin / farmer / customer
    if (env.NODE_ENV === 'development' && (devUserQuery || (authHeader && authHeader.startsWith('Bearer dev-')))) {
      const devType = devUserQuery || (authHeader ? authHeader.replace('Bearer dev-', '').replace('-token', '') : '');
      const seedUid = devType.toLowerCase() === 'admin'
        ? 'admin-seed-uid-001'
        : devType.toLowerCase() === 'farmer'
        ? 'farmer-seed-uid-001'
        : 'customer-seed-uid-001';

      const devUser = await prisma.user.findUnique({
        where: { firebaseUid: seedUid },
        include: { farmerProfile: true },
      });

      if (devUser) {
        req.user = devUser;
        return next();
      }
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication token missing or invalid format', 'INVALID_TOKEN');
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      throw ApiError.unauthorized('Bearer token is required', 'INVALID_TOKEN');
    }

    let decodedToken;
    try {
      decodedToken = await firebaseAuth().verifyIdToken(token);
    } catch (err: any) {
      logger.warn(`Firebase token verification failed: ${err.message}`);
      throw ApiError.unauthorized('Invalid or expired authentication token', 'INVALID_TOKEN');
    }

    req.firebaseUser = decodedToken;

    // Lookup user in PostgreSQL database
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      include: {
        farmerProfile: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized(
        'User not found in system database. Please sync account first.',
        'USER_NOT_FOUND'
      );
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated by an administrator.', 'ACCOUNT_DEACTIVATED');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      if (token) {
        try {
          const decodedToken = await firebaseAuth().verifyIdToken(token);
          req.firebaseUser = decodedToken;

          const user = await prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid },
            include: { farmerProfile: true },
          });

          if (user && user.isActive) {
            req.user = user;
          }
        } catch {
          // Ignore invalid token for optional authentication
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
