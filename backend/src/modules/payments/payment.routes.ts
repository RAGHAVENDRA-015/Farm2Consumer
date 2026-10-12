import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createRazorpayOrderSchema,
  verifyPaymentSchema,
  confirmPaymentSchema,
} from './payment.validation';

const router = Router();

// 1. Create Razorpay order before creating DB order
router.post(
  '/create-order',
  authenticate,
  validate(createRazorpayOrderSchema),
  PaymentController.createRazorpayOrder
);

// 2. Verify signature server-side and create DB order upon payment success
router.post(
  '/verify',
  authenticate,
  validate(verifyPaymentSchema),
  PaymentController.verifyPayment
);

// 3. Webhook endpoint for Razorpay asynchronous events
router.post('/webhook', PaymentController.webhook);

// 4. Confirm payment (admin/farmer on COD delivery)
router.post(
  '/confirm',
  authenticate,
  validate(confirmPaymentSchema),
  PaymentController.confirm
);

export default router;
