import { api } from './api';
import { FarmerProfile, Product, SellerOrder, OrderStatus, ApiResponse } from '../types';

export interface FarmerDashboardStats {
  profile: {
    farmName: string;
    isApproved: boolean;
    rating: number;
    ratingCount: number;
  };
  metrics: {
    grossSales: number;
    platformCommission: number;
    netEarnings: number;
    totalOrders: number;
    pendingOrders: number;
    totalProducts: number;
  };
  recentOrders: SellerOrder[];
}

export interface FarmerEarningsResponse {
  summary: {
    grossSales: number;
    platformCommission: number;
    netEarnings: number;
    settledAmount?: number;
    pendingPayout?: number;
    platformCommissionRate?: string;
    totalRefunds?: number;
  };
  commissionRate?: string;
  transactions: {
    id?: string;
    orderId?: string;
    orderNumber?: string;
    date: string;
    subtotal: number;
    commission: number;
    net?: number;
    netAmount?: number;
    status: OrderStatus;
  }[];
}

export const farmerService = {
  async getDashboard(): Promise<FarmerDashboardStats> {
    const res = await api.get<ApiResponse<FarmerDashboardStats>>('/farmer/dashboard');
    return res.data.data;
  },

  async getProfile(): Promise<FarmerProfile> {
    const res = await api.get<ApiResponse<FarmerProfile>>('/farmer/profile');
    return res.data.data;
  },

  async updateProfile(data: Partial<FarmerProfile>): Promise<FarmerProfile> {
    const res = await api.patch<ApiResponse<FarmerProfile>>('/farmer/profile', data);
    return res.data.data;
  },

  async getProducts(): Promise<Product[]> {
    const res = await api.get<any>('/farmer/products');
    if (res.data?.data?.items && Array.isArray(res.data.data.items)) {
      return res.data.data.items;
    }
    if (Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  },

  async getOrders(): Promise<SellerOrder[]> {
    const res = await api.get<any>('/farmer/orders');
    if (res.data?.data?.items && Array.isArray(res.data.data.items)) {
      return res.data.data.items;
    }
    if (Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  },

  async updateOrderStatus(sellerOrderId: string, status: OrderStatus): Promise<SellerOrder> {
    const res = await api.patch<ApiResponse<SellerOrder>>(`/farmer/orders/${sellerOrderId}/status`, { status });
    return res.data.data;
  },

  async getEarnings(): Promise<FarmerEarningsResponse> {
    const res = await api.get<ApiResponse<FarmerEarningsResponse>>('/farmer/earnings');
    return res.data.data;
  },
};
