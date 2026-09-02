import { z } from 'zod';

export const createCategorySchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  }),
};

export const updateCategorySchema = {
  params: z.object({
    id: z.string().uuid('Invalid category ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
};

export const categoryIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid category ID'),
  }),
};
