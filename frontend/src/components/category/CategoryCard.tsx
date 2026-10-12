import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../../types';

interface CategoryCardProps {
  category: Category;
  iconEmoji?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, iconEmoji }) => {
  const [imageError, setImageError] = React.useState(false);

  const getFallbackEmoji = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('veg')) return '🥬';
    if (n.includes('fruit')) return '🍎';
    if (n.includes('grain')) return '🌾';
    if (n.includes('organic')) return '🌱';
    if (n.includes('pulse') || n.includes('dal')) return '🫘';
    if (n.includes('herb') || n.includes('spice')) return '🌿';
    if (n.includes('dairy')) return '🥛';
    if (n.includes('seed') || n.includes('sapling')) return '🪴';
    return '🌱';
  };

  const emoji = iconEmoji || getFallbackEmoji(category.name);

  return (
    <Link
      to={`/products?category=${category.slug || category.id}`}
      className="group flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-gray-100 shadow-subtle hover:shadow-cardHover hover:border-primary-200 hover:-translate-y-1 transition-all duration-200 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary-50 text-3xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-primary-100 transition-all duration-200">
        {category.imageUrl && !imageError ? (
          <img
            src={category.imageUrl}
            alt={category.name}
            onError={() => setImageError(true)}
            className="w-10 h-10 object-contain"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span>{emoji}</span>
        )}
      </div>
      <h4 className="font-semibold text-darkText text-sm group-hover:text-primary transition-colors">
        {category.name}
      </h4>
      {category._count?.products !== undefined && (
        <span className="text-[11px] text-grayText mt-0.5">
          {category._count.products} items
        </span>
      )}
    </Link>
  );
};
