import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart,
  Zap,
  MapPin,
  CheckCircle2,
  Calendar,
  PackageCheck,
  ShieldCheck,
  ArrowLeft,
  Star,
  Plus,
  Minus,
} from 'lucide-react';
import { productService } from '../../services/product.service';
import { reviewService } from '../../services/review.service';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { RatingStars } from '../../components/common/RatingStars';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToCart, isLoading: cartLoading } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { success, error } = useToast();

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  // Review Form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Reset image state on product change
  React.useEffect(() => {
    setImgError(false);
    setSelectedImageIndex(0);
  }, [id]);

  // Query product details
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProductById(id!),
    enabled: !!id,
  });

  // Query product reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => reviewService.getReviewsByProduct(id!),
    enabled: !!id,
  });

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart(product.id, quantity);
    } catch {
      // toast shown in context
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    try {
      await addToCart(product.id, quantity);
      navigate('/checkout');
    } catch {
      // toast shown in context
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('farmlink_token');
    if (!isAuthenticated || !token) {
      error('Please sign in to write a review.');
      navigate(`/login?redirect=/products/${id}`);
      return;
    }
    if (!id) return;

    try {
      setIsSubmittingReview(true);
      await reviewService.createReview(id, reviewRating, reviewComment.trim() || undefined);
      success('Thank you! Your review has been submitted.');
      setReviewComment('');
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    } catch (err: any) {
      if (err.status === 401 || err.code === 'INVALID_TOKEN' || err.message?.includes('token')) {
        error('Your session has expired. Please sign in again.');
        navigate(`/login?redirect=/products/${id}`);
        return;
      }
      error(err.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-square w-full rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-md mx-auto my-20 text-center p-8 bg-white rounded-3xl border border-gray-100">
        <span className="text-4xl block mb-3">🔍</span>
        <h2 className="text-xl font-bold text-darkText mb-2">Product Not Found</h2>
        <p className="text-sm text-grayText mb-6">
          This produce may have been harvested out or removed by the farmer.
        </p>
        <Link to="/products">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  const fallbackDetailImage = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800';

  const images = product.images && product.images.length > 0 ? product.images : [];
  const rawImageUrl =
    images.length > 0
      ? images[selectedImageIndex]?.imageUrl || images[0].imageUrl
      : fallbackDetailImage;
  const currentImageUrl = imgError ? fallbackDetailImage : rawImageUrl;

  const isOutOfStock = product.stockQuantity <= 0;
  const maxAvailable = Math.min(product.stockQuantity, 50);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-medium text-grayText">
        <Link to="/" className="hover:text-primary">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary">Produce</Link>
        <span>/</span>
        <span className="text-darkText font-semibold">{product.name}</span>
      </div>

      {/* Main Top Section: Image Gallery & Buy Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Left: Product Images */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-primary-50/50 border border-gray-100 shadow-subtle">
            <img
              src={currentImageUrl}
              alt={product.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
              decoding="async"
            />
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isOrganic && <Badge variant="green">🌱 100% Certified Organic</Badge>}
              {isOutOfStock ? (
                <Badge variant="red">Sold Out</Badge>
              ) : (
                <Badge variant="green">In Stock ({product.stockQuantity} {product.unit.toLowerCase()} available)</Badge>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImageIndex === idx ? 'border-primary shadow-xs' : 'border-gray-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Buy Box & Produce Specifications */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md">
              {product.category?.name || 'Farm Produce'}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-darkText tracking-tight mt-2 mb-2">
              {product.name}
            </h1>
            <div className="flex items-center gap-3">
              <RatingStars rating={product.farmer?.rating || 4.8} showCount count={reviews.length} />
              <span className="text-xs text-grayText">•</span>
              <span className="text-xs text-grayText">Harvested directly from local soil</span>
            </div>
          </div>

          {/* Price */}
          <div className="p-4 rounded-2xl bg-primary-50/60 border border-primary-100 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-primary-800">
              ₹{product.price}
            </span>
            <span className="text-sm font-semibold text-grayText">
              / per {product.unit.toLowerCase()}
            </span>
          </div>

          {/* Short Description */}
          <p className="text-sm text-grayText leading-relaxed">
            {product.description}
          </p>

          {/* Quantity selector & Actions */}
          {!isOutOfStock ? (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-darkText uppercase tracking-wider">
                  Quantity ({product.unit.toLowerCase()}):
                </span>
                <div className="inline-flex items-center border border-gray-200 rounded-xl bg-white p-1">
                  <button
                    onClick={() => setQuantity(Math.max(product.minOrderQuantity || 1, quantity - 1))}
                    disabled={quantity <= (product.minOrderQuantity || 1)}
                    className="p-1.5 text-grayText hover:text-darkText disabled:opacity-30 rounded-lg hover:bg-gray-100"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-darkText">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(maxAvailable, quantity + 1))}
                    disabled={quantity >= maxAvailable}
                    className="p-1.5 text-grayText hover:text-darkText disabled:opacity-30 rounded-lg hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-grayText">
                  Total: <span className="font-bold text-darkText">₹{product.price * quantity}</span>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  size="lg"
                  variant="primary"
                  className="flex-1"
                  onClick={handleAddToCart}
                  isLoading={cartLoading}
                  leftIcon={<ShoppingCart className="w-5 h-5" />}
                >
                  Add to Cart
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="flex-1"
                  onClick={handleBuyNow}
                  leftIcon={<Zap className="w-5 h-5" />}
                >
                  Buy Now
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
              Currently sold out. Check back soon for the next harvest batch!
            </div>
          )}

          {/* Farmer Card Summary */}
          {product.farmer && (
            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-subtle flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
                  {product.farmer.farmName ? product.farmer.farmName.charAt(0).toUpperCase() : '🌾'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-darkText text-sm">{product.farmer.farmName || 'Local Farm'}</h4>
                    {product.farmer.isApproved && (
                      <CheckCircle2 className="w-4 h-4 text-primary fill-primary/20" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-grayText mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                    <span>{[product.farmer.city, product.farmer.state].filter(Boolean).join(', ') || 'Local Producer'}</span>
                  </div>
                </div>
              </div>

              <Link
                to={`/farmers/${product.farmer.id}`}
                className="text-xs font-semibold text-primary hover:text-primary-700 underline"
              >
                View Farm Profile
              </Link>
            </div>
          )}

          {/* Harvest & Quality Attributes */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 text-xs">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-grayText">Harvest Timing</p>
                <p className="font-semibold text-darkText">Picked Fresh on Order</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 text-xs">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-grayText">Purity Guarantee</p>
                <p className="font-semibold text-darkText">Zero Chemical Residue</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="pt-10 border-t border-gray-100 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-darkText tracking-tight">
              Customer Reviews ({reviews.length})
            </h3>
            <p className="text-xs text-grayText mt-1">
              Verified feedback from buyers who purchased this produce.
            </p>
          </div>
        </div>

        {/* Write a Review Box */}
        {isAuthenticated ? (
          <form
            onSubmit={handleReviewSubmit}
            className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4"
          >
            <h4 className="text-sm font-bold text-darkText">Share Your Experience</h4>
            <div>
              <label className="block text-xs font-semibold text-darkText mb-1.5">
                Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= reviewRating ? 'fill-amber-400' : 'text-gray-300 fill-none'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-darkText ml-2">{reviewRating} Stars</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-darkText mb-1.5">
                Comment / Feedback
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="How was the freshness, taste, and packaging?"
                rows={3}
                className="w-full text-sm p-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-primary"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingReview}
            >
              Submit Review
            </Button>
          </form>
        ) : (
          <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100 flex items-center justify-between text-xs">
            <span className="text-primary-800 font-medium">
              Purchased this produce? Sign in to share your feedback with other consumers.
            </span>
            <Link to={`/login?redirect=/products/${id}`} className="font-bold text-primary hover:underline">
              Sign In
            </Link>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((rev) => {
              const reviewerName = rev.customer?.name || rev.user?.name || 'Customer';
              return (
                <div
                  key={rev.id}
                  className="p-5 bg-white rounded-2xl border border-gray-100 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-800 font-bold text-xs flex items-center justify-center">
                        {reviewerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-darkText">{reviewerName}</p>
                        <p className="text-[10px] text-grayText">
                          {new Date(rev.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <RatingStars rating={rev.rating} />
                  </div>
                  {rev.comment && (
                    <p className="text-xs text-grayText leading-relaxed pt-1">
                      {rev.comment}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-grayText italic">
            No customer reviews yet. Be the first to try this harvest and leave a review!
          </p>
        )}
      </section>
    </div>
  );
};
