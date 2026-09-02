import { Router } from 'express';
import { OrderController } from './order.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createOrderSchema,
  orderIdParamSchema,
  getOrdersQuerySchema,
} from './order.validation';

const router = Router();

router.use(authenticate);

router.post('/', validate(createOrderSchema), OrderController.create);
router.get('/', validate(getOrdersQuerySchema), OrderController.getMyOrders);
router.get('/:id', validate(orderIdParamSchema), OrderController.getById);
router.post('/:id/cancel', validate(orderIdParamSchema), OrderController.cancel);

export default router;
