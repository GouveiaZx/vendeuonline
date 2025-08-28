import React, { useState, useEffect } from 'react';
import { Tag, X, Percent, DollarSign, Gift, AlertCircle, CheckCircle } from 'lucide-react';
import { usePaymentCoupons } from '@/hooks/usePaymentCoupons';
import CouponInput from '@/components/CouponInput';
import AvailableCoupons from '@/components/AvailableCoupons';

interface PaymentSummaryProps {
  cartTotal: number;
  cartItems: Array<{
    productId: string;
    quantity: number;
    price: number;
    category?: string;
    storeId?: string;
    name: string;
  }>;
  storeId?: string;
  userId?: string;
  orderId?: string;
  onTotalChange?: (newTotal: number, discount: number) => void;
  showCouponInput?: boolean;
  showAvailableCoupons?: boolean;
  className?: string;
}

export function PaymentSummary({
  cartTotal,
  cartItems,
  storeId,
  userId,
  orderId,
  onTotalChange,
  showCouponInput = true,
  showAvailableCoupons = true,
  className = ''
}: PaymentSummaryProps) {
  const [showCoupons, setShowCoupons] = useState(false);
  const [autoApplyAttempted, setAutoApplyAttempted] = useState(false);

  const {
    appliedCoupon,
    isApplying,
    error,
    originalTotal,
    discountAmount,
    finalTotal,
    savings,
    applyPaymentCoupon,
    removePaymentCoupon,
    applyBestCoupon,
    validateAppliedCoupon,
    clearError,
    getPaymentSummary
  } = usePaymentCoupons({
    cartTotal,
    cartItems,
    storeId,
    userId
  });

  // Notificar mudanças no total
  useEffect(() => {
    onTotalChange?.(finalTotal, discountAmount);
  }, [finalTotal, discountAmount, onTotalChange]);

  // Tentar aplicar melhor cupom automaticamente na primeira carga
  useEffect(() => {
    if (userId && !autoApplyAttempted && !appliedCoupon && cartTotal > 0) {
      setAutoApplyAttempted(true);
      applyBestCoupon(orderId).catch(console.error);
    }
  }, [userId, autoApplyAttempted, appliedCoupon, cartTotal, applyBestCoupon, orderId]);

  // Validar cupom aplicado quando o carrinho mudar
  useEffect(() => {
    if (appliedCoupon) {
      validateAppliedCoupon();
    }
  }, [cartTotal, cartItems, validateAppliedCoupon, appliedCoupon]);

  const handleApplyCoupon = async (code: string) => {
    const success = await applyPaymentCoupon(code, orderId);
    if (success) {
      setShowCoupons(false);
    }
    return success;
  };

  const handleRemoveCoupon = async () => {
    await removePaymentCoupon();
  };

  const summary = getPaymentSummary();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Resumo do Pedido
        </h3>
        {showAvailableCoupons && (
          <button
            onClick={() => setShowCoupons(!showCoupons)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Gift className="w-4 h-4" />
            {showCoupons ? 'Ocultar cupons' : 'Ver cupons'}
          </button>
        )}
      </div>

      {/* Itens do carrinho */}
      <div className="space-y-3 mb-4">
        {cartItems.map((item, index) => (
          <div key={`${item.productId}-${index}`} className="flex justify-between text-sm">
            <span className="text-gray-600">
              {item.name} × {item.quantity}
            </span>
            <span className="font-medium">
              R$ {(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4">
        {/* Subtotal */}
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">R$ {originalTotal.toFixed(2)}</span>
        </div>

        {/* Cupom aplicado */}
        {appliedCoupon && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Cupom aplicado
                </span>
              </div>
              <button
                onClick={handleRemoveCoupon}
                disabled={isApplying}
                className="text-green-600 hover:text-green-700 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Tag className="w-3 h-3 text-green-600" />
                <span className="font-mono text-green-800">
                  {(appliedCoupon as any)?.couponCode || ''}
                </span>
                <span className="text-green-600">
                  ({(appliedCoupon as any)?.couponName || ''})
                </span>
              </div>
              
              <div className="flex items-center gap-1 text-green-700">
                {(appliedCoupon as any)?.discountType === 'percentage' ? (
                  <Percent className="w-3 h-3" />
                ) : (
                  <DollarSign className="w-3 h-3" />
                )}
                <span className="font-medium">
                  -{(appliedCoupon as any)?.discountType === 'percentage' 
                    ? `${(appliedCoupon as any)?.discountValue || 0}%` 
                    : `R$ ${((appliedCoupon as any)?.discountValue || 0).toFixed(2)}`
                  }
                </span>
              </div>
            </div>
            
            <div className="flex justify-between text-sm mt-1">
              <span className="text-green-600">Desconto</span>
              <span className="font-medium text-green-700">
                -R$ {discountAmount.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
              <button
                onClick={clearError}
                className="ml-auto text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input de cupom */}
        {showCouponInput && !appliedCoupon && (
          <div className="mb-4">
            <CouponInput
              context={{
                userId,
                storeId,
                cartTotal,
                items: cartItems
              }}
              appliedCoupon={appliedCoupon ? {
                id: (appliedCoupon as any).couponId || '',
                code: (appliedCoupon as any).couponCode || '',
                name: (appliedCoupon as any).couponName || '',
                discountType: (appliedCoupon as any).discountType || 'percentage',
                discountValue: (appliedCoupon as any).discountValue || 0,
                discountAmount: (appliedCoupon as any).discountAmount || 0,
                savings: (appliedCoupon as any).savings || 0
              } : undefined}
              onCouponApplied={(application) => {
                handleApplyCoupon(application.couponCode);
              }}
              onCouponRemoved={handleRemoveCoupon}
              className="mb-4"
            />
          </div>
        )}

        {/* Cupons disponíveis */}
        {showCoupons && showAvailableCoupons && (
          <div className="mb-4">
            <AvailableCoupons
              coupons={[]}
              onApplyCoupon={handleApplyCoupon}
              className="border-t border-gray-200 pt-4"
            />
          </div>
        )}

        {/* Total final */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <div className="text-right">
              {savings > 0 && (
                <div className="text-sm text-green-600 mb-1">
                  Economia: R$ {savings.toFixed(2)}
                </div>
              )}
              <span className="text-xl font-bold text-gray-900">
                R$ {finalTotal.toFixed(2)}
              </span>
            </div>
          </div>
          
          {savings > 0 && (
            <div className="text-xs text-gray-500 text-right mt-1">
              De R$ {originalTotal.toFixed(2)}
            </div>
          )}
        </div>

        {/* Indicador de carregamento */}
        {isApplying && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Processando cupom...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentSummary;