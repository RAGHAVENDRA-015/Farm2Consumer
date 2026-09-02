import { z } from 'zod';
import { PaymentProvider, PaymentStatus } from '@prisma/client';

export const confirmPaymentSchema = {
  body: z.object({
    orderId: z.string().uuid('Invalid order ID'),
    provider: z.nativeEnum(PaymentProvider).default(PaymentProvider.CASH_ON_DELIVERY),
    paymentMethod: z.string().optional().default('COD'),
    transactionId: z.string().optional(),
    status: z.nativeEnum(PaymentStatus).optional().default(PaymentStatus.PAID),
  }),
};

export const paymentIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid payment ID'),
  }),
};
