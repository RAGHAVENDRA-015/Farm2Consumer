import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  updateUserProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
} from './user.validation';

const router = Router();

router.use(authenticate);

router.get('/me', UserController.getMe);
router.patch('/me', validate(updateUserProfileSchema), UserController.updateMe);
router.delete('/me', UserController.deleteMe);

router.get('/me/addresses', UserController.getAddresses);
router.post('/me/addresses', validate(createAddressSchema), UserController.createAddress);
router.patch('/me/addresses/:id', validate(updateAddressSchema), UserController.updateAddress);
router.delete('/me/addresses/:id', validate(addressIdParamSchema), UserController.deleteAddress);

export default router;
