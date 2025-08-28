'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useBannerStore } from '@/store/bannerStore';
import { Banner } from '@/types';

interface BannerDisplayProps {
  position: 'HEADER' | 'SIDEBAR' | 'FOOTER' | 'CATEGORY';
  className?: string;
  maxBanners?: number;
}

export default function BannerDisplay({ 
  position, 
  className = '', 
  maxBanners = 3 
}: BannerDisplayProps) {
  const { banners, fetchBanners, incrementClicks, incrementImpressions } = useBannerStore();
  const [displayedBanners, setDisplayedBanners] = useState<Banner[]>([]);
  const [impressionsRegistered, setImpressionsRegistered] = useState<Set<string>>(new Set());
  const [isClient, setIsClient] = useState(false);

  // Garantir hidratação segura
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Mapeamento de posições string para number
    const positionMap = {
      'HEADER': 1,
      'SIDEBAR': 2,
      'FOOTER': 3,
      'CATEGORY': 4
    };
    
    // Buscar banners ativos para a posição específica
    fetchBanners({ position: positionMap[position], isActive: true });
  }, [position, fetchBanners]);

  useEffect(() => {
    // Aguardar hidratação antes de filtrar por data
    if (!isClient) return;
    
    // Filtrar banners ativos e dentro do período válido
    const now = new Date();
    const validBanners = banners
      .filter(banner => {
        if (!banner.isActive) return false;
        
        // Se não há datas definidas, considerar válido
        if (!banner.startDate || !banner.endDate) return true;
        
        const startDate = new Date(banner.startDate);
        const endDate = new Date(banner.endDate);
        
        return now >= startDate && now <= endDate;
      })
      .slice(0, maxBanners);
    
    setDisplayedBanners(validBanners);
    
    // Registrar impressões para novos banners
    validBanners.forEach(banner => {
      if (!impressionsRegistered.has(banner.id)) {
        incrementImpressions(banner.id);
        setImpressionsRegistered(prev => new Set([...prev, banner.id]));
      }
    });
  }, [banners, maxBanners, incrementImpressions, impressionsRegistered, isClient]);

  const handleBannerClick = (banner: Banner) => {
    // Registrar clique
    incrementClicks(banner.id);
    
    // Navegar para o link do banner (protegido para SSR)
    if (banner.link && typeof window !== 'undefined') {
      if (banner.link.startsWith('http')) {
        window.open(banner.link, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = banner.link;
      }
    }
  };

  if (displayedBanners.length === 0) {
    return null;
  }

  const getContainerClass = () => {
    switch (position) {
      case 'HEADER':
        return 'w-full';
      case 'SIDEBAR':
        return 'w-full max-w-xs';
      case 'FOOTER':
        return 'w-full';
      case 'CATEGORY':
        return 'w-full';
      default:
        return 'w-full';
    }
  };

  const getBannerClass = () => {
    switch (position) {
      case 'HEADER':
        return 'aspect-[4/1] md:aspect-[6/1]';
      case 'SIDEBAR':
        return 'aspect-[3/4]';
      case 'FOOTER':
        return 'aspect-[4/1]';
      case 'CATEGORY':
        return 'aspect-[3/1] md:aspect-[4/1]';
      default:
        return 'aspect-video';
    }
  };

  return (
    <div className={`${getContainerClass()} ${className}`} suppressHydrationWarning>
      {position === 'HEADER' || position === 'FOOTER' ? (
        // Layout horizontal para header e footer
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedBanners.map((banner) => (
            <div
              key={banner.id}
              className={`${getBannerClass()} relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-300`}
              onClick={() => handleBannerClick(banner)}
            >
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              
              {/* Overlay com informações */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-semibold text-sm md:text-base mb-1">{banner.title}</h3>
                  {banner.description && (
                    <p className="text-xs md:text-sm opacity-90 line-clamp-2">{banner.description}</p>
                  )}
                  <div className="flex items-center mt-2 text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    <span>Clique para saber mais</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Layout vertical para sidebar
        <div className="space-y-4">
          {displayedBanners.map((banner) => (
            <div
              key={banner.id}
              className={`${getBannerClass()} relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-300`}
              onClick={() => handleBannerClick(banner)}
            >
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              
              {/* Overlay com informações */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <h3 className="font-semibold text-sm mb-1">{banner.title}</h3>
                  {banner.description && (
                    <p className="text-xs opacity-90 line-clamp-2">{banner.description}</p>
                  )}
                  <div className="flex items-center mt-2 text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    <span>Ver mais</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}