import { api } from './api';
import {
  Order,
  ApiResponse,
  RazorpayOrderResponse,
  RazorpayVerificationPayload,
  CreateCodOrderPayload,
} from '../types';

export const paymentService = {
  /**
   * 1. Request Razorpay order from backend using current database cart items.
   */
  async createRazorpayOrder(addressId?: string, notes?: string): Promise<RazorpayOrderResponse> {
    const res = await api.post<ApiResponse<RazorpayOrderResponse>>('/payments/create-order', {
      addressId,
      notes,
    });
    return res.data.data;
  },

  /**
   * 2. Verify Razorpay HMAC SHA256 signature server-side and create the confirmed DB order.
   */
  async verifyPayment(payload: RazorpayVerificationPayload): Promise<Order> {
    const res = await api.post<ApiResponse<Order>>('/payments/verify', payload);
    return res.data.data;
  },

  /**
   * 3. Place Cash on Delivery (COD) order directly.
   */
  async createCodOrder(payload: CreateCodOrderPayload): Promise<Order> {
    const res = await api.post<ApiResponse<Order>>('/orders/cod', {
      ...payload,
      paymentProvider: 'CASH_ON_DELIVERY',
    });
    return res.data.data;
  },
};
