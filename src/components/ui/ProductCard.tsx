'use client';

import { Star, Heart, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import OptimizedImage from './OptimizedImage';

interface Product {
  id: string | number;
  name: string;
  image?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  reviews?: number;
  seller?: string;
  store?: string;
  category?: string;
  inStock?: boolean;
}

interface ProductCardProps {
  product: Product;
  className?: string;
  showActions?: boolean;
  viewMode?: 'grid' | 'list';
  onAddToWishlist?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
}

export default function ProductCard({
  product,
  className = '',
  showActions = true,
  viewMode = 'grid',
  onAddToWishlist,
  onAddToCart,
  onToggleWishlist
}: ProductCardProps) {
  const {
    id,
    name,
    image,
    price,
    originalPrice,
    discount,
    rating = 0,
    reviews = 0,
    seller,
    store,
    category,
    inStock = true
  } = product;
  const handleAddToWishlist = () => {
    if (onAddToWishlist) {
      onAddToWishlist(product);
    } else if (onToggleWishlist) {
      onToggleWishlist(product);
    } else {
      toast.success('Produto adicionado à lista de desejos');
    }
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      toast.success('Produto adicionado ao carrinho');
    }
  };

  const getPlaceholderImage = () => {
    const categoryPrompt = category ? category.toLowerCase() : 'product';
    return `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(categoryPrompt + ' product placeholder')}&image_size=square`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}>
      <Link to={`/products/${id}`} className="block">
        <div className="relative">
          <OptimizedImage
            src={image || getPlaceholderImage()}
            alt={name}
            className="w-full h-48 object-cover"
            fallback={getPlaceholderImage()}
          />
          
          {discount && discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
              -{discount}%
            </div>
          )}
          
          {!inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-medium">Fora de Estoque</span>
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link to={`/products/${id}`} className="block">
          <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 hover:text-blue-600 transition-colors">
            {name}
          </h3>
        </Link>
        
        {(seller || store) && (
          <p className="text-sm text-gray-500 mb-2">
            {seller || store}
          </p>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-green-600">
                R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-sm text-gray-500 line-through">
                  R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>
          
          {rating > 0 && (
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">
                {rating.toFixed(1)}
                {reviews > 0 && (
                  <span className="text-gray-400"> ({reviews})</span>
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
              disabled={!inStock}
            >
              <Heart className="h-4 w-4 mr-1" />
              <span className="text-sm">Favoritar</span>
            </button>
            
            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!inStock}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              <span className="text-sm">Carrinho</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}