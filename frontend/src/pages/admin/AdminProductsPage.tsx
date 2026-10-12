import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, Sprout, ExternalLink } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { useToast } from '../../contexts/ToastContext';
import { Badge } from '../../components/common/Badge';
import { Product } from '../../types';

export const AdminProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['admin-products'],
    queryFn: () => adminService.getProducts(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteProduct(id),
    onSuccess: () => {
      success('Produce listing deactivated/removed from marketplace.');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err: any) => error(err.message || 'Action failed'),
  });

  const productsList: Product[] = Array.isArray(products) ? products : (products as any)?.items || [];

  const filtered = productsList.filter(
    (p: any) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.farmer?.farmName && p.farmer.farmName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-darkText">Marketplace Catalog Supervision</h1>
        <p className="text-xs text-grayText">
          Audit produce listings, check active stock, and moderate inappropriate items
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search produce or farm..."
            className="w-full bg-gray-50 text-xs pl-8 pr-3 py-2 rounded-xl border border-gray-200 outline-none focus:border-primary"
          />
          <Search className="w-3.5 h-3.5 text-grayText absolute left-2.5 top-2.5" />
        </div>
        <span className="text-xs text-grayText font-medium">
          Total: <span className="font-bold text-darkText">{products.length}</span> harvests
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
                  <th className="py-3.5 px-4">Produce</th>
                  <th className="py-3.5 px-4">Farm Source</th>
                  <th className="py-3.5 px-4">Price / Unit</th>
                  <th className="py-3.5 px-4">Available Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filtered.map((p) => {
                  const img =
                    p.images?.[0]?.imageUrl ||
                    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=200';

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <img
                          src={img}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-darkText">{p.name}</p>
                          <span className="text-[10px] text-grayText">{p.category?.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-primary-700 font-medium">
                        {p.farmer?.farmName || 'Independent Farm'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-darkText">
                        ₹{p.price} / {p.unit.toLowerCase()}
                      </td>
                      <td className="py-3.5 px-4 text-darkText">
                        {p.stockQuantity} {p.unit.toLowerCase()}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={p.isActive ? 'green' : 'gray'} size="sm">
                          {p.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            if (window.confirm(`Deactivate/delete listing for "${p.name}"?`)) {
                              deleteMutation.mutate(p.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="Deactivate listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-grayText">No products found.</div>
        )}
      </div>
    </div>
  );
};
