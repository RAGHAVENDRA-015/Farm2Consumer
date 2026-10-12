import { Router } from 'express';
import { ReviewController } from './review.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createReviewSchema,
  updateReviewSchema,
  reviewIdParamSchema,
} from './review.validation';

const router = Router();

// Public: Get reviews for a product
router.get('/product/:id', ReviewController.getByProduct);
router.get('/products/:id/reviews', ReviewController.getByProduct); // legacy alias

// Authenticated: Create/update/delete reviews
router.post('/product/:id', authenticate, validate(createReviewSchema), ReviewController.create);
router.post('/products/:id/reviews', authenticate, validate(createReviewSchema), ReviewController.create); // legacy alias

router.patch('/:id', authenticate, validate(updateReviewSchema), ReviewController.update);
router.patch('/reviews/:id', authenticate, validate(updateReviewSchema), ReviewController.update); // legacy alias

router.delete('/:id', authenticate, validate(reviewIdParamSchema), ReviewController.delete);
router.delete('/reviews/:id', authenticate, validate(reviewIdParamSchema), ReviewController.delete); // legacy alias

export default router;
