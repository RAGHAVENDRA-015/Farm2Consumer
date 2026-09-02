import { Router } from 'express';
import { CartController } from './cart.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  addItemToCartSchema,
  updateCartItemSchema,
  cartItemIdParamSchema,
} from './cart.validation';

const router = Router();

router.use(authenticate);

router.get('/', CartController.getCart);
router.post('/items', validate(addItemToCartSchema), CartController.addItem);
router.patch('/items/:id', validate(updateCartItemSchema), CartController.updateItem);
router.delete('/items/:id', validate(cartItemIdParamSchema), CartController.removeItem);
router.delete('/', CartController.clearCart);

export default router;
