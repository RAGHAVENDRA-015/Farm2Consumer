import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Check, MapPin } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { RatingStars } from '../common/RatingStars';
import { Badge } from '../common/Badge';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, isLoading } = useCart();
  const [isAdding, setIsAdding] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);

  const fallbackPlaceholder = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600';

  const rawImage =
    product.images && product.images.length > 0 && product.images[0].imageUrl
      ? product.images[0].imageUrl
      : fallbackPlaceholder;

  const mainImage = imgError ? fallbackPlaceholder : rawImage;

  const isOutOfStock = product.stockQuantity <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    try {
      setIsAdding(true);
      await addToCart(product.id, 1);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-subtle hover:shadow-cardHover hover:-translate-y-1 transition-all duration-200"
    >
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full overflow-hidden bg-primary-50/50">
        <img
          src={mainImage}
          alt={product.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {product.isOrganic && <Badge variant="green">🌱 Organic</Badge>}
          {isOutOfStock && <Badge variant="red">Out of Stock</Badge>}
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col flex-1 p-4">
        {/* Category & Rating */}
        <div className="flex items-center justify-between text-xs text-grayText mb-1.5">
          <span className="font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md">
            {product.category?.name || 'Produce'}
          </span>
          <RatingStars rating={product.farmer?.rating || 4.8} />
        </div>

        {/* Title */}
        <h3 className="font-semibold text-darkText text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Farmer & Location */}
        {product.farmer && (
          <div className="flex items-center gap-1 text-xs text-grayText mb-3">
            <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0" />
            <span className="line-clamp-1">
              {product.farmer.farmName} ({product.farmer.city || product.farmer.state})
            </span>
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
          {/* Price */}
          <div>
            <span className="text-lg font-bold text-darkText">₹{product.price}</span>
            <span className="text-xs text-grayText ml-1">/ {product.unit.toLowerCase()}</span>
          </div>

          {/* Add to Cart button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isLoading || isAdding}
            className={`inline-flex items-center justify-center p-2.5 rounded-xl font-medium transition-all ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isAdding
                ? 'bg-primary text-white scale-95'
                : 'bg-primary text-white hover:bg-primary-700 shadow-sm active:scale-95'
            }`}
            title="Add to cart"
          >
            {isAdding ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </Link>
  );
};
