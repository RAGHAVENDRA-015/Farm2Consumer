import React, { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-darkText">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full text-sm rounded-xl border bg-white px-3.5 py-2.5 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
              : 'border-gray-200 focus:border-primary'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
