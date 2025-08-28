'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Star, MapPin, Package, ChevronLeft, ChevronRight } from 'lucide-react';

interface Store {
  id: string;
  name: string;
  logo?: string;
  products: number;
  rating: number;
  averageRating?: number;
  totalReviews?: number;
  city: string;
  description?: string;
  category?: string;
  isVerified?: boolean;
}

interface FeaturedStoresProps {
  stores: Store[];
  className?: string;
}

const FeaturedStores = React.memo<FeaturedStoresProps>(({ stores, className = "" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, boolean>>({});

  // Memoized formatting function
  const formatRating = useCallback((rating: number | undefined | null) => {
    const numRating = rating != null && !isNaN(Number(rating)) ? Number(rating) : 0;
    return numRating.toFixed(1);
  }, []);

  const handleImageLoad = useCallback((storeId: string) => {
    setImageLoadStates(prev => ({ ...prev, [storeId]: true }));
  }, []);

  // Memoized navigation functions
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, stores.length - 1));
  }, [stores.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, stores.length - 1)) % Math.max(1, stores.length - 1));
  }, [stores.length]);

  // Memoized star rendering function
  const renderStars = useCallback((store: Store) => {
    const displayRating = Number(store.averageRating ?? store.rating ?? 0) || 0;
    const displayReviews = Number(store.totalReviews ?? 0) || 0;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < Math.floor(displayRating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-xs text-gray-600">
          {formatRating(displayRating)}
          {displayReviews > 0 && (
            <span className="text-gray-400"> ({displayReviews})</span>
          )}
        </span>
      </div>
    );
  }, [formatRating]);

  if (!stores || stores.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-500">Nenhuma loja encontrada.</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Navigation Buttons */}
      {stores.length > 2 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-xl rounded-full p-3 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 transform hover:scale-110"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-xl rounded-full p-3 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 transform hover:scale-110"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </>
      )}

      {/* Stores Grid */}
      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {stores.map((store) => (
            <div key={store.id} className="w-full md:w-1/2 flex-shrink-0 px-3">
              <Link href={`/loja/${store.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                  <div className="p-8">
                    <div className="flex items-start space-x-4">
                      {/* Store Logo */}
                      <div className="relative w-20 h-20 flex-shrink-0">
                        {!imageLoadStates[store.id] && (
                          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-xl flex items-center justify-center">
                            <div className="w-10 h-10 bg-gray-300 rounded"></div>
                          </div>
                        )}
                        <img
                          src={store.logo || '/placeholder-store.png'}
                          alt={`Logo da ${store.name}`}
                          className={`w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-md ${
                            imageLoadStates[store.id] ? 'opacity-100' : 'opacity-0'
                          }`}
                          onLoad={() => handleImageLoad(store.id)}
                        />
                        {store.isVerified && (
                          <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1.5 shadow-lg">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Store Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                              {store.name}
                            </h3>
                            {store.category && (
                              <p className="text-sm text-gray-500 mt-1 font-medium">{store.category}</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Rating */}
                        <div className="mt-3">
                          {renderStars(store)}
                        </div>
                        
                        {/* Stats */}
                        <div className="flex items-center justify-between mt-5 text-sm text-gray-600">
                          <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
                            <Package className="h-4 w-4 mr-2 text-blue-600" />
                            <span className="font-medium">{store.products} produtos</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span className="text-sm font-medium">{store.city}</span>
                          </div>
                        </div>
                        
                        {/* Description */}
                        {store.description && (
                          <p className="text-sm text-gray-600 mt-4 line-clamp-2 leading-relaxed">
                            {store.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Visit Store Button */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 font-medium">Visite a loja</span>
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 text-blue-600 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm group-hover:shadow-md transform group-hover:scale-105">
                          Ver produtos
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
      
      {/* Dots Indicator */}
      {stores.length > 2 && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: Math.max(1, stores.length - 1) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// Display name for debugging
FeaturedStores.displayName = 'FeaturedStores';

export { FeaturedStores };
