'use client';

import { useState } from 'react';
import { Star, MessageCircle, Share2, Minus, Plus, ShoppingCart, Heart, Shield, Truck } from 'lucide-react';
import { formatters } from '@/utils/formatters';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviews: number;
  stock: number;
  brand: string;
  model: string;
  condition: string;
  warranty: string;
  shipping: {
    free: boolean;
    estimatedDays: string;
    regions: string[];
  };
}

interface ProductInfoProps {
  product: Product;
  className?: string;
}

export function ProductInfo({ product, className = "" }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);



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
          {rating.toFixed(1)} ({product.reviews} avaliações)
        </span>
      </div>
    );
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Confira este produto: ${product.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
      }
    } else {
      // Fallback para copiar URL
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  const handleWhatsApp = () => {
    const message = `Olá! Tenho interesse no produto: ${product.name} - ${formatters.formatPrice(product.price)}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Product Title and Brand */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <span className="font-medium">{product.brand}</span>
          <span>•</span>
          <span>Modelo: {product.model}</span>
          <span>•</span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
            {product.condition}
          </span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
          {product.name}
        </h1>
      </div>

      {/* Rating and Reviews */}
      <div className="flex items-center justify-between">
        {renderStars(product.rating)}
        <button
          onClick={() => setIsFavorited(!isFavorited)}
          className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors"
        >
          <Heart
            className={`h-5 w-5 ${
              isFavorited ? 'text-red-500 fill-current' : ''
            }`}
          />
          <span className="text-sm">Favoritar</span>
        </button>
      </div>

      {/* Price */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl font-bold text-gray-900">
            {formatters.formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <>
              <span className="text-lg text-gray-500 line-through">
                {formatters.formatPrice(product.originalPrice)}
              </span>
              {product.discount && (
                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm font-medium">
                  -{product.discount}%
                </span>
              )}
            </>
          )}
        </div>
        <p className="text-sm text-gray-600">
          Em até 12x de {formatters.formatPrice(product.price / 12)} sem juros
        </p>
      </div>

      {/* Stock and Quantity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Estoque: <span className="font-medium text-gray-900">{product.stock} unidades</span>
          </span>
          {product.stock <= 5 && (
            <span className="text-sm text-orange-600 font-medium">
              Últimas unidades!
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Quantidade:</span>
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-4 py-2 font-medium">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= product.stock}
              className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Adicionar ao Carrinho
        </button>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleWhatsApp}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </button>
          <button 
            onClick={handleShare}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Compartilhar
          </button>
        </div>
      </div>

      {/* Product Features */}
      <div className="border-t pt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Informações do Produto</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="text-gray-600">Garantia:</span>
            <span className="font-medium text-gray-900">{product.warranty}</span>
          </div>
          
          {product.shipping.free && (
            <div className="flex items-center gap-3 text-sm">
              <Truck className="h-4 w-4 text-green-600" />
              <span className="text-gray-600">Frete grátis</span>
              <span className="font-medium text-gray-900">
                • Entrega em {product.shipping.estimatedDays}
              </span>
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            <span className="font-medium">Regiões atendidas:</span>
            <div className="mt-1">
              {product.shipping.regions.map((region, index) => (
                <span key={region} className="inline-block">
                  {region}
                  {index < product.shipping.regions.length - 1 && ', '}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Security Badges */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-800 mb-2">
          <Shield className="h-4 w-4" />
          <span className="font-medium text-sm">Compra Segura</span>
        </div>
        <ul className="text-xs text-green-700 space-y-1">
          <li>• Dados protegidos com criptografia SSL</li>
          <li>• Garantia de entrega ou seu dinheiro de volta</li>
          <li>• Suporte ao cliente 24/7</li>
        </ul>
      </div>
    </div>
  );
}