import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Clock, CheckCircle2, Truck, AlertCircle, Banknote } from 'lucide-react';
import { farmerService } from '../../services/farmer.service';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { OrderStatus, SellerOrder } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';

export const FarmerOrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['farmer-orders'],
    queryFn: () => farmerService.getOrders(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      farmerService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      success('Fulfillment status updated!');
      queryClient.invalidateQueries({ queryKey: ['farmer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['farmer-dashboard'] });
    },
    onError: (err: any) => error(err.message || 'Failed to update order status'),
  });

  const confirmCodPayment = async (orderId: string) => {
    try {
      await api.post('/payments/confirm', { orderId });
      success('Cash on delivery marked as PAID!');
      queryClient.invalidateQueries({ queryKey: ['farmer-orders'] });
    } catch (err: any) {
      error(err.message || 'Failed to confirm payment');
    }
  };

  const filtered = orders.filter((o) =>
    filterStatus === 'ALL' ? true : o.status === filterStatus
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-darkText">Consumer Orders to Fulfill</h1>
          <p className="text-xs text-grayText">
            Pack, update delivery statuses, and record cash collections
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['ALL', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map(
            (st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterStatus === st
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white text-grayText border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Orders Feed */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((so) => (
            <div
              key={so.id}
              className="bg-white rounded-3xl border border-gray-100 p-6 shadow-subtle space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Package className="w-5 h-5 text-primary" />
                  <div>
                    <span className="font-bold text-darkText text-sm">
                      Order #{so.orderId.slice(0, 8)}
                    </span>
                    <p className="text-[11px] text-grayText">
                      Received on{' '}
                      {new Date(so.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      so.status === 'DELIVERED'
                        ? 'green'
                        : so.status === 'PREPARING'
                        ? 'yellow'
                        : so.status === 'CANCELLED'
                        ? 'red'
                        : 'blue'
                    }
                  >
                    {so.status}
                  </Badge>
                  <span className="font-bold text-darkText text-base">₹{so.subtotal}</span>
                </div>
              </div>

              {/* Items in this farm order */}
              <div className="divide-y divide-gray-100">
                {(so.orderItems || so.items || []).map((it: any) => {
                  const itemName = it.product?.name || it.productName || 'Produce item';
                  const itemPrice = it.price ?? it.priceAtOrder ?? 0;
                  const itemUnit = (it.unit || it.product?.unit || 'kg').toLowerCase();
                  return (
                    <div
                      key={it.id}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-darkText">{itemName}</span>
                        <span className="text-grayText ml-2">
                          {it.quantity} {itemUnit} × ₹{itemPrice}
                        </span>
                      </div>
                      <span className="font-bold text-darkText">₹{it.subtotal}</span>
                    </div>
                  );
                })}
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50 p-3 rounded-2xl">
                <div className="text-xs text-grayText">
                  Your Net Payout (after 5% platform fee):{' '}
                  <span className="font-bold text-primary-800 text-sm">
                    ₹{so.subtotal - (so.commission ?? (so.subtotal * 0.05))}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {so.status !== 'DELIVERED' && so.status !== 'CANCELLED' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-darkText">Advance Status:</span>
                      <select
                        value={so.status}
                        onChange={(e) =>
                          updateStatusMutation.mutate({
                            orderId: so.id,
                            status: e.target.value as OrderStatus,
                          })
                        }
                        className="bg-white border border-gray-200 text-xs rounded-xl px-3 py-1.5 outline-none font-bold text-primary-700 focus:border-primary shadow-xs"
                      >
                        <option value="CONFIRMED">1. Confirmed</option>
                        <option value="PREPARING">2. Preparing Harvest</option>
                        <option value="OUT_FOR_DELIVERY">3. Out for Delivery</option>
                        <option value="DELIVERED">4. Delivered</option>
                        <option value="CANCELLED">Cancel Harvest</option>
                      </select>
                    </div>
                  )}

                  {so.status === 'DELIVERED' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => confirmCodPayment(so.orderId)}
                      leftIcon={<Banknote className="w-4 h-4" />}
                    >
                      Confirm COD Paid
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No fulfillment orders found"
          description="You do not have any consumer orders with this status right now."
        />
      )}
    </div>
  );
};
