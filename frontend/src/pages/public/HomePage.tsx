import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ShieldCheck, Sprout, Truck, Sparkles } from 'lucide-react';
import { productService } from '../../services/product.service';
import { categoryService } from '../../services/category.service';
import { ProductCard } from '../../components/product/ProductCard';
import { CategoryCard } from '../../components/category/CategoryCard';
import { ProductCardSkeleton } from '../../components/common/Skeleton';
import { Button } from '../../components/common/Button';

export const HomePage: React.FC = () => {
  // Query featured products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => productService.getProducts({ limit: 8, sort: 'newest' }),
  });

  // Query categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });

  const featuredProducts = productsData?.items || [];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/50 via-white to-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-100/60 border border-primary-200 text-xs font-bold text-primary-800">
                <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                <span>Direct Digital Farmers' Market</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-darkText tracking-tight leading-[1.15]">
                Fresh from the Farm.{' '}
                <span className="text-primary block sm:inline">Straight to Your Home.</span>
              </h1>

              <p className="text-base sm:text-lg text-grayText max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Connect directly with certified local farmers. Enjoy harvest-fresh vegetables,
                fruits, and organic staples with zero middlemen and 100% fair farmer prices.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link to="/products" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Shop Fresh Produce
                  </Button>
                </Link>
                <Link to="/farmers" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Meet Our Farmers
                  </Button>
                </Link>
              </div>

              {/* Trust metric badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100 max-w-md mx-auto lg:mx-0">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-darkText">100%</p>
                  <p className="text-xs text-grayText">Directly Sourced</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-darkText">0%</p>
                  <p className="text-xs text-grayText">Middleman Markup</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-darkText">24-48h</p>
                  <p className="text-xs text-grayText">Farm to Table</p>
                </div>
              </div>
            </div>

            {/* Right Agricultural Photography Collage */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-4/3 bg-primary-50">
                  <img
                    src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=1000"
                    alt="Fresh organic vegetables harvest"
                    className="w-full h-full object-cover"
                    decoding="async"
                  />
                </div>

                {/* Floating Farm Card */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 flex items-center gap-3 animate-in slide-in-from-bottom-4">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg">
                    🌿
                  </div>
                  <div>
                    <p className="text-xs font-bold text-darkText">Direct Harvest Guarantee</p>
                    <p className="text-[11px] text-grayText">Freshly picked by local growers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary tracking-wider uppercase mb-1">
              <span>Categories</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-darkText tracking-tight">
              Explore Fresh Produce
            </h2>
          </div>
          <Link
            to="/products"
            className="text-sm font-semibold text-primary hover:text-primary-700 inline-flex items-center gap-1"
          >
            All Categories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {categoriesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {categories && categories.length > 0 ? (
              categories.map((cat) => <CategoryCard key={cat.id} category={cat} />)
            ) : (
              // Default fallback categories
              <>
                <CategoryCard category={{ id: '1', name: 'Vegetables', slug: 'vegetables', description: null, imageUrl: null, isActive: true, createdAt: '', updatedAt: '' }} iconEmoji="🥬" />
                <CategoryCard category={{ id: '2', name: 'Fruits', slug: 'fruits', description: null, imageUrl: null, isActive: true, createdAt: '', updatedAt: '' }} iconEmoji="🍎" />
                <CategoryCard category={{ id: '3', name: 'Grains', slug: 'grains', description: null, imageUrl: null, isActive: true, createdAt: '', updatedAt: '' }} iconEmoji="🌾" />
                <CategoryCard category={{ id: '4', name: 'Organic', slug: 'organic', description: null, imageUrl: null, isActive: true, createdAt: '', updatedAt: '' }} iconEmoji="🌱" />
                <CategoryCard category={{ id: '5', name: 'Pulses', slug: 'pulses', description: null, imageUrl: null, isActive: true, createdAt: '', updatedAt: '' }} iconEmoji="🫘" />
                <CategoryCard category={{ id: '6', name: 'Herbs', slug: 'herbs', description: null, imageUrl: null, isActive: true, createdAt: '', updatedAt: '' }} iconEmoji="🌿" />
              </>
            )}
          </div>
        )}
      </section>

      {/* Featured Products Section (Fresh Picks) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary tracking-wider uppercase mb-1">
              <span>Fresh Picks</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-darkText tracking-tight">
              Featured Harvest
            </h2>
          </div>
          <Link
            to="/products"
            className="text-sm font-semibold text-primary hover:text-primary-700 inline-flex items-center gap-1"
          >
            Browse All ({productsData?.pagination.total || '20+'}) <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-3xl p-8">
            <span className="text-4xl block mb-2">🌱</span>
            <h3 className="text-lg font-bold text-darkText mb-1">Fresh Produce Arriving Soon</h3>
            <p className="text-sm text-grayText mb-4">
              Local farmers are preparing new harvests for this season.
            </p>
            <Link to="/register?type=farmer">
              <Button variant="primary">Are you a farmer? List your produce</Button>
            </Link>
          </div>
        )}
      </section>

      {/* Why FarmLink Trust Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-primary-50/70 rounded-3xl border border-primary-100 p-8 sm:p-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-darkText tracking-tight mb-3">
              Why Buy Through FarmLink?
            </h2>
            <p className="text-sm text-grayText">
              Every order directly supports Indian farming communities while bringing pure,
              unadulterated farm goodness straight to your kitchen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-subtle border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary flex items-center justify-center mb-4">
                <Sprout className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-darkText text-base mb-2">100% Direct from Farm</h3>
              <p className="text-xs text-grayText leading-relaxed">
                Produce is picked at peak ripeness directly from the grower's field rather than
                sitting in commercial cold storages.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-subtle border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-darkText text-base mb-2">Fair Farmer Earnings</h3>
              <p className="text-xs text-grayText leading-relaxed">
                By removing exploitative middlemen, farmers earn up to 40% more while consumers
                enjoy honest, transparent prices.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-subtle border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary flex items-center justify-center mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-darkText text-base mb-2">Swift Local Delivery</h3>
              <p className="text-xs text-grayText leading-relaxed">
                Orders are packed immediately upon confirmation and dispatched quickly with live
                status tracking.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
