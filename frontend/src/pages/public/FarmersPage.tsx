import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import { FarmerProfile, ApiResponse } from '../../types';
import { FarmerCard } from '../../components/farmer/FarmerCard';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const FarmersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: farmers = [], isLoading } = useQuery({
    queryKey: ['farmers'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<FarmerProfile[]>>('/farmers');
      return res.data.data;
    },
  });

  const filteredFarmers = farmers.filter((f) => {
    const q = searchTerm.toLowerCase();
    return (
      f.farmName.toLowerCase().includes(q) ||
      f.city.toLowerCase().includes(q) ||
      f.state.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary tracking-wider uppercase mb-1">
            <span>Verified Agriculture</span>
          </div>
          <h1 className="text-3xl font-extrabold text-darkText tracking-tight">
            Meet Our Regional Farmers
          </h1>
          <p className="text-sm text-grayText mt-1">
            Get to know the agricultural producers behind your food. Direct trade, zero middlemen.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by farm or city..."
            className="w-full bg-gray-50 text-sm pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:bg-white"
          />
          <Search className="w-4 h-4 text-grayText absolute left-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-gray-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredFarmers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFarmers.map((farmer) => (
            <FarmerCard key={farmer.id} farmer={farmer} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No farmers found"
          description="We couldn't find any farmers matching your search terms. Try searching another location or farm name."
          actionText="Clear Search"
          onAction={() => setSearchTerm('')}
        />
      )}
    </div>
  );
};
