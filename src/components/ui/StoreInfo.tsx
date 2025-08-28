'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, MapPin, Clock, MessageCircle, Shield, Package, Users } from 'lucide-react';

interface Store {
  id: string;
  name: string;
  logo: string;
  rating: number;
  reviews: number;
  location: string;
  verified: boolean;
  memberSince: string;
  responseTime: string;
  products: number;
}

interface StoreInfoProps {
  store: Store;
  className?: string;
}

export function StoreInfo({ store, className = "" }: StoreInfoProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {formatRating(rating)} ({store.reviews} avaliaÃ§Ãµes)
        </span>
      </div>
    );
  };

  const handleContactStore = () => {
    const message = `OlÃ¡! Gostaria de saber mais sobre os produtos da loja ${store.name}.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">InformaÃ§Ãµes da Loja</h2>
          <Link
            href={`/loja/${store.name.toLowerCase().replace(/\s+/g, '-')}`}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Ver loja completa
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Store Basic Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {/* Store Logo */}
              <div className="relative w-16 h-16 flex-shrink-0">
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  </div>
                )}
                <img
                  src={store.logo}
                  alt={`Logo da ${store.name}`}
                  className={`w-full h-full object-cover rounded-lg transition-opacity ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                />
                {store.verified && (
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1">
                    <Shield className="w-3 h-3" />
                  </div>
                )}
              </div>
              
              {/* Store Details */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">{store.name}</h3>
                  {store.verified && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                      Verificada
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                  <MapPin className="h-3 w-3" />
                  <span>{store.location}</span>
                </div>
                
                {renderStars(store.rating)}
              </div>
            </div>
            
            {/* Store Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Produtos</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{store.products.toLocaleString()}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Desde</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{store.memberSince}</p>
              </div>
            </div>
          </div>
          
          {/* Store Performance */}
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">Tempo de Resposta</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mb-1">{store.responseTime}</p>
              <p className="text-sm text-green-700">Responde rapidamente Ã s mensagens</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Qualidade dos produtos</span>
                <div className="flex items-center gap-1">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <span className="font-medium text-gray-900">92%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Pontualidade na entrega</span>
                <div className="flex items-center gap-1">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                  <span className="font-medium text-gray-900">88%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Atendimento ao cliente</span>
                <div className="flex items-center gap-1">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                  <span className="font-medium text-gray-900">95%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
          <Link
            href={`/loja/${store.name.toLowerCase().replace(/\s+/g, '-')}`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-center"
          >
            Visitar Loja
          </Link>
          <button
            onClick={handleContactStore}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Contatar
          </button>
        </div>
        
        {/* Trust Indicators */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Garantias da Loja</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Loja verificada</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Package className="h-4 w-4 text-blue-600" />
              <span>Produtos originais</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-purple-600" />
              <span>Entrega rÃ¡pida</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
