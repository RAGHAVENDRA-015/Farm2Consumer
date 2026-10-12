import { z } from 'zod';

export const syncUserSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address').optional().nullable(),
    phone: z.string().optional().nullable(),
    registerAsFarmer: z.boolean().default(false),
    // Optional initial farmer profile data when registering as farmer
    farmName: z.string().optional(),
    bio: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }),
};

export const registerSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    phone: z.string().optional().nullable(),
    role: z.enum(['CUSTOMER', 'FARMER', 'ADMIN']).default('CUSTOMER'),
    farmName: z.string().optional(),
    bio: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Please enter your password'),
    role: z.enum(['CUSTOMER', 'FARMER', 'ADMIN']).optional(),
  }),
};

export const verifyOtpSchema = {
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    otp: z.string().min(6, 'Verification code must be 6 digits').max(6, 'Verification code must be 6 digits'),
  }),
};

export const resendOtpSchema = {
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    otp: z.string().min(6, 'Verification code must be 6 digits').max(6, 'Verification code must be 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
};

export type SyncUserDTO = z.infer<typeof syncUserSchema.body>;
export type RegisterDTO = z.infer<typeof registerSchema.body>;
export type LoginDTO = z.infer<typeof loginSchema.body>;
export type VerifyOtpDTO = z.infer<typeof verifyOtpSchema.body>;
export type ResendOtpDTO = z.infer<typeof resendOtpSchema.body>;
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema.body>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema.body>;

