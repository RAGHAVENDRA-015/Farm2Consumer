import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  farmerIdParamSchema,
  userIdParamSchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
} from './admin.validation';
import { productIdParamSchema } from '../products/product.validation';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', AdminController.getDashboard);
router.get('/analytics', AdminController.getAnalytics);

router.get('/farmers', AdminController.getFarmers);
router.get('/farmers/:id', validate(farmerIdParamSchema), AdminController.getFarmerById);
router.patch('/farmers/:id/approve', validate(farmerIdParamSchema), AdminController.approveFarmer);
router.patch('/farmers/:id/reject', validate(farmerIdParamSchema), AdminController.rejectFarmer);

router.get('/customers', AdminController.getCustomers);
router.patch('/users/:id/status', validate(updateUserStatusSchema), AdminController.updateUserStatus);
router.patch('/users/:id/role', validate(updateUserRoleSchema), AdminController.updateUserRole);

router.get('/products', AdminController.getProducts);
router.delete('/products/:id', validate(productIdParamSchema), AdminController.deleteProduct);

router.get('/orders', AdminController.getOrders);

export default router;
