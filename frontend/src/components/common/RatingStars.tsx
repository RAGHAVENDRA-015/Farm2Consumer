import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxStars = 5,
  size = 'sm',
  showCount = false,
  count,
}) => {
  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: maxStars }).map((_, i) => {
          const filled = i < Math.floor(rating);
          const half = !filled && i < rating;
          return (
            <Star
              key={i}
              className={`${starSizes[size]} ${
                filled
                  ? 'text-amber-400 fill-amber-400'
                  : half
                  ? 'text-amber-400 fill-amber-400/50'
                  : 'text-gray-200 fill-gray-100'
              }`}
            />
          );
        })}
      </div>
      <span className="text-xs font-semibold text-darkText ml-0.5">
        {rating > 0 ? rating.toFixed(1) : 'New'}
      </span>
      {showCount && count !== undefined && (
        <span className="text-xs text-grayText">({count})</span>
      )}
    </div>
  );
};
