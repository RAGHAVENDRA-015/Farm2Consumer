import { z } from 'zod';

export const updateUserProfileSchema = {
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
  }),
};

export const createAddressSchema = {
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    phone: z.string().min(5, 'Phone number is required'),
    addressLine: z.string().min(3, 'Address line is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().min(4, 'Pincode is required'),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    isDefault: z.boolean().optional().default(false),
  }),
};

export const updateAddressSchema = {
  params: z.object({
    id: z.string().uuid('Invalid address ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(5).optional(),
    addressLine: z.string().min(3).optional(),
    city: z.string().min(2).optional(),
    state: z.string().min(2).optional(),
    pincode: z.string().min(4).optional(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    isDefault: z.boolean().optional(),
  }),
};

export const addressIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid address ID'),
  }),
};

export type UpdateUserProfileDTO = z.infer<typeof updateUserProfileSchema.body>;
export type CreateAddressDTO = z.infer<typeof createAddressSchema.body>;
export type UpdateAddressDTO = z.infer<typeof updateAddressSchema.body>;

