import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Search, ShieldCheck } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { Badge } from '../../components/common/Badge';
import { Order } from '../../types';

export const AdminOrdersPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: () => adminService.getOrders(),
  });

  const ordersList: Order[] = Array.isArray(orders) ? orders : (orders as any)?.items || [];

  const filtered = ordersList.filter((o: any) => {
    const matchesStatus = filterStatus === 'ALL' ? true : o.status === filterStatus;
    const matchesSearch =
      (o.orderNumber && o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.customer?.name && o.customer.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-darkText">Marketplace Orders Overview</h1>
          <p className="text-xs text-grayText">
            Audit transactions, fulfillment progression, and delivery records
          </p>
        </div>

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

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search order # or customer..."
            className="w-full bg-gray-50 text-xs pl-8 pr-3 py-2 rounded-xl border border-gray-200 outline-none focus:border-primary"
          />
          <Search className="w-3.5 h-3.5 text-grayText absolute left-2.5 top-2.5" />
        </div>
        <span className="text-xs text-grayText font-medium">
          Total: <span className="font-bold text-darkText">{orders.length}</span> orders
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-subtle">
        {isLoading ? (
          <div className="p-8 space-y-3">
            <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
            <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[11px] font-bold text-grayText uppercase border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Fulfillment Sources</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/60">
                    <td className="py-3.5 px-4 font-mono font-bold text-darkText">
                      #{o.orderNumber || o.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4 text-grayText">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-darkText">{o.customer?.name || 'Customer'}</td>
                    <td className="py-3.5 px-4 text-primary-700 font-medium">
                      {o.sellerOrders?.length || 1} farm source(s)
                    </td>
                    <td className="py-3.5 px-4 font-bold text-darkText">₹{o.totalAmount}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          o.status === 'DELIVERED'
                            ? 'green'
                            : o.status === 'PREPARING'
                            ? 'yellow'
                            : o.status === 'CANCELLED'
                            ? 'red'
                            : 'blue'
                        }
                        size="sm"
                      >
                        {o.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-grayText">No orders found.</div>
        )}
      </div>
    </div>
  );
};
