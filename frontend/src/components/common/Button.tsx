import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1 select-none';

  const stateStyles = isLoading
    ? 'cursor-wait opacity-95 pointer-events-none'
    : disabled
    ? 'opacity-50 pointer-events-none cursor-not-allowed'
    : 'active:scale-[0.98] cursor-pointer';

  const variants = {
    primary:
      'bg-primary text-white hover:bg-primary-700 shadow-sm hover:shadow focus:ring-primary',
    secondary:
      'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 focus:ring-primary',
    outline:
      'bg-white text-darkText border border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus:ring-gray-300',
    danger:
      'bg-red-500 text-white hover:bg-red-600 shadow-sm focus:ring-red-400',
    ghost:
      'text-grayText hover:text-darkText hover:bg-gray-100 focus:ring-gray-200',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${stateStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : (
        leftIcon
      )}
      <span className="truncate">{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
