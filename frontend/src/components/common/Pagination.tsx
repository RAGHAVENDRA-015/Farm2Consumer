import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  // Generate page numbers to display
  const getPages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-8 mt-4 border-t border-gray-100">
      <button
        disabled={currentPage <= 1}
        onClick={() => {
          onPageChange(currentPage - 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
          currentPage <= 1
            ? 'border-gray-200 text-gray-400 bg-gray-50/50 cursor-not-allowed'
            : 'border-gray-200 text-darkText bg-white hover:border-primary-300 hover:text-primary hover:shadow-xs active:scale-95'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Previous</span>
      </button>

      <div className="flex items-center gap-1.5 mx-1">
        {getPages().map((p, idx) =>
          typeof p === 'number' ? (
            <button
              key={idx}
              onClick={() => {
                onPageChange(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                p === currentPage
                  ? 'bg-primary text-white shadow-sm shadow-primary/30 scale-105'
                  : 'text-darkText bg-white border border-gray-200 hover:border-primary-300 hover:text-primary hover:bg-primary-50/40'
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={idx} className="px-1 text-gray-400 text-xs font-bold">
              •••
            </span>
          )
        )}
      </div>

      <button
        disabled={currentPage >= totalPages}
        onClick={() => {
          onPageChange(currentPage + 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
          currentPage >= totalPages
            ? 'border-gray-200 text-gray-400 bg-gray-50/50 cursor-not-allowed'
            : 'border-gray-200 text-darkText bg-white hover:border-primary-300 hover:text-primary hover:shadow-xs active:scale-95'
        }`}
      >
        <span>Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
