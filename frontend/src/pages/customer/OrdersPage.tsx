import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, Clock, ArrowRight, Truck } from 'lucide-react';
import { orderService } from '../../services/order.service';
import { Order } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';

export const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('ALL');

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['customer-orders', activeTab],
    queryFn: () => orderService.getOrders(activeTab),
  });

  const ordersList: Order[] = Array.isArray(orders) ? orders : (orders as any)?.items || [];

  const tabs = [
    { label: 'All Orders', value: 'ALL' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Preparing', value: 'PREPARING' },
    { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

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
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.value
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-grayText border border-gray-200 hover:bg-gray-50 hover:text-darkText'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : ordersList.length > 0 ? (
        <div className="space-y-4">
          {ordersList.map((order) => {
            const allItems: any[] = (order.sellerOrders || [])
              .flatMap((so: any) => so.orderItems || so.items || [])
              .filter(Boolean);
            const itemsCount = allItems.reduce(
              (acc: number, it: any) => acc + (Number(it?.quantity) || 0),
              0
            );

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-subtle hover:border-gray-200 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <Package className="w-5 h-5 text-primary" />
                    <div>
                      <span className="font-bold text-darkText text-sm">
                        Order #{order.orderNumber || order.id.slice(0, 8)}
                      </span>
                      <p className="text-[11px] text-grayText">
                        Placed on{' '}
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <span className="font-bold text-darkText text-base">₹{order.totalAmount}</span>
                  </div>
                </div>

                {/* Items preview snippet */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="text-grayText">
                    <span className="font-medium text-darkText">
                      {itemsCount} item{itemsCount !== 1 ? 's' : ''}:{' '}
                    </span>
                    {allItems.slice(0, 3).map((it: any, idx: number) => {
                      const itemName = it.product?.name || it.productName || 'Produce';
                      const itemQty = it.quantity || 1;
                      return (
                        <span key={it.id || idx}>
                          {itemName} ({itemQty})
                          {idx < Math.min(allItems.length - 1, 2) ? ', ' : ''}
                        </span>
                      );
                    })}
                    {allItems.length > 3 && (
                      <span className="italic text-gray-400"> +{allItems.length - 3} more</span>
                    )}
                  </div>

                  <Link to={`/orders/${order.id}`}>
                    <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Track & Details
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No orders in this section"
          description="You don't have any orders with the selected status. Browse the marketplace for fresh harvests."
          actionText="Browse Marketplace"
          onAction={() => (window.location.href = '/products')}
        />
      )}
    </div>
  );
};
