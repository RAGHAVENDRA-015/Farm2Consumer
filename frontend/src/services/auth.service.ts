import { api } from './api';
import { User, ApiResponse } from '../types';

export interface SyncUserData {
  name: string;
  email?: string | null;
  phone?: string | null;
  registerAsFarmer?: boolean;
  farmName?: string;
  bio?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  role?: 'CUSTOMER' | 'FARMER' | 'ADMIN';
  farmName?: string;
  bio?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  role?: 'CUSTOMER' | 'FARMER' | 'ADMIN';
}

export interface AuthResponseData {
  user?: User;
  token?: string;
  requiresVerification?: boolean;
  email?: string;
  otpHint?: string;
  message?: string;
}

export const authService = {
  /**
   * Register a new user in the PostgreSQL database.
   */
  async register(data: RegisterPayload): Promise<AuthResponseData> {
    const res = await api.post<ApiResponse<AuthResponseData>>('/auth/register', data);
    return res.data.data;
  },

  /**
   * Authenticate with email & password against PostgreSQL database.
   */
  async login(data: LoginPayload): Promise<AuthResponseData> {
    const res = await api.post<ApiResponse<AuthResponseData>>('/auth/login', data);
    return res.data.data;
  },

  /**
   * Verify 6-digit email OTP in the PostgreSQL database.
   */
  async verifyOtp(email: string, otp: string): Promise<{ user: User; token: string }> {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/verify-otp', {
      email,
      otp,
    });
    return res.data.data;
  },

  /**
   * Resend 6-digit email OTP.
   */
  async resendOtp(email: string): Promise<{ success: boolean; email: string; otpHint?: string; message: string }> {
    const res = await api.post<ApiResponse<{ success: boolean; email: string; otpHint?: string; message: string }>>(
      '/auth/resend-otp',
      { email }
    );
    return res.data.data;
  },

  /**
   * Request password reset 6-digit OTP code.
   */
  async forgotPassword(email: string): Promise<{ success: boolean; email: string; otpHint?: string; message: string }> {
    const res = await api.post<ApiResponse<{ success: boolean; email: string; otpHint?: string; message: string }>>(
      '/auth/forgot-password',
      { email }
    );
    return res.data.data;
  },

  /**
   * Reset password using 6-digit OTP code and new password.
   */
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await api.post<ApiResponse<{ success: boolean; message: string }>>(
      '/auth/reset-password',
      { email, otp, newPassword }
    );
    return res.data.data;
  },

  async syncUser(data: SyncUserData): Promise<User> {
    const res = await api.post<ApiResponse<User>>('/auth/sync', data);
    return res.data.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('farmlink_token');
      localStorage.removeItem('farmlink_user');
    }
  },
};
