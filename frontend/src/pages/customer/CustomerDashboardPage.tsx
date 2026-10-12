import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, CheckCircle2, ShoppingCart, ArrowRight, Clock } from 'lucide-react';
import { orderService } from '../../services/order.service';
import { useCart } from '../../contexts/CartContext';
import { Order } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export const CustomerDashboardPage: React.FC = () => {
  const { itemCount } = useCart();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['customer-orders'],
    queryFn: () => orderService.getOrders(),
  });

  const ordersList: Order[] = Array.isArray(orders) ? orders : (orders as any)?.items || [];
  const deliveredCount = ordersList.filter((o: any) => o.status === 'DELIVERED').length;
  const activeCount = ordersList.filter(
    (o: any) => o.status === 'CONFIRMED' || o.status === 'PREPARING' || o.status === 'OUT_FOR_DELIVERY'
  ).length;

  const recentOrders = ordersList.slice(0, 3);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <Badge variant="green">Delivered</Badge>;
      case 'OUT_FOR_DELIVERY':
        return <Badge variant="blue">Out for Delivery</Badge>;
      case 'PREPARING':
        return <Badge variant="yellow">Preparing</Badge>;
      case 'CONFIRMED':
        return <Badge variant="green">Confirmed</Badge>;
      case 'CANCELLED':
        return <Badge variant="red">Cancelled</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-grayText">Total Orders</p>
            <p className="text-2xl font-bold text-darkText">{orders.length}</p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-grayText">Delivered Produce</p>
            <p className="text-2xl font-bold text-darkText">{deliveredCount}</p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-grayText">Items in Cart</p>
            <p className="text-2xl font-bold text-darkText">{itemCount}</p>
          </div>
        </div>
      </div>

      {/* Active Orders Banner if any */}
      {activeCount > 0 && (
        <div className="p-5 rounded-2xl bg-primary-50 border border-primary-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary-700 shrink-0" />
            <div>
              <p className="text-sm font-bold text-darkText">
                You have {activeCount} order{activeCount > 1 ? 's' : ''} currently in progress!
              </p>
              <p className="text-xs text-grayText">
                Farmers are harvesting and preparing your produce for dispatch.
              </p>
            </div>
          </div>
          <Link to="/customer/orders">
            <Button variant="primary" size="sm">
              Track Orders
            </Button>
          </Link>
        </div>
      )}

      {/* Recent Orders Table / List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-darkText text-base">Recent Orders</h3>
          <Link
            to="/customer/orders"
            className="text-xs font-semibold text-primary hover:text-primary-700 flex items-center gap-1"
          >
            View All ({orders.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
            <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-darkText text-sm">
                      Order #{order.orderNumber || order.id.slice(0, 8)}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-grayText mt-1">
                    Placed on {new Date(order.createdAt).toLocaleDateString()} •{' '}
                    {order.sellerOrders?.length || 1} farm source(s)
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-darkText">
                    ₹{order.totalAmount}
                  </span>
                  <Link to={`/orders/${order.id}`}>
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-xs text-grayText mb-4">You haven't placed any orders yet.</p>
            <Link to="/products">
              <Button variant="primary" size="sm">
                Explore Fresh Produce
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
