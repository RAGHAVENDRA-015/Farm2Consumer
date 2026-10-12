import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Address, ApiResponse } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';

export const AddressesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Query addresses
  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['saved-addresses'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Address[]>>('/users/me/addresses');
      return res.data.data;
    },
  });

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post<ApiResponse<Address>>('/users/me/addresses', {
        name,
        phone,
        addressLine,
        city,
        state,
        pincode,
        isDefault,
      });
      success('Address saved!');
      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
      setIsModalOpen(false);
      setName('');
      setPhone('');
      setAddressLine('');
      setCity('');
      setState('');
      setPincode('');
      setIsDefault(false);
    } catch (err: any) {
      error(err.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Delete this saved address?')) return;
    try {
      await api.delete(`/users/me/addresses/${id}`);
      success('Address deleted.');
      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
    } catch (err: any) {
      error(err.message || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/users/me/addresses/${id}`, { isDefault: true });
      success('Default address updated.');
      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
    } catch (err: any) {
      error(err.message || 'Failed to set default address');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-darkText">Saved Delivery Addresses</h2>
          <p className="text-xs text-grayText">Manage destinations for your farm produce deliveries</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Address
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-36 bg-gray-50 rounded-2xl animate-pulse" />
          <div className="h-36 bg-gray-50 rounded-2xl animate-pulse" />
        </div>
      ) : addresses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-2xl border bg-white shadow-subtle flex flex-col justify-between transition-all ${
                addr.isDefault ? 'border-primary-300 ring-2 ring-primary/10' : 'border-gray-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-darkText text-sm">{addr.name}</span>
                  {addr.isDefault && <Badge variant="green">Default</Badge>}
                </div>
                <p className="text-xs text-grayText leading-relaxed">
                  {addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}
                </p>
                <p className="text-xs text-gray-600 mt-2 font-medium">📞 {addr.phone}</p>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between">
                {!addr.isDefault ? (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Set as Default
                  </button>
                ) : (
                  <span className="text-[11px] text-primary-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Primary Address
                  </span>
                )}
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <p className="text-xs text-grayText mb-3">You don't have any saved delivery addresses.</p>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            Add First Address
          </Button>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Delivery Address">
        <form onSubmit={handleAddAddress} className="space-y-4">
          <Input
            label="Recipient Name"
            placeholder="Sai Raghavendra"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Phone Number"
            placeholder="9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Input
            label="Address (Door/Street/Locality)"
            placeholder="Door 12-3, Main Road"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              placeholder="Vijayawada"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            <Input
              label="State"
              placeholder="Andhra Pradesh"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            />
          </div>
          <Input
            label="Pincode"
            placeholder="520001"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            required
          />

          <label className="flex items-center gap-2 text-xs font-medium text-darkText cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-primary accent-primary rounded"
            />
            <span>Set as default address</span>
          </label>

          <Button type="submit" variant="primary" className="w-full">
            Save Address
          </Button>
        </form>
      </Modal>
    </div>
  );
};
