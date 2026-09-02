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
router.get('/products/:id/reviews', ReviewController.getByProduct);

// Authenticated: Create/update/delete reviews
router.post('/products/:id/reviews', authenticate, validate(createReviewSchema), ReviewController.create);
router.patch('/reviews/:id', authenticate, validate(updateReviewSchema), ReviewController.update);
router.delete('/reviews/:id', authenticate, validate(reviewIdParamSchema), ReviewController.delete);

export default router;
