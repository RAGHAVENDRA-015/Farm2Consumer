import { Router } from 'express';
import { FarmerController } from './farmer.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireFarmer } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  updateFarmerProfileSchema,
  updateOrderStatusSchema,
} from './farmer.validation';

const router = Router();

router.use(authenticate, requireFarmer);

router.get('/profile', FarmerController.getProfile);
router.patch('/profile', validate(updateFarmerProfileSchema), FarmerController.updateProfile);

router.get('/dashboard', FarmerController.getDashboard);
router.get('/earnings', FarmerController.getEarnings);
router.get('/products', FarmerController.getMyProducts);
router.get('/orders', FarmerController.getMyOrders);
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), FarmerController.updateOrderStatus);

export default router;
