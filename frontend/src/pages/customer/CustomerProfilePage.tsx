import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { User, ApiResponse } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const CustomerProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await api.patch<ApiResponse<User>>('/users/me', {
        name,
        phone: phone.trim() || null,
      });
      await refreshProfile();
      success('Profile updated successfully!');
    } catch (err: any) {
      error(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl bg-white rounded-3xl border border-gray-100 p-8 shadow-subtle space-y-6">
      <div>
        <h2 className="text-xl font-bold text-darkText">Personal Profile</h2>
        <p className="text-xs text-grayText">Manage your personal information and contact details</p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <Input
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Email Address"
          value={user?.email || ''}
          disabled
          helperText="Email is managed via your Firebase sign-in account"
        />

        <Input
          label="Phone Number"
          placeholder="e.g. +91 9876543210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <div className="pt-2">
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
