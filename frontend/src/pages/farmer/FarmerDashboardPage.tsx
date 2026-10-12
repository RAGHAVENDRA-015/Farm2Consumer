import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { farmerService } from '../../services/farmer.service';
import { useToast } from '../../contexts/ToastContext';
import { OrderStatus } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export const FarmerDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['farmer-dashboard'],
    queryFn: () => farmerService.getDashboard(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      farmerService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      success('Order status updated!');
      queryClient.invalidateQueries({ queryKey: ['farmer-dashboard'] });
    },
    onError: (err: any) => {
      error(err.message || 'Failed to update order status');
    },
  });

  // Backend returns a flat object — map it directly
  const s = stats as any;
  const metrics = s
    ? {
        grossSales: s.grossSales ?? 0,
        platformCommission: s.commissionAmount ?? 0,
        netEarnings: s.netEarnings ?? 0,
        totalOrders: s.totalOrders ?? 0,
        pendingOrders: s.pendingOrders ?? 0,
        totalProducts: s.totalProducts ?? 0,
      }
    : null;
  const recentOrders = s?.recentOrders || [];

  return (
    <div className="space-y-8">
      {/* Header with Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-darkText tracking-tight">
            Farmer Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-grayText mt-1">
            Real-time harvest metrics, incoming consumer orders, and payout summary.
          </p>
        </div>

        <Link to="/farmer/products/new">
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            List New Produce
          </Button>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-grayText">Gross Farm Sales</p>
            <p className="text-2xl font-bold text-darkText">₹{metrics?.grossSales ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-grayText">Net Earnings</p>
            <p className="text-2xl font-bold text-primary-800">₹{metrics?.netEarnings ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-grayText">Pending Orders</p>
            <p className="text-2xl font-bold text-darkText">{metrics?.pendingOrders ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-grayText">Active Harvests</p>
            <p className="text-2xl font-bold text-darkText">{metrics?.totalProducts ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Recent Fulfillment Orders */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-darkText text-base">Recent Consumer Orders</h3>
            <p className="text-xs text-grayText">Fulfill orders as soon as harvest is packed</p>
          </div>
          <Link
            to="/farmer/orders"
            className="text-xs font-semibold text-primary hover:text-primary-700 flex items-center gap-1"
          >
            All Orders ({metrics?.totalOrders ?? 0}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
            <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-grayText uppercase border-b border-gray-100">
                <tr>
                  <th className="py-3 px-2">Order ID</th>
                  <th className="py-3 px-2">Items</th>
                  <th className="py-3 px-2">Subtotal</th>
                  <th className="py-3 px-2">Net (95%)</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {recentOrders.map((so: any) => (
                  <tr key={so.id} className="hover:bg-gray-50/60">
                    <td className="py-3.5 px-2 font-mono text-darkText">
                      #{(so as any).order?.orderNumber || (so as any).orderId?.slice(0, 8) || so.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-2 text-grayText max-w-[200px] truncate">
                      {so.orderItems?.map((it: any) => `${it.product?.name} (${it.quantity})`).join(', ')}
                    </td>
                    <td className="py-3.5 px-2 font-bold text-darkText">₹{so.subtotal}</td>
                    <td className="py-3.5 px-2 font-bold text-primary-700">
                      ₹{(so.subtotal * 0.95).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-2">
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
                        size="sm"
                      >
                        {so.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-2">
                      {so.status !== 'DELIVERED' && so.status !== 'CANCELLED' ? (
                        <select
                          value={so.status}
                          onChange={(e) =>
                            updateStatusMutation.mutate({
                              orderId: so.id,
                              status: e.target.value as OrderStatus,
                            })
                          }
                          className="bg-gray-50 border border-gray-200 text-xs rounded-lg px-2 py-1 outline-none font-semibold text-darkText focus:border-primary"
                        >
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PREPARING">PREPARING</option>
                          <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      ) : (
                        <span className="text-gray-400 text-[11px] italic">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-xs text-grayText mb-3">No orders placed yet.</p>
            <Link to="/farmer/products/new">
              <Button variant="primary" size="sm">
                Add Produce Listings
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
