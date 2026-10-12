import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import { FarmerProfile } from '../../types';
import { RatingStars } from '../common/RatingStars';
import { Badge } from '../common/Badge';

interface FarmerCardProps {
  farmer: FarmerProfile;
}

export const FarmerCard: React.FC<FarmerCardProps> = ({ farmer }) => {
  return (
    <div className="flex flex-col bg-white rounded-2xl border border-gray-100 p-5 shadow-subtle hover:shadow-cardHover hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
            {farmer.farmName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-darkText text-base">{farmer.farmName}</h4>
              {farmer.isApproved && (
                <CheckCircle className="w-4 h-4 text-primary fill-primary/20" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-grayText mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0" />
              <span>
                {farmer.city}, {farmer.state}
              </span>
            </div>
          </div>
        </div>
        {farmer.isApproved && <Badge variant="green">Verified</Badge>}
      </div>

      {farmer.bio && (
        <p className="text-xs text-grayText line-clamp-2 mb-4 leading-relaxed">
          {farmer.bio}
        </p>
      )}

      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
        <RatingStars rating={farmer.rating || 4.9} showCount count={farmer.ratingCount || 12} />
        <Link
          to={`/farmers/${farmer.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-700 transition-colors"
        >
          View Farm <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
