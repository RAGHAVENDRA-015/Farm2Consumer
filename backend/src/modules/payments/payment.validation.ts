import { z } from 'zod';

export const createRazorpayOrderSchema = {
  body: z.object({
    addressId: z.string().optional(),
    deliveryAddress: z.any().optional(),
    notes: z.string().optional(),
  }),
};

export const verifyPaymentSchema = {
  body: z.object({
    razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
    razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
    razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
    addressId: z.string().optional(),
    deliveryAddress: z.any().optional(),
    notes: z.string().optional(),
    paymentMethod: z.string().optional(),
  }),
};

export const confirmPaymentSchema = {
  body: z.object({
    orderId: z.string().uuid('Invalid order ID'),
    paymentMethod: z.string().optional(),
  }),
};

export const paymentIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid payment ID'),
  }),
};

export type CreateRazorpayOrderDTO = z.infer<typeof createRazorpayOrderSchema.body>;
export type VerifyPaymentDTO = z.infer<typeof verifyPaymentSchema.body>;
export type ConfirmPaymentDTO = z.infer<typeof confirmPaymentSchema.body>;
