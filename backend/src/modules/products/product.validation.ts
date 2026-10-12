import { z } from 'zod';
import { ProductUnit } from '@prisma/client';

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

export const createProductSchema = {
  body: z.object({
    categoryId: z.string().uuid('Valid Category ID is required'),
    name: z.string().min(2, 'Product name must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().positive('Price must be greater than 0'),
    unit: z.nativeEnum(ProductUnit).default(ProductUnit.KG),
    stockQuantity: z.number().nonnegative('Stock quantity cannot be negative'),
    minimumOrderQuantity: z.number().positive().optional().default(1.0),
    minOrderQuantity: z.number().positive().optional(),
    harvestDate: z.string().datetime().optional().nullable(),
    isOrganic: z.boolean().default(false),
    images: z
      .array(
        z.object({
          imageUrl: imageUrlSchema,
          cloudinaryPublicId: z.string().optional().nullable(),
          displayOrder: z.number().int().optional().default(0),
        })
      )
      .max(5, 'Maximum 5 images per product')
      .optional()
      .default([]),
  }),
};

export const updateProductSchema = {
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    categoryId: z.string().uuid().optional(),
    name: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    price: z.number().positive().optional(),
    unit: z.nativeEnum(ProductUnit).optional(),
    stockQuantity: z.number().nonnegative().optional(),
    minimumOrderQuantity: z.number().positive().optional(),
    minOrderQuantity: z.number().positive().optional(),
    harvestDate: z.string().datetime().optional().nullable(),
    isOrganic: z.boolean().optional(),
    isActive: z.boolean().optional(),
    images: z
      .array(
        z.object({
          imageUrl: imageUrlSchema,
          cloudinaryPublicId: z.string().optional().nullable(),
          displayOrder: z.number().int().optional().default(0),
        })
      )
      .max(5)
      .optional(),
  }),
};

export const updateStockSchema = {
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    stockQuantity: z.number().nonnegative('Stock quantity cannot be negative'),
  }),
};

export const productIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
};

export const getProductsQuerySchema = {
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    farmerId: z.string().optional(),
    minPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
    maxPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
    unit: z.nativeEnum(ProductUnit).optional(),
    isOrganic: z.string().optional().transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
    sort: z.enum(['price_asc', 'price_desc', 'newest', 'rating']).optional().default('newest'),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};

export type CreateProductDTO = z.infer<typeof createProductSchema.body>;
export type UpdateProductDTO = z.infer<typeof updateProductSchema.body>;
export type UpdateStockDTO = z.infer<typeof updateStockSchema.body>;

