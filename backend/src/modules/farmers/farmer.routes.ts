import { Router } from 'express';
import { FarmerController } from './farmer.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireFarmer, requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Role } from '@prisma/client';
import {
  updateFarmerProfileSchema,
  updateOrderStatusSchema,
} from './farmer.validation';

const router = Router();

// Protected endpoints for farmers (placed before /:id wildcard so /dashboard etc. aren't matched as an id)
router.get('/profile', authenticate, requireRole([Role.FARMER, Role.ADMIN]), FarmerController.getProfile);
router.patch('/profile', authenticate, requireFarmer, validate(updateFarmerProfileSchema), FarmerController.updateProfile);
router.get('/dashboard', authenticate, requireRole([Role.FARMER, Role.ADMIN]), FarmerController.getDashboard);
router.get('/earnings', authenticate, requireRole([Role.FARMER, Role.ADMIN]), FarmerController.getEarnings);
router.get('/products', authenticate, requireRole([Role.FARMER, Role.ADMIN]), FarmerController.getMyProducts);
router.get('/orders', authenticate, requireRole([Role.FARMER, Role.ADMIN]), FarmerController.getMyOrders);
router.patch('/orders/:id/status', authenticate, requireFarmer, validate(updateOrderStatusSchema), FarmerController.updateOrderStatus);

// Public endpoints for consumers and visitors
router.get('/', FarmerController.getPublicFarmers);
router.get('/:id', FarmerController.getPublicFarmerById);

export default router;
