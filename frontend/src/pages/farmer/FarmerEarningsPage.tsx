import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, TrendingUp, ArrowDownRight, ShieldCheck, Download } from 'lucide-react';
import { farmerService } from '../../services/farmer.service';
import { Badge } from '../../components/common/Badge';

export const FarmerEarningsPage: React.FC = () => {
  const { data: earnings, isLoading } = useQuery({
    queryKey: ['farmer-earnings'],
    queryFn: () => farmerService.getEarnings(),
  });

  const summary = earnings?.summary;
  const transactions = earnings?.transactions || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-darkText">Earnings & Settlements</h1>
        <p className="text-xs text-grayText">
          Complete visibility over sales, platform commission, and transparent payouts.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-subtle flex flex-col justify-between">
          <p className="text-xs font-semibold text-grayText">Gross Sales Volume</p>
          <p className="text-3xl font-extrabold text-darkText mt-2">
            ₹{summary?.grossSales ?? 0}
          </p>
          <p className="text-[11px] text-gray-400 mt-2">Before platform commission</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-primary-200 bg-primary-50/30 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-primary-800">Net Farmer Earnings</p>
            <span className="text-[10px] bg-primary text-white font-bold px-2 py-0.5 rounded-full">
              95% Payout
            </span>
          </div>
          <p className="text-3xl font-extrabold text-primary-900 mt-2">
            ₹{summary?.netEarnings ?? 0}
          </p>
          <p className="text-[11px] text-primary-700 font-medium mt-2">
            Directly credited to your account
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-subtle flex flex-col justify-between">
          <p className="text-xs font-semibold text-grayText">Platform Commission (5%)</p>
          <p className="text-3xl font-extrabold text-gray-700 mt-2">
            ₹{summary?.platformCommission ?? 0}
          </p>
          <p className="text-[11px] text-gray-400 mt-2">Covers digital payments & support</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="font-bold text-darkText text-base">Transaction Ledger</h3>
          <span className="text-xs text-grayText font-medium">
            {transactions.length} recorded payouts
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
            <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-grayText uppercase border-b border-gray-100">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Order Ref</th>
                  <th className="py-3 px-3">Order Subtotal</th>
                  <th className="py-3 px-3">Commission (5%)</th>
                  <th className="py-3 px-3">Net Credited</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {transactions.map((tx, idx) => {
                  const refCode = tx.orderNumber || (tx.orderId ? `#${tx.orderId.slice(0, 8)}` : (tx.id ? `#${tx.id.slice(0, 8)}` : '—'));
                  const netCredited = tx.netAmount ?? tx.net ?? (tx.subtotal - tx.commission);

                  return (
                    <tr key={tx.id || tx.orderId || idx} className="hover:bg-gray-50/50">
                      <td className="py-3.5 px-3 text-grayText">
                        {tx.date ? new Date(tx.date).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-darkText">
                        {refCode}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-darkText">₹{tx.subtotal}</td>
                      <td className="py-3.5 px-3 text-red-500">-₹{tx.commission}</td>
                      <td className="py-3.5 px-3 font-bold text-primary-800">₹{netCredited}</td>
                      <td className="py-3.5 px-3">
                        <Badge variant="green" size="sm">
                          {tx.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-grayText">
            No completed payout transactions yet. Earnings appear as orders are fulfilled and
            delivered.
          </div>
        )}
      </div>
    </div>
  );
};
