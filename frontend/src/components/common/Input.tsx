import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-darkText">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-grayText pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full text-sm rounded-xl border bg-white px-3.5 py-2.5 transition-all outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20 ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-gray-200 focus:border-primary'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-grayText flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        {!error && helperText && <p className="text-xs text-grayText">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
