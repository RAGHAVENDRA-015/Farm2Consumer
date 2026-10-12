import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, ShieldCheck, Search, Eye } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { useToast } from '../../contexts/ToastContext';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { FarmerProfile } from '../../types';

export const AdminFarmersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerProfile | null>(null);

  const { data: farmers = [], isLoading } = useQuery({
    queryKey: ['admin-farmers'],
    queryFn: () => adminService.getFarmers(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminService.approveFarmer(id),
    onSuccess: () => {
      success('Farmer approved as a verified marketplace seller!');
      queryClient.invalidateQueries({ queryKey: ['admin-farmers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setSelectedFarmer(null);
    },
    onError: (err: any) => error(err.message || 'Approval failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminService.rejectFarmer(id),
    onSuccess: () => {
      success('Farmer verification rejected/revoked.');
      queryClient.invalidateQueries({ queryKey: ['admin-farmers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setSelectedFarmer(null);
    },
    onError: (err: any) => error(err.message || 'Action failed'),
  });

  const farmersList: FarmerProfile[] = Array.isArray(farmers) ? farmers : (farmers as any)?.items || [];

  const filtered = farmersList.filter((f) => {
    const matchesFilter =
      filter === 'ALL'
        ? true
        : filter === 'PENDING'
        ? !f.isApproved
        : f.isApproved;

    const matchesSearch =
      f.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.user?.name && f.user.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-darkText">Farmer Verification Management</h1>
          <p className="text-xs text-grayText">
            Verify legitimate agricultural producers before their products become visible in the
            marketplace.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {(['ALL', 'PENDING', 'APPROVED'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                filter === mode
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white text-grayText border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {mode === 'ALL' ? 'All Farmers' : mode === 'PENDING' ? 'Pending Approval' : 'Verified'}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search farm, grower, location..."
            className="w-full bg-gray-50 text-xs pl-8 pr-3 py-2 rounded-xl border border-gray-200 outline-none focus:border-primary"
          />
          <Search className="w-3.5 h-3.5 text-grayText absolute left-2.5 top-2.5" />
        </div>
        <span className="text-xs text-grayText font-medium">
          Showing <span className="font-bold text-darkText">{filtered.length}</span> farmers
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
                  <th className="py-3.5 px-4">Farm Details</th>
                  <th className="py-3.5 px-4">Grower Name</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Verification Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50/60">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-darkText text-sm">{f.farmName}</p>
                      {f.bio && <p className="text-[11px] text-grayText truncate max-w-xs">{f.bio}</p>}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 font-semibold">
                      {f.user?.name || 'Registered Farmer'}
                    </td>
                    <td className="py-3.5 px-4 text-grayText">
                      {f.city}, {f.state}
                    </td>
                    <td className="py-3.5 px-4">
                      {f.isApproved ? (
                        <Badge variant="green">Approved</Badge>
                      ) : (
                        <Badge variant="yellow">Pending Review</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedFarmer(f)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>

                      {!f.isApproved ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => approveMutation.mutate(f.id)}
                          isLoading={approveMutation.isPending}
                          leftIcon={<Check className="w-3.5 h-3.5" />}
                        >
                          Approve
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => rejectMutation.mutate(f.id)}
                          isLoading={rejectMutation.isPending}
                          leftIcon={<X className="w-3.5 h-3.5" />}
                        >
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-grayText">
            No farmers match the current filter.
          </div>
        )}
      </div>

      {/* Inspect Farmer Modal */}
      {selectedFarmer && (
        <Modal
          isOpen={!!selectedFarmer}
          onClose={() => setSelectedFarmer(null)}
          title="Farmer Application Review"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-gray-50 rounded-2xl space-y-1.5">
              <p className="text-grayText">Farm Name</p>
              <p className="font-bold text-darkText text-base">{selectedFarmer.farmName}</p>
              <p className="text-grayText mt-2">Location Address</p>
              <p className="font-medium text-darkText">
                {selectedFarmer.address ? `${selectedFarmer.address}, ` : ''}
                {selectedFarmer.city}, {selectedFarmer.state} - {selectedFarmer.pincode}
              </p>
            </div>

            {selectedFarmer.bio && (
              <div>
                <p className="font-bold text-darkText mb-1">Grower Bio / Farming Practice</p>
                <p className="text-grayText leading-relaxed p-3 bg-gray-50 rounded-xl">
                  {selectedFarmer.bio}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
              {!selectedFarmer.isApproved ? (
                <Button
                  variant="primary"
                  onClick={() => approveMutation.mutate(selectedFarmer.id)}
                  isLoading={approveMutation.isPending}
                >
                  Approve Application
                </Button>
              ) : (
                <Button
                  variant="danger"
                  onClick={() => rejectMutation.mutate(selectedFarmer.id)}
                  isLoading={rejectMutation.isPending}
                >
                  Revoke Verification
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
