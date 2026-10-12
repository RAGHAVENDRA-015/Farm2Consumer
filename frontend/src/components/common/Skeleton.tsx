import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />;
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-subtle space-y-3">
      <Skeleton className="w-full aspect-square rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
};
