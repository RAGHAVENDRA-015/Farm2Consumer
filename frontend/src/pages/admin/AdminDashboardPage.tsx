import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Sprout,
  ShieldAlert,
  ShoppingBag,
  TrendingUp,
  Package,
  ArrowRight,
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export const AdminDashboardPage: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminService.getDashboard(),
  });

  // Backend returns a flat object — map to expected shape
  const m = stats
    ? {
        totalRevenue: (stats as any).totalRevenue ?? 0,
        platformCommission: (stats as any).platformCommission ?? 0,
        pendingApprovals: (stats as any).pendingFarmers ?? 0,
        totalFarmers: (stats as any).totalFarmers ?? 0,
        totalCustomers: (stats as any).totalCustomers ?? 0,
        totalProducts: (stats as any).totalProducts ?? 0,
        totalOrders: (stats as any).totalOrders ?? 0,
      }
    : undefined;
  const recentOrders = (stats as any)?.recentOrders || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-darkText">Marketplace Administration</h1>
        <p className="text-xs text-grayText">
          Global platform overview, revenue aggregation, and farmer approval queues.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-grayText">Total Marketplace GMV</p>
            <p className="text-2xl font-bold text-darkText">₹{m?.totalRevenue ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-grayText">Platform Commission (5%)</p>
            <p className="text-2xl font-bold text-primary-800">
              ₹{m?.platformCommission ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-grayText">Pending Farmer Approvals</p>
            <p className="text-2xl font-bold text-amber-600">{m?.pendingApprovals ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-100 text-darkText flex items-center justify-center">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-grayText">Total Farmers Registered</p>
            <p className="text-2xl font-bold text-darkText">{m?.totalFarmers ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-100 text-darkText flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-grayText">Total Registered Customers</p>
            <p className="text-2xl font-bold text-darkText">{m?.totalCustomers ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-100 text-darkText flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-grayText">Catalog Harvests</p>
            <p className="text-2xl font-bold text-darkText">{m?.totalProducts ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Pending Approvals Quick Alert */}
      {(m?.pendingApprovals ?? 0) > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-900">
                Action Required: {m?.pendingApprovals} farmer application(s) awaiting verification
              </p>
              <p className="text-xs text-amber-700">
                Verify agricultural legitimacy before produce becomes publicly available.
              </p>
            </div>
          </div>
          <Link to="/admin/farmers">
            <Button variant="primary" size="sm">
              Review Applications
            </Button>
          </Link>
        </div>
      )}

      {/* Recent Marketplace Orders */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="font-bold text-darkText text-base">Recent Platform Orders</h3>
          <Link
            to="/admin/orders"
            className="text-xs font-semibold text-primary hover:text-primary-700 flex items-center gap-1"
          >
            All Orders ({m?.totalOrders ?? 0}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
            <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-grayText uppercase border-b border-gray-100">
                <tr>
                  <th className="py-3 px-3">Order Number</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {recentOrders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-3 font-mono font-bold text-darkText">
                      #{o.orderNumber || o.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-3 text-grayText">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-darkText">{o.customer?.name || 'Customer'}</td>
                    <td className="py-3 px-3 font-bold text-primary-800">₹{o.totalAmount}</td>
                    <td className="py-3 px-3">
                      <Badge variant="green" size="sm">
                        {o.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-grayText">
            No orders placed across the marketplace yet.
          </div>
        )}
      </div>
    </div>
  );
};
