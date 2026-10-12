import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'gray' | 'yellow' | 'red' | 'blue';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'green',
  size = 'md',
  className = '',
}) => {
  const variants = {
    green: 'bg-primary-50 text-primary-700 border-primary-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};
