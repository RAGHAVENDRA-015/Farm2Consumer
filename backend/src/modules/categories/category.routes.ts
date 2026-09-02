import { Router } from 'express';
import { CategoryController } from './category.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from './category.validation';

const router = Router();

router.get('/', CategoryController.getAll);
router.get('/:id', validate(categoryIdParamSchema), CategoryController.getById);

// Admin-only endpoints
router.post('/', authenticate, requireAdmin, validate(createCategorySchema), CategoryController.create);
router.patch('/:id', authenticate, requireAdmin, validate(updateCategorySchema), CategoryController.update);
router.delete('/:id', authenticate, requireAdmin, validate(categoryIdParamSchema), CategoryController.delete);

export default router;
