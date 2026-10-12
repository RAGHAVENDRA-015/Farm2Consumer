import { api } from './api';
import { Cart, CartItem, ApiResponse } from '../types';

export const cartService = {
  async getCart(): Promise<Cart> {
    const res = await api.get<ApiResponse<Cart>>('/cart');
    return res.data.data;
  },

  async addItem(productId: string, quantity = 1): Promise<CartItem> {
    const res = await api.post<ApiResponse<CartItem>>('/cart/items', { productId, quantity });
    return res.data.data;
  },

  async updateItemQuantity(itemId: string, quantity: number): Promise<CartItem> {
    const res = await api.patch<ApiResponse<CartItem>>(`/cart/items/${itemId}`, { quantity });
    return res.data.data;
  },

  async removeItem(itemId: string): Promise<void> {
    await api.delete(`/cart/items/${itemId}`);
  },

  async clearCart(): Promise<void> {
    await api.delete('/cart');
  },
};
