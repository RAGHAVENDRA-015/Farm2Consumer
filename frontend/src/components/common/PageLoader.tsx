import React from 'react';

export const PageLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-16 space-y-4">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulse */}
        <div className="absolute w-16 h-16 rounded-full bg-primary-100 animate-ping opacity-75" />
        {/* Spinning ring */}
        <div className="w-14 h-14 rounded-full border-3 border-primary-100 border-t-primary animate-spin" />
        {/* Center eco icon */}
        <span className="absolute text-xl select-none animate-pulse">🌿</span>
      </div>
      <p className="text-xs font-semibold text-grayText tracking-wide animate-pulse">
        Harvesting fresh produce...
      </p>
    </div>
  );
};
