import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.string().default('5001').transform((val) => parseInt(val, 10)),
    API_PREFIX: z.string().default('/api/v1'),
    CLIENT_URL: z.string().default('http://localhost:5173'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    ENABLE_DEV_AUTH: z
      .string()
      .default('false')
      .transform((val) => val.toLowerCase() === 'true' || val === '1'),
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    GMAIL_USER: z.string().optional(),
    GMAIL_APP_PASSWORD: z.string().optional(),
    PLATFORM_COMMISSION_PERCENTAGE: z.string().default('5').transform((val) => parseFloat(val)),
    RAZORPAY_KEY_ID: z
      .string()
      .default(process.env.RAZORPAY_KEY_ID || process.env.RAZOR_PAY_API_KEY || 'rzp_test_TXa00JAKz8xXk4'),
    RAZORPAY_KEY_SECRET: z
      .string()
      .default(process.env.RAZORPAY_KEY_SECRET || process.env.RAZOR_PAY_SECRET || 'wK3pJJFxn6dlM1pLUFOb3a2s'),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production' && data.ENABLE_DEV_AUTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ENABLE_DEV_AUTH must not be true in production mode!',
        path: ['ENABLE_DEV_AUTH'],
      });
    }
  });

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
