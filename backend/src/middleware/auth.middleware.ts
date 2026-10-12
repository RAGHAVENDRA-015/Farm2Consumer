import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../config/firebase';
import { prisma } from '../config/database';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { verifySessionToken } from '../utils/security';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const devUserQuery = req.query.devUser as string | undefined;

    // 1. Development convenience tokens
    if (
      env.ENABLE_DEV_AUTH &&
      env.NODE_ENV !== 'production' &&
      (devUserQuery || (authHeader && authHeader.startsWith('Bearer dev-')))
    ) {
      const devType = devUserQuery || (authHeader ? authHeader.replace('Bearer dev-', '').replace('-token', '') : '');
      const seedUid = devType.toLowerCase() === 'admin'
        ? 'admin-seed-uid-001'
        : devType.toLowerCase() === 'farmer'
        ? 'farmer-seed-uid-001'
        : devType.toLowerCase() === 'customer'
        ? 'customer-seed-uid-001'
        : devType;

      let devUser = await prisma.user.findUnique({
        where: { firebaseUid: seedUid },
        include: { farmerProfile: true },
      });

      if (!devUser && devType) {
        devUser = await prisma.user.findFirst({
          where: {
            OR: [
              { firebaseUid: devType },
              { email: devType },
            ],
          },
          include: { farmerProfile: true },
        });
      }

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

    // 2. FarmLink Signed Session Token (Database-Backed Auth)
    if (token.startsWith('fl_')) {
      const payload = verifySessionToken(token);
      if (!payload) {
        throw ApiError.unauthorized('Session has expired or token is invalid. Please sign in again.', 'INVALID_TOKEN');
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { farmerProfile: true },
      });

      if (!user) {
        throw ApiError.unauthorized('User not found in system database.', 'USER_NOT_FOUND');
      }

      if (!user.isActive) {
        throw ApiError.forbidden('Your account has been deactivated by an administrator.', 'ACCOUNT_DEACTIVATED');
      }

      req.user = user;
      return next();
    }

    // 3. Firebase Auth Token
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
        if (token.startsWith('fl_')) {
          const payload = verifySessionToken(token);
          if (payload) {
            const user = await prisma.user.findUnique({
              where: { id: payload.userId },
              include: { farmerProfile: true },
            });
            if (user && user.isActive) {
              req.user = user;
            }
          }
        } else {
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
    }
    next();
  } catch (error) {
    next(error);
  }
};
