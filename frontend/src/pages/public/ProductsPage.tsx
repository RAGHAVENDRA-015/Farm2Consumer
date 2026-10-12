import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, SlidersHorizontal, RotateCcw, X } from 'lucide-react';
import { productService } from '../../services/product.service';
import { categoryService } from '../../services/category.service';
import { ProductCard } from '../../components/product/ProductCard';
import { ProductCardSkeleton } from '../../components/common/Skeleton';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search and filter states derived from URL
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const isOrganicParam = searchParams.get('isOrganic');
  const isOrganic = isOrganicParam === 'true' ? true : undefined;
  const sort = (searchParams.get('sort') as any) || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!, 10) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : undefined;

  const [searchInput, setSearchInput] = useState(search);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync search input with URL
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Query categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });

  // Query products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', { search, category, isOrganic, sort, page, minPrice, maxPrice }],
    queryFn: () =>
      productService.getProducts({
        search: search || undefined,
        category: category || undefined,
        isOrganic,
        sort,
        page,
        minPrice,
        maxPrice,
        limit: 12,
      }),
  });

  const updateFilters = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === '') {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    });
    // Reset page to 1 when changing filters
    if (!('page' in updates)) {
      next.set('page', '1');
    }
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() || null });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const products = productsData?.items || [];
  const pagination = productsData?.pagination;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-darkText tracking-tight">
            Marketplace Produce
          </h1>
          <p className="text-sm text-grayText mt-1">
            Browse fresh harvest directly listed by certified regional farmers.
          </p>
        </div>

        {/* Search Bar & Mobile Filter Trigger */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-80">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search produce, fruits, herbs..."
              className="w-full bg-gray-50 text-sm pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:bg-white"
            />
            <Search className="w-4 h-4 text-grayText absolute left-3 top-3 pointer-events-none" />
          </form>

          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-darkText bg-white hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 text-primary" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden md:block col-span-1 bg-white rounded-2xl border border-gray-100 p-6 shadow-subtle space-y-6 sticky top-24">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2 font-bold text-darkText text-base">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <span>Filters</span>
            </div>
            {(category || isOrganic || search || minPrice || maxPrice) && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-700"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-darkText uppercase tracking-wider mb-3">
              Categories
            </h4>
            <div className="space-y-1.5">
              <button
                onClick={() => updateFilters({ category: null })}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !category
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-grayText hover:bg-gray-50 hover:text-darkText'
                }`}
              >
                All Categories
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateFilters({ category: cat.slug || cat.id })}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    category === cat.slug || category === cat.id
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-grayText hover:bg-gray-50 hover:text-darkText'
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat._count?.products !== undefined && (
                    <span className="text-[11px] opacity-70">({cat._count.products})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Organic Only Toggle */}
          <div className="pt-4 border-t border-gray-100">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-darkText">Certified Organic 🌱</span>
              <input
                type="checkbox"
                checked={!!isOrganic}
                onChange={(e) => updateFilters({ isOrganic: e.target.checked ? 'true' : null })}
                className="w-4 h-4 text-primary accent-primary rounded focus:ring-primary"
              />
            </label>
          </div>

          {/* Price Range */}
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <h4 className="text-xs font-bold text-darkText uppercase tracking-wider">
              Price Range (₹)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice || ''}
                onChange={(e) => updateFilters({ minPrice: e.target.value || null })}
                className="w-full text-xs p-2 rounded-lg border border-gray-200 outline-none focus:border-primary"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice || ''}
                onChange={(e) => updateFilters({ maxPrice: e.target.value || null })}
                className="w-full text-xs p-2 rounded-lg border border-gray-200 outline-none focus:border-primary"
              />
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="col-span-1 md:col-span-3 space-y-6">
          {/* Active Filter Chips & Sort Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <div className="text-xs text-grayText">
              Showing{' '}
              <span className="font-bold text-darkText">{pagination?.total || products.length}</span>{' '}
              farm items
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 text-xs font-medium text-darkText">
              <span className="text-grayText">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="bg-gray-50 border border-gray-200 text-darkText text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary font-medium"
              >
                <option value="newest">Newest Harvest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Farmer Rating</option>
              </select>
            </div>
          </div>

          {/* Product Items */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No produce found"
              description="No products matched your active filters or search terms. Try clearing some filters to explore more."
              actionText="Reset All Filters"
              onAction={handleResetFilters}
            />
          )}

          {/* Pagination */}
          {pagination && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(nextPage) => updateFilters({ page: String(nextPage) })}
            />
          )}
        </main>
      </div>

      {/* Mobile Filters Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-darkText/50 backdrop-blur-xs md:hidden">
          <div className="w-full bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto space-y-6 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="font-bold text-lg text-darkText">Filter Produce</h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-lg text-grayText"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-xs font-bold text-darkText uppercase tracking-wider mb-2">
                Category
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateFilters({ category: null })}
                  className={`p-2 rounded-xl text-xs font-medium text-center border ${
                    !category ? 'border-primary bg-primary-50 text-primary-700' : 'border-gray-200'
                  }`}
                >
                  All
                </button>
                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateFilters({ category: cat.slug || cat.id })}
                    className={`p-2 rounded-xl text-xs font-medium text-center border ${
                      category === cat.slug || category === cat.id
                        ? 'border-primary bg-primary-50 text-primary-700'
                        : 'border-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Organic */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <span className="text-sm font-medium text-darkText">Certified Organic 🌱</span>
              <input
                type="checkbox"
                checked={!!isOrganic}
                onChange={(e) => updateFilters({ isOrganic: e.target.checked ? 'true' : null })}
                className="w-5 h-5 text-primary accent-primary rounded"
              />
            </label>

            <Button
              variant="primary"
              className="w-full"
              onClick={() => setIsMobileFilterOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
