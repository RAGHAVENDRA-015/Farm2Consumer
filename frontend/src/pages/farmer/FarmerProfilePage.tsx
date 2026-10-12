import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmerService } from '../../services/farmer.service';
import { useToast } from '../../contexts/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const FarmerProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [farmName, setFarmName] = useState('');
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['farmer-profile'],
    queryFn: () => farmerService.getProfile(),
  });

  useEffect(() => {
    if (profile) {
      setFarmName(profile.farmName || '');
      setBio(profile.bio || '');
      setAddress(profile.address || '');
      setCity(profile.city || '');
      setState(profile.state || '');
      setPincode(profile.pincode || '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => farmerService.updateProfile(data),
    onSuccess: () => {
      success('Farm profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['farmer-profile'] });
    },
    onError: (err: any) => error(err.message || 'Failed to update farm profile'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      farmName,
      bio: bio.trim() || undefined,
      address,
      city,
      state,
      pincode,
    });
  };

  return (
    <div className="max-w-2xl bg-white rounded-3xl border border-gray-100 p-8 shadow-subtle space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-darkText">Farm Profile & Verification</h1>
          <p className="text-xs text-grayText">Manage your farm's public identity and location</p>
        </div>
        {profile?.isApproved ? (
          <Badge variant="green">Verified Producer</Badge>
        ) : (
          <Badge variant="yellow">Pending Review</Badge>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Farm Name"
          value={farmName}
          onChange={(e) => setFarmName(e.target.value)}
          required
        />

        <div>
          <label className="block text-xs font-semibold text-darkText mb-1.5">
            Farm Story / About the Grower
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Share your agricultural legacy, soil enrichment practices, and what makes your produce exceptional..."
            rows={3}
            className="w-full text-xs p-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
          />
        </div>

        <Input
          label="Farm Address / Survey Road"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="City / Village"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
          <Input
            label="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
          />
        </div>

        <Input
          label="Pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value)}
          required
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={updateMutation.isPending}
          >
            Save Farm Details
          </Button>
        </div>
      </form>
    </div>
  );
};
