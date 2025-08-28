import { useState, useCallback, useEffect } from 'react';
import {
  CouponValidation,
  CouponApplication,
  CouponContext,
  AppliedCoupon,
  AvailableCoupon,
  AutoCoupon
} from '@/types';

interface UseCouponsOptions {
  context: CouponContext;
  autoApply?: boolean;
  onCouponApplied?: (application: CouponApplication) => void;
  onCouponRemoved?: () => void;
}

interface UseCouponsReturn {
  appliedCoupon: AppliedCoupon | null;
  availableCoupons: AvailableCoupon[];
  isLoading: boolean;
  error: string | null;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  validateCoupon: (code: string) => Promise<CouponValidation>;
  refreshAvailableCoupons: () => Promise<void>;
  getAutoCoupons: () => Promise<AutoCoupon[]>;
  applyBestCoupon: () => Promise<boolean>;
}

export function useCoupons({
  context,
  autoApply = false,
  onCouponApplied,
  onCouponRemoved
}: UseCouponsOptions): UseCouponsReturn {
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar cupons disponíveis quando o contexto muda
  useEffect(() => {
    if (context.cartTotal > 0) {
      refreshAvailableCoupons();
      
      if (autoApply) {
        applyBestCoupon();
      }
    }
  }, [context.cartTotal, context.items.length, autoApply]);

  const validateCoupon = useCallback(async (code: string): Promise<CouponValidation> => {
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.toUpperCase(),
          context
        })
      });

      const data = await response.json();
      
      if (data.success && data.validation) {
        return data.validation;
      } else {
        return {
          isValid: false,
          message: data.error || 'Cupom inválido'
        };
      }
    } catch (err) {
      console.error('Erro ao validar cupom:', err);
      return {
        isValid: false,
        message: 'Erro ao validar cupom'
      };
    }
  }, [context]);

  const applyCoupon = useCallback(async (code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.toUpperCase(),
          context
        })
      });

      const data = await response.json();

      if (data.success && data.application) {
        const appliedCouponData: AppliedCoupon = {
          id: data.application.couponId,
          code: data.application.couponCode,
          name: data.application.couponName,
          discountType: data.application.discountType,
          discountValue: data.application.discountValue,
          discountAmount: data.application.discountAmount,
          savings: data.application.savings,
          usageId: data.usageId
        };

        setAppliedCoupon(appliedCouponData);
        onCouponApplied?.(data.application);
        
        // Atualizar lista de cupons disponíveis
        await refreshAvailableCoupons();
        
        return true;
      } else {
        setError(data.error || 'Erro ao aplicar cupom');
        return false;
      }
    } catch (err) {
      console.error('Erro ao aplicar cupom:', err);
      setError('Erro ao aplicar cupom');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [context, onCouponApplied]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setError(null);
    onCouponRemoved?.();
    
    // Atualizar lista de cupons disponíveis
    refreshAvailableCoupons();
  }, [onCouponRemoved]);

  const refreshAvailableCoupons = useCallback(async () => {
    try {
      // Buscar cupons automáticos aplicáveis
      const autoCoupons = await getAutoCoupons();
      
      // Buscar cupons gerais disponíveis
      const response = await fetch('/api/coupons?' + new URLSearchParams({
        status: 'active',
        isActive: 'true',
        limit: '50'
      }));

      const data = await response.json();
      
      if (data.success && data.data) {
        const available: AvailableCoupon[] = [];
        
        // Adicionar cupons automáticos
        for (const autoCoupon of autoCoupons) {
          const validation = await validateCoupon(autoCoupon.code);
          if (validation.isValid) {
            available.push({
              id: autoCoupon.id,
              code: autoCoupon.code,
              name: autoCoupon.name,
              description: autoCoupon.description,
              discountType: autoCoupon.type,
              discountValue: autoCoupon.value,
              isAutoApply: true,
              estimatedSavings: autoCoupon.estimatedSavings,
              type: autoCoupon.type,
              value: autoCoupon.value
            });
          }
        }
        
        // Adicionar outros cupons válidos
        for (const coupon of data.data) {
          // Pular se já está na lista de automáticos
          if (available.some(ac => ac.id === coupon.id)) continue;
          
          const validation = await validateCoupon(coupon.code);
          if (validation.isValid) {
            available.push({
              id: coupon.id,
              code: coupon.code,
              name: coupon.name,
              description: coupon.description,
              discountType: coupon.discountType,
              discountValue: coupon.discountValue,
              isAutoApply: false,
              estimatedSavings: calculateEstimatedSavings(coupon, context),
              type: coupon.discountType,
              value: coupon.discountValue
            });
          }
        }
        
        // Ordenar por economia estimada (maior primeiro)
        available.sort((a, b) => (b.estimatedSavings || 0) - (a.estimatedSavings || 0));
        
        setAvailableCoupons(available);
      }
    } catch (err) {
      console.error('Erro ao buscar cupons disponíveis:', err);
    }
  }, [context, validateCoupon]);

  const getAutoCoupons = useCallback(async (): Promise<AutoCoupon[]> => {
    try {
      const params = new URLSearchParams({
        isAutoApply: 'true',
        status: 'active',
        limit: '20'
      });
      
      // Adicionar filtros baseados no contexto
      if (context.storeId) {
        params.append('storeId', context.storeId);
      }
      
      const response = await fetch('/api/coupons?' + params);
      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data.map((coupon: any) => ({
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          description: coupon.description,
          type: coupon.type,
          value: coupon.value,
          isFirstPurchase: coupon.autoApplyFirstPurchase,
          category: coupon.autoApplyCategory,
          estimatedSavings: calculateEstimatedSavings(coupon, context)
        }));
      }
      
      return [];
    } catch (err) {
      console.error('Erro ao buscar cupons automáticos:', err);
      return [];
    }
  }, [context]);

  const applyBestCoupon = useCallback(async (): Promise<boolean> => {
    if (appliedCoupon || availableCoupons.length === 0) {
      return false;
    }
    
    // Encontrar o cupom com maior economia
    const bestCoupon = availableCoupons.reduce((best, current) => {
      const bestSavings = best.estimatedSavings || 0;
      const currentSavings = current.estimatedSavings || 0;
      return currentSavings > bestSavings ? current : best;
    });
    
    if (bestCoupon && (bestCoupon.estimatedSavings || 0) > 0) {
      return await applyCoupon(bestCoupon.code);
    }
    
    return false;
  }, [appliedCoupon, availableCoupons, applyCoupon]);

  return {
    appliedCoupon,
    availableCoupons,
    isLoading,
    error,
    applyCoupon,
    removeCoupon,
    validateCoupon,
    refreshAvailableCoupons,
    getAutoCoupons,
    applyBestCoupon
  };
}

// Função auxiliar para calcular economia estimada
function calculateEstimatedSavings(coupon: any, context: CouponContext): number {
  const applicableAmount = context.cartTotal;
  
  // Aplicar valor mínimo
  if (coupon.minimumOrderValue && context.cartTotal < coupon.minimumOrderValue) {
    return 0;
  }
  
  // Calcular desconto
  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = (applicableAmount * coupon.value) / 100;
  } else if (coupon.type === 'fixed_amount') {
    discount = Math.min(coupon.value, applicableAmount);
  }
  
  // Aplicar limite máximo
  if (coupon.maximumDiscountAmount) {
    discount = Math.min(discount, coupon.maximumDiscountAmount);
  }
  
  return Math.min(discount, applicableAmount);
}