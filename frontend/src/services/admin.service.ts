import { api } from './api';
import { User, FarmerProfile, Product, Order, Role, ApiResponse } from '../types';

export interface AdminDashboardStats {
  metrics: {
    totalRevenue: number;
    platformCommission: number;
    totalOrders: number;
    totalFarmers: number;
    pendingApprovals: number;
    totalCustomers: number;
    totalProducts: number;
  };
  recentOrders: Order[];
}

export const adminService = {
  async getDashboard(): Promise<AdminDashboardStats> {
    const res = await api.get<ApiResponse<AdminDashboardStats>>('/admin/dashboard');
    return res.data.data;
  },

  async getFarmers(): Promise<FarmerProfile[]> {
    const res = await api.get<any>('/admin/farmers');
    if (res.data?.data?.items && Array.isArray(res.data.data.items)) {
      return res.data.data.items;
    }
    if (Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  },

  async approveFarmer(farmerId: string): Promise<FarmerProfile> {
    const res = await api.patch<ApiResponse<FarmerProfile>>(`/admin/farmers/${farmerId}/approve`);
    return res.data.data;
  },

  async rejectFarmer(farmerId: string): Promise<FarmerProfile> {
    const res = await api.patch<ApiResponse<FarmerProfile>>(`/admin/farmers/${farmerId}/reject`);
    return res.data.data;
  },

  async getCustomers(): Promise<User[]> {
    const res = await api.get<any>('/admin/customers');
    if (res.data?.data?.items && Array.isArray(res.data.data.items)) {
      return res.data.data.items;
    }
    if (Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  },

  async updateUserStatus(userId: string, isActive: boolean): Promise<User> {
    const res = await api.patch<ApiResponse<User>>(`/admin/users/${userId}/status`, { isActive });
    return res.data.data;
  },

  async updateUserRole(userId: string, role: Role): Promise<User> {
    const res = await api.patch<ApiResponse<User>>(`/admin/users/${userId}/role`, { role });
    return res.data.data;
  },

  async getProducts(): Promise<Product[]> {
    const res = await api.get<any>('/admin/products');
    if (res.data?.data?.items && Array.isArray(res.data.data.items)) {
      return res.data.data.items;
    }
    if (Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  },

  async deleteProduct(productId: string): Promise<void> {
    await api.delete(`/admin/products/${productId}`);
  },

  async getOrders(): Promise<Order[]> {
    const res = await api.get<any>('/admin/orders');
    if (res.data?.data?.items && Array.isArray(res.data.data.items)) {
      return res.data.data.items;
    }
    if (Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  },
};
