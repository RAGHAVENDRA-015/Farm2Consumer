import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/apiError';

export const requireRole = (allowedRoles: Role | Role[]) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required', 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Requires one of the following roles: ${roles.join(', ')}`,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
};

export const requireAdmin = requireRole([Role.ADMIN]);

export const requireFarmer = requireRole([Role.FARMER]);

export const requireCustomer = requireRole([Role.CUSTOMER]);

export const requireApprovedFarmer = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required', 'UNAUTHORIZED'));
  }

  if (req.user.role !== Role.FARMER) {
    return next(ApiError.forbidden('Only farmers can perform this action', 'FORBIDDEN'));
  }

  if (!req.user.farmerProfile) {
    return next(
      ApiError.forbidden(
        'Farmer profile is not created yet. Please complete your farm profile first.',
        'FARMER_PROFILE_MISSING'
      )
    );
  }

  if (!req.user.farmerProfile.isApproved) {
    return next(
      ApiError.forbidden(
        'Your farmer account is currently awaiting administrator verification and approval.',
        'FARMER_NOT_APPROVED'
      )
    );
  }

  next();
};
