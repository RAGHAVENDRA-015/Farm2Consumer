import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  Check,
  AlertCircle,
  ArrowLeft,
  MapPin,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { orderService } from '../../services/order.service';
import { useToast } from '../../contexts/ToastContext';
import { OrderStatus } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => orderService.getOrderById(id!),
    enabled: !!id,
  });

  const handleCancelOrder = async () => {
    if (!id || !window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      setIsCancelling(true);
      await orderService.cancelOrder(id);
      success('Order cancelled successfully.');
      queryClient.invalidateQueries({ queryKey: ['order-detail', id] });
    } catch (err: any) {
      error(err.message || 'Unable to cancel order.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-md mx-auto my-20 text-center p-8 bg-white rounded-3xl border border-gray-100">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-darkText mb-2">Order Not Found</h2>
        <p className="text-sm text-grayText mb-6">Unable to locate the specified order.</p>
        <Link to="/customer/orders">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  // Timeline Steps (PRD Section 19)
  const steps: { label: string; status: OrderStatus }[] = [
    { label: 'Order Placed', status: 'PENDING' },
    { label: 'Confirmed', status: 'CONFIRMED' },
    { label: 'Preparing', status: 'PREPARING' },
    { label: 'Out for Delivery', status: 'OUT_FOR_DELIVERY' },
    { label: 'Delivered', status: 'DELIVERED' },
  ];

  const statusOrder: Record<OrderStatus, number> = {
    PENDING: 0,
    CONFIRMED: 1,
    PREPARING: 2,
    OUT_FOR_DELIVERY: 3,
    DELIVERED: 4,
    CANCELLED: -1,
  };

  const currentStepIndex = statusOrder[order.status];
  const isCancelled = order.status === 'CANCELLED';
  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <Link
            to="/customer/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-grayText hover:text-darkText transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> All Orders
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-darkText tracking-tight">
            Order #{order.orderNumber || order.id.slice(0, 8)}
          </h1>
          <p className="text-xs text-grayText mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Cancellation Button */}
        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelOrder}
            isLoading={isCancelling}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            Cancel Order
          </Button>
        )}
      </div>

      {/* Visual Timeline (PRD Section 19) */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-subtle">
        <h3 className="font-bold text-darkText text-base mb-6">Delivery Progress</h3>

        {isCancelled ? (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700">
            <XCircle className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold text-sm">Order Cancelled</p>
              <p className="text-xs">
                This order was cancelled and inventory has been returned to the farmers.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2 relative">
            {steps.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step.status} className="flex flex-col items-center text-center relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isCompleted
                        ? 'bg-primary text-white shadow-xs'
                        : isCurrent
                        ? 'bg-primary-50 text-primary border-2 border-primary animate-pulse'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : isCurrent ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      isCurrent
                        ? 'font-bold text-primary-700'
                        : isCompleted
                        ? 'text-darkText font-semibold'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Produce Items by Farm */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-subtle space-y-6">
        <h3 className="font-bold text-darkText text-base">Produce in This Order</h3>

        {order.sellerOrders?.map((so) => (
          <div key={so.id} className="p-4 rounded-2xl bg-gray-50/60 border border-gray-100 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200/60">
              <span className="text-xs font-bold text-primary-800">
                🌱 Fulfilled by {so.farmer?.farmName || 'Regional Farmer'}
              </span>
              <Badge variant="green" size="sm">
                {so.status}
              </Badge>
            </div>

            <div className="divide-y divide-gray-100">
              {(so.orderItems || so.items || []).map((it: any) => {
                const itemName = it.product?.name || it.productName || 'Produce item';
                const itemPrice = it.price ?? it.priceAtOrder ?? 0;
                const unitLabel = it.unit ? ` ${it.unit.toLowerCase()}` : '';
                return (
                  <div key={it.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <span className="font-semibold text-darkText">{itemName}</span>
                      <span className="text-grayText ml-2">
                        ({it.quantity}{unitLabel} × ₹{itemPrice})
                      </span>
                    </div>
                    <span className="font-bold text-darkText">₹{it.subtotal}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Totals */}
        <div className="pt-4 border-t border-gray-100 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-grayText">
            <span>Produce Subtotal</span>
            <span className="font-semibold text-darkText">
              ₹{order.totalAmount - order.deliveryCharge}
            </span>
          </div>
          <div className="flex justify-between text-grayText">
            <span>Farm Logistics</span>
            <span className="font-semibold text-darkText">₹{order.deliveryCharge}</span>
          </div>
          <div className="pt-3 border-t border-gray-100 flex justify-between text-base font-bold text-darkText">
            <span>Grand Total</span>
            <span className="text-primary-800 text-lg">₹{order.totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Delivery & Payment Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-subtle space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-primary-800">
            <MapPin className="w-4 h-4" />
            <span>Delivery Destination</span>
          </div>
          {order.deliveryAddress && (
            <p className="text-xs text-grayText leading-relaxed">
              <span className="font-bold text-darkText block">{order.deliveryAddress.name}</span>
              {order.deliveryAddress.addressLine}, {order.deliveryAddress.city},{' '}
              {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
              <span className="block mt-1 font-medium">📞 {order.deliveryAddress.phone}</span>
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-subtle space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-primary-800">
            <ShieldCheck className="w-4 h-4" />
            <span>Payment Details</span>
          </div>
          <p className="text-xs text-grayText">
            Method:{' '}
            <span className="font-bold text-darkText">
              {order.payments?.[0]?.provider === 'CASH_ON_DELIVERY'
                ? 'Cash on Delivery (COD)'
                : 'Online Payment (Razorpay)'}
            </span>
          </p>
          <p className="text-xs text-grayText">
            Status:{' '}
            <span className="font-bold text-darkText">
              {order.payments?.[0]?.status || 'PENDING'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
