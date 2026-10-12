import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { authLimiter } from '../../middleware/rateLimit.middleware';
import {
  syncUserSchema,
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), AuthController.verifyOtp);
router.post('/resend-otp', authLimiter, validate(resendOtpSchema), AuthController.resendOtp);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), AuthController.resetPassword);

router.post('/sync', authLimiter, validate(syncUserSchema), AuthController.sync);
router.get('/me', authenticate, AuthController.me);
router.post('/logout', authenticate, AuthController.logout);

export default router;
