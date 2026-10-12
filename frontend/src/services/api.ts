import axios, { AxiosError } from 'axios';
import { env } from '../config/env';

export const api = axios.create({
  baseURL: env.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

// Request interceptor to attach bearer token
api.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('farmlink_token');
    if (!token) {
      const saved = localStorage.getItem('farmlink_user');
      if (saved) {
        try {
          const user = JSON.parse(saved);
          if (user?.role) {
            token = `dev-${user.role.toLowerCase()}`;
            localStorage.setItem('farmlink_token', token);
          }
        } catch {
          // ignore
        }
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: { code?: string; message?: string; fields?: Record<string, string[]> } }>) => {
    // If account was deactivated
    if (error.response?.status === 403 && error.response.data?.error?.code === 'ACCOUNT_DEACTIVATED') {
      localStorage.removeItem('farmlink_token');
      localStorage.removeItem('farmlink_user');
      window.dispatchEvent(new Event('auth:logout'));
    }

    let message =
      error.response?.data?.error?.message ||
      error.message ||
      'An unexpected network error occurred. Please try again.';

    if (error.response?.data?.error?.fields) {
      const fieldErrors = Object.entries(error.response.data.error.fields)
        .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
        .join(' | ');
      if (fieldErrors) {
        message = `${message}: ${fieldErrors}`;
      }
    }

    const customErr: any = new Error(message);
    customErr.code = error.response?.data?.error?.code;
    customErr.fields = error.response?.data?.error?.fields;
    customErr.status = error.response?.status;
    return Promise.reject(customErr);
  }
);
