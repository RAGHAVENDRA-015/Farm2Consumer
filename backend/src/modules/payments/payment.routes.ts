import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  confirmPaymentSchema,
  paymentIdParamSchema,
} from './payment.validation';

const router = Router();

router.use(authenticate);

router.post('/confirm', validate(confirmPaymentSchema), PaymentController.confirm);
router.get('/:id', validate(paymentIdParamSchema), PaymentController.getById);

export default router;
