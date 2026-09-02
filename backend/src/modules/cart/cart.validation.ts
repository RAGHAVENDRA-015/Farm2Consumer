import { z } from 'zod';

export const addItemToCartSchema = {
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().positive('Quantity must be greater than 0'),
  }),
};

export const updateCartItemSchema = {
  params: z.object({
    id: z.string().uuid('Invalid cart item ID'),
  }),
  body: z.object({
    quantity: z.number().positive('Quantity must be greater than 0'),
  }),
};

export const cartItemIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid cart item ID'),
  }),
};
