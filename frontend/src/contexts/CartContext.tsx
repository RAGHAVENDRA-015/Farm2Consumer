import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cart.service';
import { Cart, CartItem } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface CartContextType {
  cart: Cart | null;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    try {
      setIsLoading(true);
      const data = await cartService.getCart();
      setCart(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId: string, quantity = 1) => {
    if (!isAuthenticated) {
      error('Please sign in to add items to your cart.');
      return;
    }
    try {
      setIsLoading(true);
      await cartService.addItem(productId, quantity);
      await refreshCart();
      success('Added to cart!');
    } catch (err: any) {
      error(err.message || 'Could not add product to cart');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      setIsLoading(true);
      if (quantity <= 0) {
        await cartService.removeItem(itemId);
      } else {
        await cartService.updateItemQuantity(itemId, quantity);
      }
      await refreshCart();
    } catch (err: any) {
      error(err.message || 'Failed to update quantity');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      setIsLoading(true);
      await cartService.removeItem(itemId);
      await refreshCart();
      success('Item removed from cart');
    } catch (err: any) {
      error(err.message || 'Failed to remove item');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setIsLoading(true);
      await cartService.clearCart();
      await refreshCart();
    } catch (err: any) {
      error(err.message || 'Failed to clear cart');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const items = cart?.items || [];
  const itemCount = cart?.itemCount || items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart?.subtotal || items.reduce((sum, item) => sum + item.quantity * (item.product?.price || 0), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        itemCount,
        subtotal,
        isLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
