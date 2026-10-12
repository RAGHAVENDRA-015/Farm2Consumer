import { api } from './api';
import { Order, ApiResponse, PaymentProvider } from '../types';

export interface CreateOrderPayload {
  addressId?: string;
  deliveryAddress?: {
    name: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  };
  notes?: string;
  paymentProvider?: PaymentProvider;
}

export const orderService = {
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const res = await api.post<ApiResponse<Order>>('/orders', payload);
    return res.data.data;
  },

  async getOrders(status?: string): Promise<Order[]> {
    const res = await api.get<any>('/orders', {
      params: status && status !== 'ALL' ? { status } : undefined,
    });
    if (res.data?.data?.items && Array.isArray(res.data.data.items)) {
      return res.data.data.items;
    }
    if (Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  },

  async getOrderById(id: string): Promise<Order> {
    const res = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return res.data.data;
  },

  async cancelOrder(id: string): Promise<Order> {
    const res = await api.post<ApiResponse<Order>>(`/orders/${id}/cancel`);
    return res.data.data;
  },
};
