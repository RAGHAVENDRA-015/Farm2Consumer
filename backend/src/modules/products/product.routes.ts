import { Router } from 'express';
import { ProductController } from './product.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireApprovedFarmer } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
  productIdParamSchema,
  getProductsQuerySchema,
} from './product.validation';

const router = Router();

// Public routes
router.get('/', validate(getProductsQuerySchema), ProductController.getAll);
router.get('/:id', validate(productIdParamSchema), ProductController.getById);

// Farmer protected routes (Approved Farmers only)
router.post(
  '/',
  authenticate,
  requireApprovedFarmer,
  validate(createProductSchema),
  ProductController.create
);

router.patch(
  '/:id',
  authenticate,
  validate(updateProductSchema),
  ProductController.update
);

router.patch(
  '/:id/stock',
  authenticate,
  validate(updateStockSchema),
  ProductController.updateStock
);

router.delete(
  '/:id',
  authenticate,
  validate(productIdParamSchema),
  ProductController.delete
);

export default router;
