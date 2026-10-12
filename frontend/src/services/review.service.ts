import { api } from './api';
import { Review, ApiResponse } from '../types';

export const reviewService = {
  async getReviewsByProduct(productId: string): Promise<Review[]> {
    const res = await api.get<any>(`/reviews/product/${productId}`);
    if (res.data?.data?.items && Array.isArray(res.data.data.items)) {
      return res.data.data.items;
    }
    if (Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  },

  async createReview(productId: string, rating: number, comment?: string): Promise<Review> {
    const res = await api.post<ApiResponse<Review>>(`/reviews/product/${productId}`, { rating, comment });
    return res.data.data;
  },

  async updateReview(reviewId: string, rating?: number, comment?: string): Promise<Review> {
    const res = await api.patch<ApiResponse<Review>>(`/reviews/${reviewId}`, { rating, comment });
    return res.data.data;
  },

  async deleteReview(reviewId: string): Promise<void> {
    await api.delete(`/reviews/${reviewId}`);
  },
};
