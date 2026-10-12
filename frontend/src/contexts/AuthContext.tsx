import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User as FirebaseUser,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { env } from '../config/env';
import { User, Role } from '../types';
import { authService, SyncUserData } from '../services/auth.service';

export interface RegisterResult {
  requiresVerification: boolean;
  email: string;
  otpHint?: string;
  user?: User;
}

export interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: Role | null;
  isFarmer: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  isApprovedFarmer: boolean;
  loginWithEmail: (email: string, pass: string, targetRole?: 'CUSTOMER' | 'FARMER' | 'ADMIN') => Promise<User>;
  loginWithDevToken: (role: 'CUSTOMER' | 'FARMER' | 'ADMIN') => Promise<User>;
  registerUser: (
    name: string,
    email: string,
    pass: string,
    registerAsFarmer?: boolean,
    farmDetails?: Partial<SyncUserData>
  ) => Promise<RegisterResult>;
  verifyEmailOtp: (email: string, otp: string) => Promise<User>;
  resendEmailOtp: (email: string) => Promise<{ otpHint?: string; message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; email: string; otpHint?: string; message: string }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const EMAIL_VALIDATION_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('farmlink_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('farmlink_token');
      if (!token) {
        setUser(null);
        return;
      }
      const me = await authService.getMe();
      setUser(me);
      localStorage.setItem('farmlink_user', JSON.stringify(me));
    } catch {
      localStorage.removeItem('farmlink_token');
      localStorage.removeItem('farmlink_user');
      setUser(null);
    }
  }, []);

  // Initialize and listen to Auth state
  useEffect(() => {
    const handleLogoutEvent = () => {
      setUser(null);
      setFirebaseUser(null);
    };
    window.addEventListener('auth:logout', handleLogoutEvent);

    const existingToken = localStorage.getItem('farmlink_token');

    // If using dev token or strong signed database token, hydrate session directly
    if (existingToken && (existingToken.startsWith('fl_') || existingToken.startsWith('dev-'))) {
      refreshProfile().finally(() => setIsLoading(false));
      return () => {
        window.removeEventListener('auth:logout', handleLogoutEvent);
      };
    }

    // If using dev/placeholder Firebase key and no token, finish loading
    const isUsingFakeFirebase = !env.FIREBASE_API_KEY || env.FIREBASE_API_KEY.includes('FakeKey');
    if (isUsingFakeFirebase) {
      if (existingToken) {
        refreshProfile().finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
      return () => {
        window.removeEventListener('auth:logout', handleLogoutEvent);
      };
    }

    // Otherwise listen to Firebase auth changes for social/Firebase users
    let isSubscribed = true;
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!isSubscribed) return;
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          localStorage.setItem('farmlink_token', idToken);
          await refreshProfile();
        } catch (err) {
          console.error('Failed to sync Firebase token with backend:', err);
        }
      } else {
        const token = localStorage.getItem('farmlink_token');
        if (!token?.startsWith('fl_') && !token?.startsWith('dev-')) {
          localStorage.removeItem('farmlink_token');
          localStorage.removeItem('farmlink_user');
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, [refreshProfile]);

  /**
   * Strong database-backed login with email and password
   */
  const loginWithEmail = async (
    email: string,
    pass: string,
    targetRole?: 'CUSTOMER' | 'FARMER' | 'ADMIN'
  ): Promise<User> => {
    setIsLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Strict Email Format Validation
    if (!EMAIL_VALIDATION_REGEX.test(normalizedEmail)) {
      setIsLoading(false);
      throw new Error('Please enter a valid email address (e.g. name@example.com).');
    }

    // 2. Strict Password Length Validation
    if (!pass || pass.trim().length === 0) {
      setIsLoading(false);
      throw new Error('Please enter your password.');
    }
    if (pass.length < 6) {
      setIsLoading(false);
      throw new Error('Password must be at least 6 characters long.');
    }

    try {
      const result = await authService.login({
        email: normalizedEmail,
        password: pass,
        role: targetRole,
      });

      // Handle unverified email accounts
      if (result.requiresVerification) {
        const err: any = new Error(
          result.message || `Email verification required: Your email (${normalizedEmail}) has not been verified yet.`
        );
        err.code = 'EMAIL_NOT_VERIFIED';
        err.email = result.email || normalizedEmail;
        err.otpHint = result.otpHint;
        throw err;
      }

      if (!result.user || !result.token) {
        throw new Error('Authentication succeeded but user data was missing.');
      }

      localStorage.setItem('farmlink_token', result.token);
      localStorage.setItem('farmlink_user', JSON.stringify(result.user));
      setUser(result.user);

      return result.user;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fast dev token login for testing roles
   */
  const loginWithDevToken = async (targetRole: 'CUSTOMER' | 'FARMER' | 'ADMIN'): Promise<User> => {
    setIsLoading(true);
    try {
      const devToken = `dev-${targetRole.toLowerCase()}`;
      localStorage.setItem('farmlink_token', devToken);
      const me = await authService.getMe();
      setUser(me);
      localStorage.setItem('farmlink_user', JSON.stringify(me));
      return me;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register a new user directly in PostgreSQL with email verification OTP
   */
  const registerUser = async (
    name: string,
    email: string,
    pass: string,
    registerAsFarmer = false,
    farmDetails?: Partial<SyncUserData>
  ): Promise<RegisterResult> => {
    setIsLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Strict Email Format Validation
    if (!EMAIL_VALIDATION_REGEX.test(normalizedEmail)) {
      setIsLoading(false);
      throw new Error('Please enter a valid email address (e.g. name@example.com).');
    }

    // 2. Strict Password Validation
    if (!pass || pass.length < 6) {
      setIsLoading(false);
      throw new Error('Password must be at least 6 characters long.');
    }

    try {
      const result = await authService.register({
        name: name.trim(),
        email: normalizedEmail,
        password: pass,
        role: registerAsFarmer ? 'FARMER' : 'CUSTOMER',
        farmName: farmDetails?.farmName,
        bio: farmDetails?.bio,
        address: farmDetails?.address,
        city: farmDetails?.city,
        state: farmDetails?.state,
        pincode: farmDetails?.pincode,
        phone: farmDetails?.phone,
      });

      return {
        requiresVerification: true,
        email: result.email || normalizedEmail,
        otpHint: result.otpHint,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify email OTP in PostgreSQL and activate session
   */
  const verifyEmailOtp = async (email: string, otp: string): Promise<User> => {
    setIsLoading(true);
    try {
      const result = await authService.verifyOtp(email.trim().toLowerCase(), otp.trim());

      localStorage.setItem('farmlink_token', result.token);
      localStorage.setItem('farmlink_user', JSON.stringify(result.user));
      setUser(result.user);

      return result.user;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resend fresh OTP
   */
  const resendEmailOtp = async (email: string): Promise<{ otpHint?: string; message?: string }> => {
    const result = await authService.resendOtp(email.trim().toLowerCase());
    return { otpHint: result.otpHint, message: result.message };
  };

  /**
   * Logout user from session
   */
  const logout = async () => {
    const isUsingFakeFirebase = !env.FIREBASE_API_KEY || env.FIREBASE_API_KEY.includes('FakeKey');
    if (!isUsingFakeFirebase) {
      try {
        await firebaseSignOut(auth);
      } catch {
        // ignore
      }
    }
    await authService.logout();
    setUser(null);
    setFirebaseUser(null);
  };

  const role = user?.role || null;
  const isAuthenticated = !!user;
  const isFarmer = role === 'FARMER';
  const isAdmin = role === 'ADMIN';
  const isCustomer = role === 'CUSTOMER';
  const isApprovedFarmer = isFarmer && !!user?.farmerProfile?.isApproved;

  const forgotPassword = async (email: string) => {
    return authService.forgotPassword(email.trim().toLowerCase());
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    return authService.resetPassword(email.trim().toLowerCase(), otp.trim(), newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        isAuthenticated,
        role,
        isFarmer,
        isAdmin,
        isCustomer,
        isApprovedFarmer,
        loginWithEmail,
        loginWithDevToken,
        registerUser,
        verifyEmailOtp,
        resendEmailOtp,
        forgotPassword,
        resetPassword,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
