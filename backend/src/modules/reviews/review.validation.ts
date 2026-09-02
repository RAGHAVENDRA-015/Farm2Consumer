import { z } from 'zod';

export const createReviewSchema = {
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
    comment: z.string().min(3, 'Comment must be at least 3 characters').max(1000).optional(),
  }),
};

export const updateReviewSchema = {
  params: z.object({
    id: z.string().uuid('Invalid review ID'),
  }),
  body: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().min(3).max(1000).optional(),
  }),
};

export const reviewIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid review ID'),
  }),
};
