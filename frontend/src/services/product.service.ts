import { api } from './api';
import { Product, ApiResponse, PaginationMeta } from '../types';

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  farmerId?: string;
  minPrice?: number;
  maxPrice?: number;
  unit?: string;
  isOrganic?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'rating';
}

export interface ProductsResponse {
  items: Product[];
  pagination: PaginationMeta;
}

export interface CreateProductPayload {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  stockQuantity: number;
  minOrderQuantity?: number;
  harvestDate?: string | null;
  isOrganic?: boolean;
  images: { imageUrl: string; cloudinaryPublicId?: string | null; displayOrder?: number }[];
}

export const productService = {
  async getProducts(params?: GetProductsParams): Promise<ProductsResponse> {
    const res = await api.get<any>('/products', { params });
    const payload = res.data?.data;
    const items: Product[] = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
      ? payload
      : [];
    const pagination: PaginationMeta = payload?.pagination || res.data?.meta || {
      total: items.length,
      page: params?.page || 1,
      limit: params?.limit || 12,
      totalPages: Math.max(1, Math.ceil(items.length / (params?.limit || 12))),
    };
    return {
      items,
      pagination,
    };
  },

  async getProductById(id: string): Promise<Product> {
    const res = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return res.data.data;
  },

  async createProduct(data: CreateProductPayload): Promise<Product> {
    const payload = {
      ...data,
      minimumOrderQuantity: data.minOrderQuantity || 1,
    };
    const res = await api.post<ApiResponse<Product>>('/products', payload);
    return res.data.data;
  },

  async updateProduct(id: string, data: Partial<CreateProductPayload>): Promise<Product> {
    const payload = {
      ...data,
      ...(data.minOrderQuantity !== undefined ? { minimumOrderQuantity: data.minOrderQuantity } : {}),
    };
    const res = await api.patch<ApiResponse<Product>>(`/products/${id}`, payload);
    return res.data.data;
  },

  async updateStock(id: string, stockQuantity: number): Promise<Product> {
    const res = await api.patch<ApiResponse<Product>>(`/products/${id}/stock`, { stockQuantity });
    return res.data.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};
