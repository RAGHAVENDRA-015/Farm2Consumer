import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, CheckCircle2, ArrowLeft, Sprout } from 'lucide-react';
import { api } from '../../services/api';
import { productService } from '../../services/product.service';
import { FarmerProfile, ApiResponse } from '../../types';
import { ProductCard } from '../../components/product/ProductCard';
import { RatingStars } from '../../components/common/RatingStars';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { Button } from '../../components/common/Button';

export const FarmerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Query farmer profile
  const { data: farmer, isLoading: farmerLoading } = useQuery({
    queryKey: ['farmer', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<FarmerProfile>>(`/farmers/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  // Query products from this farmer
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['farmer-products', id],
    queryFn: () => productService.getProducts({ farmerId: id }),
    enabled: !!id,
  });

  const products = productsData?.items || [];

  if (farmerLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="max-w-md mx-auto my-20 text-center p-8 bg-white rounded-3xl border border-gray-100">
        <span className="text-4xl block mb-3">🧑‍🌾</span>
        <h2 className="text-xl font-bold text-darkText mb-2">Farmer Not Found</h2>
        <p className="text-sm text-grayText mb-6">
          The requested farm profile is not available.
        </p>
        <Link to="/farmers">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Farmers Directory
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Back button */}
      <Link
        to="/farmers"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-grayText hover:text-darkText transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Farmers
      </Link>

      {/* Farm Banner Card */}
      <div className="bg-gradient-to-r from-primary-50 via-white to-primary-50 rounded-3xl border border-primary-100 p-8 sm:p-10 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-primary text-white flex items-center justify-center font-extrabold text-3xl shadow-sm">
            {farmer.farmName.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-darkText tracking-tight">
                {farmer.farmName}
              </h1>
              {farmer.isApproved && (
                <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-grayText">
              <MapPin className="w-4 h-4 text-primary-600" />
              <span>
                {farmer.address ? `${farmer.address}, ` : ''}
                {farmer.city}, {farmer.state} - {farmer.pincode}
              </span>
            </div>
            <div className="pt-1">
              <RatingStars rating={farmer.rating || 4.8} showCount count={farmer.ratingCount || 10} />
            </div>
          </div>
        </div>

        <div>
          {farmer.isApproved ? (
            <Badge variant="green" size="md">
              🌱 Certified Verified Producer
            </Badge>
          ) : (
            <Badge variant="yellow" size="md">
              Pending Verification
            </Badge>
          )}
        </div>
      </div>

      {/* Farm Bio & Description */}
      {farmer.bio && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-2">
          <h3 className="font-bold text-darkText text-sm uppercase tracking-wider">About This Farm</h3>
          <p className="text-sm text-grayText leading-relaxed">{farmer.bio}</p>
        </div>
      )}

      {/* Produce Listed by This Farmer */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Sprout className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-darkText">Produce from {farmer.farmName}</h2>
          <span className="text-xs text-grayText">({products.length} harvests available)</span>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl p-6 text-sm text-grayText">
            This farm currently has no active listings in the marketplace.
          </div>
        )}
      </div>
    </div>
  );
};
