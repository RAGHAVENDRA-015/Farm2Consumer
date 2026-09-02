import { z } from 'zod';
import { OrderStatus, PaymentProvider } from '@prisma/client';

export const createOrderSchema = {
  body: z.object({
    addressId: z.string().uuid('Invalid address ID').optional(),
    deliveryAddress: z
      .object({
        name: z.string().min(2),
        phone: z.string().min(5),
        addressLine: z.string().min(3),
        city: z.string().min(2),
        state: z.string().min(2),
        pincode: z.string().min(4),
      })
      .optional(),
    notes: z.string().optional(),
    paymentProvider: z.nativeEnum(PaymentProvider).default(PaymentProvider.CASH_ON_DELIVERY),
  }),
};

export const updateOrderStatusSchema = {
  params: z.object({
    id: z.string().uuid('Invalid seller order ID'),
  }),
  body: z.object({
    status: z.nativeEnum(OrderStatus),
  }),
};

export const orderIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
};

export const getOrdersQuerySchema = {
  query: z.object({
    status: z.nativeEnum(OrderStatus).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};
