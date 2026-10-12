import { api } from './api';
import { Category, ApiResponse } from '../types';

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const res = await api.get<ApiResponse<Category[]>>('/categories');
    return res.data.data;
  },

  async getCategoryById(id: string): Promise<Category> {
    const res = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return res.data.data;
  },

  async createCategory(data: { name: string; description?: string; imageUrl?: string }): Promise<Category> {
    const res = await api.post<ApiResponse<Category>>('/categories', data);
    return res.data.data;
  },

  async updateCategory(id: string, data: Partial<{ name: string; description?: string; imageUrl?: string; isActive?: boolean }>): Promise<Category> {
    const res = await api.patch<ApiResponse<Category>>(`/categories/${id}`, data);
    return res.data.data;
  },
};
