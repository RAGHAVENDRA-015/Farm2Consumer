import { z } from 'zod';
import { Role } from '@prisma/client';

export const farmerIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid farmer ID'),
  }),
};

export const userIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
};

export const updateUserStatusSchema = {
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    isActive: z.boolean(),
  }),
};

export const updateUserRoleSchema = {
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    role: z.nativeEnum(Role),
  }),
};

