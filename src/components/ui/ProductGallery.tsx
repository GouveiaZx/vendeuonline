'use client';

import { useState } from 'react';

import { ChevronLeft, ChevronRight, Expand, Heart } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  className?: string;
}

export function ProductGallery({ images, productName, className = "" }: ProductGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageLoadStates, setImageLoadStates] = useState<Record<number, boolean>>({});

  const handleImageLoad = (index: number) => {
    setImageLoadStates(prev => ({ ...prev, [index]: true }));
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const selectImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  if (!images || images.length === 0) {
    return (
      <div className={`aspect-square bg-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-gray-400 text-center">
          <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2"></div>
          <p>Imagem não disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Image */}
      <div className="relative aspect-square bg-white rounded-lg overflow-hidden shadow-sm border group">
        {!imageLoadStates[currentImageIndex] && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
          </div>
        )}
        
        <img
          src={images[currentImageIndex]}
          alt={`${productName} - Imagem ${currentImageIndex + 1}`}
          className={`w-full h-full object-cover transition-all duration-300 ${
            isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
          } ${imageLoadStates[currentImageIndex] ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsZoomed(!isZoomed)}
          onLoad={() => handleImageLoad(currentImageIndex)}
        />
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
          </>
        )}
        
        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => setIsFavorited(!isFavorited)}
            className="bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
          >
            <Heart
              className={`h-5 w-5 ${
                isFavorited
                  ? 'text-red-500 fill-current'
                  : 'text-gray-700 hover:text-red-500'
              }`}
            />
          </button>
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
          >
            <Expand className="h-5 w-5 text-gray-700" />
          </button>
        </div>
        
        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}
      </div>
      
      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => selectImage(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentImageIndex
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {!imageLoadStates[index] && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
              )}
              <img
                src={image}
                alt={`${productName} - Miniatura ${index + 1}`}
                className={`w-full h-full object-cover transition-opacity ${
                  imageLoadStates[index] ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => handleImageLoad(index)}
              />
              {index === currentImageIndex && (
                <div className="absolute inset-0 bg-blue-500/20"></div>
              )}
            </button>
          ))}
        </div>
      )}
      
      {/* Zoom Instructions */}
      <div className="text-center text-sm text-gray-500">
        <p>Clique na imagem para ampliar</p>
      </div>
    </div>
  );
}