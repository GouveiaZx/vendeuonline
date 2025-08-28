import React, { useState, useRef, useEffect } from 'react';
import { ImageOff } from 'lucide-react';

// Hook para observar interseção
const useIntersectionObserver = (ref: React.RefObject<HTMLElement>) => {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref]);

  return isInView;
};

// Função para otimizar URL da imagem
const getOptimizedUrl = (
  src: string,
  quality: number = 80,
  format?: 'webp' | 'jpeg' | 'png'
): string => {
  if (src.startsWith('http') || src.startsWith('/')) {
    return src;
  }
  
  const params = new URLSearchParams();
  params.set('q', quality.toString());
  if (format) {
    params.set('f', format);
  }
  
  return `${src}?${params.toString()}`;
};

// Função para gerar srcSet
const generateSrcSet = (src: string, quality: number = 80): string => {
  const sizes = [480, 768, 1024, 1280];
  return sizes
    .map(size => `${getOptimizedUrl(src, quality)} ${size}w`)
    .join(', ');
};

// Interface para o componente OptimizedImage
interface OptimizedImageProps {
  src?: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  placeholder?: string;
  fallback?: React.ReactNode | string;
  lazy?: boolean;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  quality = 80,
  format,
  placeholder,
  fallback,
  lazy = true,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  onLoad,
  onError,
  onClick,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const isInView = useIntersectionObserver(imgRef);

  // Função para renderizar fallback
  function renderFallback() {
    if (fallback) {
      return (
        <img
          src={fallback as string}
          alt={alt}
          className={className}
          style={{ width, height }}
        />
      );
    }

    return (
      <div
        className={`${className} bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300`}
        style={{ width, height }}
      >
        <div className="text-center text-gray-500">
          <ImageOff className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Imagem não encontrada</p>
        </div>
      </div>
    );
  }

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Validação inicial para src
  if (!src) {
    return renderFallback();
  }

  const optimizedSrc = getOptimizedUrl(src, quality, format);
  const srcSet = generateSrcSet(src, quality);

  // Placeholder enquanto carrega
  const renderPlaceholder = () => {
    if (placeholder) {
      return (
        <img
          src={placeholder}
          alt=""
          className={`${className} filter blur-sm transition-opacity duration-300 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
          style={{ width, height }}
        />
      );
    }

    return (
      <div
        className={`${className} bg-gray-200 animate-pulse flex items-center justify-center transition-opacity duration-300 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
        style={{ width, height }}
      >
        <ImageOff className="w-8 h-8 text-gray-400" />
      </div>
    );
  };

  if (hasError) {
    return renderFallback();
  }

  return (
    <div className="relative" ref={imgRef}>
      {/* Placeholder */}
      {!isLoaded && renderPlaceholder()}

      {/* Imagem principal */}
      {isInView && (
        <img
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ width, height }}
          loading={lazy && !priority ? 'lazy' : 'eager'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          onClick={onClick}
        />
      )}
    </div>
  );
};

export default OptimizedImage;

// Componente específico para avatares
interface AvatarImageProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallbackText?: string;
  className?: string;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  alt,
  size = 'md',
  fallbackText,
  className = '',
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl',
  };

  const fallback = (
    <div className={`${sizeClasses[size]} ${className} bg-gray-300 rounded-full flex items-center justify-center`}>
      <span className={`${textSizes[size]} font-medium text-gray-600`}>
        {fallbackText || alt.charAt(0).toUpperCase()}
      </span>
    </div>
  );

  if (!src) {
    return fallback;
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} ${className} rounded-full object-cover`}
      fallback={fallback.props.children}
      priority
    />
  );
};

// Componente para imagens de produtos
interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | '4/3' | '16/9' | '3/4';
  showZoom?: boolean;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = 'square',
  showZoom = false,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);

  const aspectClasses = {
    square: 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-video',
    '3/4': 'aspect-[3/4]',
  };

  const handleZoom = () => {
    if (showZoom) {
      setIsZoomed(!isZoomed);
    }
  };

  return (
    <div className={`${aspectClasses[aspectRatio]} ${className} relative overflow-hidden`}>
      <OptimizedImage
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-transform duration-300 ${
          showZoom ? 'cursor-zoom-in hover:scale-105' : ''
        } ${isZoomed ? 'scale-150' : ''}`}
        onClick={handleZoom}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      
      {showZoom && isZoomed && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-zoom-out"
          onClick={() => setIsZoomed(false)}
        >
          <span className="text-white text-sm">Clique para fechar</span>
        </div>
      )}
    </div>
  );
};

// Hook para otimização de imagens
export const useImageOptimization = () => {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Verifica se o navegador suporta WebP
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const dataURL = canvas.toDataURL('image/webp');
      setIsSupported(dataURL.indexOf('data:image/webp') === 0);
    }
  }, []);

  return {
    isWebPSupported: isSupported,
    getOptimalFormat: () => isSupported ? 'webp' : 'jpeg',
  };
};