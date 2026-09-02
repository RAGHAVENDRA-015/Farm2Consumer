import { z } from 'zod';

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
