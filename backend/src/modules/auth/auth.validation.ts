import { z } from 'zod';
import { Role } from '@prisma/client';

export const syncUserSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address').optional().nullable(),
    phone: z.string().optional().nullable(),
    role: z.nativeEnum(Role).default(Role.CUSTOMER),
    // Optional initial farmer profile data when registering as farmer
    farmName: z.string().optional(),
    bio: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }),
};
