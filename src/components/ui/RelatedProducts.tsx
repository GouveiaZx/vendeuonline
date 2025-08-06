'use client';

import { useState } from 'react';
import ProductCard from '@/components/ui/ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/types';

interface RelatedProductsProps {
  products: Product[];
  title?: string;
  className?: string;
}

export function RelatedProducts({ 
  products, 
  title = "Produtos Relacionados", 
  className = "" 
}: RelatedProductsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Número de produtos visíveis por vez baseado no tamanho da tela
  const getVisibleCount = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1280) return 4; // xl
      if (window.innerWidth >= 1024) return 3; // lg
      if (window.innerWidth >= 640) return 2;  // sm
      return 1; // mobile
    }
    return 4; // default
  };

  const [visibleCount, setVisibleCount] = useState(getVisibleCount());

  // Atualizar contagem visível quando a tela redimensionar
  useState(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setVisibleCount(getVisibleCount());
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  });

  const maxIndex = Math.max(0, products.length - visibleCount);
  const canGoNext = currentIndex < maxIndex;
  const canGoPrev = currentIndex > 0;

  const nextSlide = () => {
    if (canGoNext) {
      setIsLoading(true);
      setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  const prevSlide = () => {
    if (canGoPrev) {
      setIsLoading(true);
      setCurrentIndex(prev => Math.max(prev - 1, 0));
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  const goToSlide = (index: number) => {
    if (index !== currentIndex && index >= 0 && index <= maxIndex) {
      setIsLoading(true);
      setCurrentIndex(index);
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  if (!products || products.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-500">Nenhum produto relacionado encontrado.</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        
        {/* Navigation Buttons */}
        {products.length > visibleCount && (
          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              disabled={!canGoPrev || isLoading}
              className={`p-2 rounded-full border transition-all ${
                canGoPrev && !isLoading
                  ? 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-600'
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <button
              onClick={nextSlide}
              disabled={!canGoNext || isLoading}
              className={`p-2 rounded-full border transition-all ${
                canGoNext && !isLoading
                  ? 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-600'
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Products Container */}
      <div className="relative overflow-hidden">
        <div 
          className={`flex transition-transform duration-300 ease-in-out ${
            isLoading ? 'opacity-75' : 'opacity-100'
          }`}
          style={{ 
            transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
            width: `${(products.length / visibleCount) * 100}%`
          }}
        >
          {products.map((product, index) => (
            <div 
              key={product.id} 
              className="px-3 first:pl-0 last:pr-0"
              style={{ width: `${100 / products.length}%` }}
            >
              <ProductCard 
                product={product}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Dots Indicator */}
      {products.length > visibleCount && maxIndex > 0 && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-blue-600 w-6' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      {/* Product Counter */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-500">
          Mostrando {Math.min(currentIndex + visibleCount, products.length)} de {products.length} produtos
        </p>
      </div>
      
      {/* View All Button */}
      {products.length > visibleCount && (
        <div className="text-center mt-6">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors">
            Ver Todos os Produtos Relacionados
          </button>
        </div>
      )}
    </div>
  );
}