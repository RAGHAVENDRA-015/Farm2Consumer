import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // If it's our custom ApiError
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        ...(err.fields ? { fields: err.fields } : {}),
      },
    });
    return;
  }

  // Handle Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta?.target.join(', ') : 'field';
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: `A record with this ${target} already exists.`,
        },
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'The requested record was not found in the database.',
        },
      });
      return;
    }
  }

  // Handle Firebase Auth errors
  if ((err as any).code && typeof (err as any).code === 'string' && (err as any).code.startsWith('auth/')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'FIREBASE_AUTH_ERROR',
        message: err.message,
      },
    });
    return;
  }

  // Unhandled unexpected errors
  logger.error('Unhandled internal server error:', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.NODE_ENV === 'production' ? 'An unexpected internal server error occurred.' : err.message,
    },
  });
};
