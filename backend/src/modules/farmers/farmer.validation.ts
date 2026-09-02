import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const updateFarmerProfileSchema = {
  body: z.object({
    farmName: z.string().min(2).optional(),
    bio: z.string().optional(),
    address: z.string().min(3).optional(),
    city: z.string().min(2).optional(),
    state: z.string().min(2).optional(),
    pincode: z.string().min(4).optional(),
    farmLatitude: z.number().optional().nullable(),
    farmLongitude: z.number().optional().nullable(),
  }),
};

export const updateOrderStatusSchema = {
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    status: z.nativeEnum(OrderStatus),
  }),
};
