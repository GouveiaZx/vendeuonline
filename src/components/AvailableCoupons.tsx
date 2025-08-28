import React, { useState } from 'react';
import { Tag, Percent, DollarSign, Clock, Gift, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { AvailableCoupon } from '@/types';

interface AvailableCouponsProps {
  coupons: AvailableCoupon[];
  onApplyCoupon: (code: string) => Promise<boolean>;
  isLoading?: boolean;
  className?: string;
}

export default function AvailableCoupons({
  coupons,
  onApplyCoupon,
  isLoading = false,
  className = ''
}: AvailableCouponsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState<string | null>(null);

  const handleApplyCoupon = async (code: string) => {
    setApplyingCoupon(code);
    try {
      await onApplyCoupon(code);
    } finally {
      setApplyingCoupon(null);
    }
  };

  const formatDiscount = (coupon: AvailableCoupon) => {
    if (coupon.discountType === 'percentage') {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <Percent className="w-4 h-4" />
          <span className="font-semibold">{coupon.discountValue}% OFF</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <DollarSign className="w-4 h-4" />
          <span className="font-semibold">R$ {coupon.discountValue.toFixed(2)} OFF</span>
        </div>
      );
    }
  };

  const formatEstimatedSavings = (savings: number) => {
    return `Economia: R$ ${savings.toFixed(2)}`;
  };

  if (coupons.length === 0) {
    return (
      <div className={`text-center py-6 text-gray-500 ${className}`}>
        <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Nenhum cupom disponível no momento</p>
      </div>
    );
  }

  // Separar cupons automáticos dos manuais
  const autoCoupons = coupons.filter(c => c.isAutoApply);
  const manualCoupons = coupons.filter(c => !c.isAutoApply);
  
  // Mostrar apenas os 3 melhores cupons inicialmente
  const visibleCoupons = isExpanded ? coupons : coupons.slice(0, 3);
  const hasMoreCoupons = coupons.length > 3;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Cupons automáticos em destaque */}
      {autoCoupons.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
            <Zap className="w-4 h-4" />
            <span>Cupons Automáticos Disponíveis</span>
          </div>
          
          {autoCoupons.slice(0, 2).map((coupon) => (
            <div
              key={coupon.id}
              className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-blue-800">{coupon.name}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      AUTO
                    </span>
                  </div>
                  
                  <p className="text-sm text-blue-700 mb-2">
                    {coupon.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    {formatDiscount(coupon)}
                    {coupon.estimatedSavings && (
                      <span className="text-xs text-blue-600">
                        {formatEstimatedSavings(coupon.estimatedSavings)}
                      </span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleApplyCoupon(coupon.code)}
                  disabled={isLoading || applyingCoupon === coupon.code}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {applyingCoupon === coupon.code ? 'Aplicando...' : 'Aplicar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cupons manuais */}
      {manualCoupons.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Tag className="w-4 h-4" />
            <span>Cupons Disponíveis</span>
          </div>
          
          {visibleCoupons.filter(c => !c.isAutoApply).map((coupon) => (
            <div
              key={coupon.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{coupon.name}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
                      {coupon.code}
                    </span>
                  </div>
                  
                  {coupon.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {coupon.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    {formatDiscount(coupon)}
                    {coupon.estimatedSavings && (
                      <span className="text-xs text-gray-500">
                        {formatEstimatedSavings(coupon.estimatedSavings)}
                      </span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleApplyCoupon(coupon.code)}
                  disabled={isLoading || applyingCoupon === coupon.code}
                  className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {applyingCoupon === coupon.code ? 'Aplicando...' : 'Aplicar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botão para expandir/recolher */}
      {hasMoreCoupons && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 transition-colors"
        >
          {isExpanded ? (
            <>
              <span>Ver menos cupons</span>
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Ver mais cupons ({coupons.length - 3})</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}

      {/* Dica sobre cupons */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Dica:</p>
            <p>
              Os cupons são aplicados automaticamente quando aplicáveis. 
              Você também pode inserir um código de cupom manualmente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}