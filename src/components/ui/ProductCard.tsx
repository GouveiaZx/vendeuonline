'use client';

import React, { useMemo, useCallback } from 'react';
import { Star, Heart, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  className?: string;
  showActions?: boolean;
  viewMode?: 'grid' | 'list';
  onAddToWishlist?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
}

const ProductCard = React.memo<ProductCardProps>(({
  product,
  className = '',
  showActions = true,
  viewMode = 'grid',
  onAddToWishlist,
  onAddToCart,
  onToggleWishlist
}) => {
  // Memoized computed values to prevent recalculation on every render
  const computedValues = useMemo(() => {
    const {
      id,
      name,
      images,
      price,
      comparePrice,
      category,
      sellerId,
      isActive = true
    } = product;
    
    const averageRating = Number((product as any).averageRating) || 0;
    const totalReviews = Number((product as any).totalReviews) || 0;

    const image = images && images.length > 0 ? 
      (typeof images[0] === 'string' ? images[0] : images[0].url) : undefined;
    const originalPrice = comparePrice;
    const discount = originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined;
    const displayRating = averageRating;
    const displayReviews = totalReviews;
    const inStock = isActive;

    const categoryPrompt = category ? category.toLowerCase() : 'product';
    const placeholderImage = `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(categoryPrompt + ' product placeholder')}&image_size=square`;

    return {
      id,
      name,
      image,
      price,
      originalPrice,
      discount,
      displayRating,
      displayReviews,
      inStock,
      placeholderImage,
      sellerId
    };
  }, [product]);

  // Memoized event handlers to prevent child component re-renders
  const handleAddToWishlist = useCallback(() => {
    if (onAddToWishlist) {
      onAddToWishlist(product);
    } else if (onToggleWishlist) {
      onToggleWishlist(product);
    } else {
      toast.success('Produto adicionado à lista de desejos');
    }
  }, [onAddToWishlist, onToggleWishlist, product]);

  const handleAddToCart = useCallback(() => {
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      toast.success('Produto adicionado ao carrinho');
    }
  }, [onAddToCart, product]);

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}>
      <Link href={`/products/${computedValues.id}`} className="block">
        <div className="relative">
          <OptimizedImage
            src={computedValues.image || computedValues.placeholderImage}
            alt={computedValues.name}
            className="w-full h-48 object-cover"
            fallback={computedValues.placeholderImage}
          />
          
          {computedValues.discount && computedValues.discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
              -{computedValues.discount}%
            </div>
          )}
          
          {!computedValues.inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-medium">Fora de Estoque</span>
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link href={`/products/${computedValues.id}`} className="block">
          <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 hover:text-blue-600 transition-colors">
            {computedValues.name}
          </h3>
        </Link>
        
        {computedValues.sellerId && (
          <p className="text-sm text-gray-500 mb-2">
            Vendedor: {computedValues.sellerId}
          </p>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-green-600">
                R$ {(Number(computedValues.price) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              {computedValues.originalPrice && computedValues.originalPrice > computedValues.price && (
                <span className="text-sm text-gray-500 line-through">
                  R$ {(Number(computedValues.originalPrice) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>
          
          {computedValues.displayRating > 0 && (
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">
                {(Number(computedValues.displayRating) || 0).toFixed(1)}
                {computedValues.displayReviews > 0 && (
                  <span className="text-gray-400"> ({Number(computedValues.displayReviews) || 0})</span>
                )}
              </span>
            </div>
          )}
        </div>
        
        {showActions && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddToWishlist}
              className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={!computedValues.inStock}
            >
              <Heart className="h-4 w-4 mr-1" />
              <span className="text-sm">Favoritar</span>
            </button>
            
            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!computedValues.inStock}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              <span className="text-sm">Carrinho</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

// Display name for debugging
ProductCard.displayName = 'ProductCard';

export default ProductCard;
