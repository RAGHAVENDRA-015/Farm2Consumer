import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';

export const CartPage: React.FC = () => {
  const { items, subtotal, updateQuantity, removeFromCart, clearCart, isLoading } = useCart();
  const navigate = useNavigate();

  const deliveryFee = items.length > 0 ? 30 : 0;
  const grandTotal = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8 text-primary" />}
          title="Your Farm Cart is Empty"
          description="Looks like you haven't added any harvest fresh vegetables or fruits yet."
          actionText="Explore Fresh Produce"
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-darkText tracking-tight">
            Your Farm Basket
          </h1>
          <p className="text-xs sm:text-sm text-grayText mt-1">
            {items.length} item{items.length > 1 ? 's' : ''} directly selected from local growers
          </p>
        </div>

        <button
          onClick={clearCart}
          disabled={isLoading}
          className="text-xs font-semibold text-grayText hover:text-red-500 transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 p-6 shadow-subtle divide-y divide-gray-100">
          {items.map((item) => {
            const product = item.product;
            const itemPrice = product?.price || 0;
            const itemSubtotal = itemPrice * item.quantity;
            const img =
              product?.images && product.images.length > 0
                ? product.images[0].imageUrl
                : 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=300';

            return (
              <div key={item.id} className="py-5 first:pt-0 last:pb-0 flex items-center gap-4 sm:gap-6">
                {/* Product Image */}
                <div className="w-20 h-20 rounded-2xl bg-primary-50/60 overflow-hidden shrink-0 border border-gray-100">
                  <img src={img} alt={product?.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/products/${product?.id}`}
                    className="font-bold text-darkText text-sm sm:text-base hover:text-primary transition-colors truncate block"
                  >
                    {product?.name || 'Produce Item'}
                  </Link>
                  <p className="text-xs text-grayText mt-0.5">
                    ₹{itemPrice} / {product?.unit?.toLowerCase() || 'kg'}
                  </p>
                  {product?.farmer && (
                    <p className="text-[11px] text-primary-700 font-medium mt-0.5">
                      🌱 {product.farmer.farmName}
                    </p>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center border border-gray-200 rounded-xl bg-white p-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={isLoading}
                    className="p-1 text-grayText hover:text-darkText rounded-lg hover:bg-gray-50"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-darkText">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={isLoading || item.quantity >= (product?.stockQuantity || 99)}
                    className="p-1 text-grayText hover:text-darkText rounded-lg hover:bg-gray-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right min-w-[70px]">
                  <p className="text-sm sm:text-base font-bold text-darkText">₹{itemSubtotal}</p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  disabled={isLoading}
                  className="p-2 text-gray-300 hover:text-red-500 rounded-xl transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Price Breakdown & Checkout Button */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 p-6 shadow-subtle space-y-6 sticky top-24">
          <h3 className="font-bold text-darkText text-base pb-3 border-b border-gray-100">
            Order Summary
          </h3>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between text-grayText">
              <span>Produce Subtotal</span>
              <span className="font-semibold text-darkText">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-grayText">
              <span>Estimated Delivery Fee</span>
              <span className="font-semibold text-darkText">₹{deliveryFee}</span>
            </div>
            <div className="pt-3 border-t border-gray-100 flex justify-between text-base font-bold text-darkText">
              <span>Grand Total</span>
              <span className="text-primary-800 text-lg">₹{grandTotal}</span>
            </div>
          </div>

          <div className="p-3 bg-primary-50 rounded-xl flex items-center gap-2 text-[11px] text-primary-800 font-medium">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Guaranteed fresh harvest with zero middleman markup.</span>
          </div>

          <Link to="/checkout" className="block">
            <Button
              size="lg"
              variant="primary"
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Proceed to Checkout
            </Button>
          </Link>

          <Link
            to="/products"
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-grayText hover:text-darkText transition-colors pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};
