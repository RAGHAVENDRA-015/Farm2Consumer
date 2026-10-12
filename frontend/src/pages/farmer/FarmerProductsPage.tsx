import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Sprout, Search } from 'lucide-react';
import { farmerService } from '../../services/farmer.service';
import { productService } from '../../services/product.service';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';

export const FarmerProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  // Delete confirmation modal state
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Stock edit modal state
  const [editingStockProduct, setEditingStockProduct] = useState<{ id: string; name: string; stock: number } | null>(null);
  const [newStock, setNewStock] = useState<number>(0);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['farmer-products'],
    queryFn: () => farmerService.getProducts(),
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) =>
      productService.updateStock(id, stock),
    onSuccess: () => {
      success('Stock quantity updated!');
      queryClient.invalidateQueries({ queryKey: ['farmer-products'] });
      setEditingStockProduct(null);
    },
    onError: (err: any) => error(err.message || 'Failed to update stock'),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      success('Produce listing removed');
      queryClient.invalidateQueries({ queryKey: ['farmer-products'] });
    },
    onError: (err: any) => error(err.message || 'Failed to remove listing'),
  });

  const handleDelete = (id: string) => {
    setDeletingProductId(id);
  };

  const confirmDelete = () => {
    if (deletingProductId) {
      deleteProductMutation.mutate(deletingProductId);
      setDeletingProductId(null);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-darkText">My Produce Listings</h1>
          <p className="text-xs text-grayText">Manage harvest quantities, prices, and marketplace status</p>
        </div>

        <Link to="/farmer/products/new">
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Add New Produce
          </Button>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search my produce..."
            className="w-full bg-gray-50 text-xs pl-8 pr-3 py-2 rounded-xl border border-gray-200 outline-none focus:border-primary"
          />
          <Search className="w-3.5 h-3.5 text-grayText absolute left-2.5 top-2.5" />
        </div>
        <span className="text-xs text-grayText font-medium">
          Total: <span className="font-bold text-darkText">{products.length}</span> items
        </span>
      </div>

      {/* Table */}
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
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Current Stock</th>
                  <th className="py-3.5 px-4">Organic</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filtered.map((p) => {
                  const img =
                    p.images?.[0]?.imageUrl ||
                    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=200';
                  const isOutOfStock = p.stockQuantity <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <img
                          src={img}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0"
                        />
                        <span className="font-bold text-darkText truncate max-w-[160px]">
                          {p.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-grayText">{p.category?.name || 'Produce'}</td>
                      <td className="py-3.5 px-4 font-bold text-darkText">
                        ₹{p.price} / {p.unit.toLowerCase()}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => {
                            setEditingStockProduct({ id: p.id, name: p.name, stock: p.stockQuantity });
                            setNewStock(p.stockQuantity);
                          }}
                          className={`font-semibold underline decoration-dotted hover:text-primary ${
                            isOutOfStock ? 'text-red-500' : 'text-darkText'
                          }`}
                          title="Click to edit stock"
                        >
                          {p.stockQuantity} {p.unit.toLowerCase()}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        {p.isOrganic ? (
                          <Badge variant="green" size="sm">
                            🌱 Organic
                          </Badge>
                        ) : (
                          <span className="text-gray-400">Regular</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={isOutOfStock ? 'red' : 'green'} size="sm">
                          {isOutOfStock ? 'Out of Stock' : 'Active'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Link
                          to={`/farmer/products/${p.id}/edit`}
                          className="inline-flex p-1.5 text-grayText hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit Produce"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="inline-flex p-1.5 text-grayText hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Produce"
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
          <div className="text-center py-12">
            <span className="text-3xl block mb-2">🥬</span>
            <p className="text-sm font-bold text-darkText mb-1">No Produce Listed Yet</p>
            <p className="text-xs text-grayText mb-4">
              Add your harvest so consumers can buy directly from your farm.
            </p>
            <Link to="/farmer/products/new">
              <Button variant="primary" size="sm">
                Add First Produce
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Stock Edit Modal */}
      <Modal
        isOpen={!!editingStockProduct}
        onClose={() => setEditingStockProduct(null)}
        title={`Update Stock: ${editingStockProduct?.name}`}
      >
        <div className="space-y-4">
          <Input
            label="Available Stock Quantity"
            type="number"
            value={newStock}
            onChange={(e) => setNewStock(parseFloat(e.target.value) || 0)}
            min={0}
          />
          <Button
            variant="primary"
            className="w-full"
            onClick={() => {
              if (editingStockProduct) {
                updateStockMutation.mutate({
                  id: editingStockProduct.id,
                  stock: newStock,
                });
              }
            }}
            isLoading={updateStockMutation.isPending}
          >
            Update Inventory
          </Button>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deletingProductId}
        onClose={() => setDeletingProductId(null)}
        title="Remove Produce Listing"
      >
        <div className="space-y-4">
          <p className="text-sm text-grayText">Are you sure you want to remove this harvest listing? This action cannot be undone.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeletingProductId(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              isLoading={deleteProductMutation.isPending}
            >
              Remove Listing
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
