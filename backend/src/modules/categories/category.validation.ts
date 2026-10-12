import { z } from 'zod';

const imageUrlSchema = z
  .string()
  .min(1, 'Image URL is required')
  .refine(
    (val) =>
      val.startsWith('http://') ||
      val.startsWith('https://') ||
      val.startsWith('/') ||
      val.startsWith('data:image/'),
    {
      message: 'Invalid image URL format',
    }
  );

export const createCategorySchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    imageUrl: imageUrlSchema.optional().nullable(),
  }),
};

export const updateCategorySchema = {
  params: z.object({
    id: z.string().uuid('Invalid category ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    imageUrl: imageUrlSchema.optional().nullable(),
    isActive: z.boolean().optional(),
  }),
};

export const categoryIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid category ID'),
  }),
};
