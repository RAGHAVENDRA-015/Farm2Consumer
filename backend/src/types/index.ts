import { User, FarmerProfile, Role } from '@prisma/client';
import { DecodedIdToken } from 'firebase-admin/auth';

export type UserWithFarmerProfile = User & {
  farmerProfile?: FarmerProfile | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: UserWithFarmerProfile;
      firebaseUser?: DecodedIdToken;
    }
  }
}
