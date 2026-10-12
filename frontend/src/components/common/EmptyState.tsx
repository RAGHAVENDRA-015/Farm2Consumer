import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-subtle max-w-md mx-auto my-8">
      {icon ? (
        <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary flex items-center justify-center mb-4">
          {icon}
        </div>
      ) : (
        <span className="text-4xl mb-4">🌿</span>
      )}
      <h3 className="text-lg font-bold text-darkText mb-1.5">{title}</h3>
      <p className="text-sm text-grayText mb-6 max-w-xs">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionText}
        </Button>
      )}
    </div>
  );
};
