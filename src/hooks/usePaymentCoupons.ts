import { useState, useEffect, useCallback } from 'react';
import { useCoupons } from '@/hooks/useCoupons';
import { CouponApplication, CouponContext } from '@/types';

interface PaymentCouponState {
  appliedCoupon: CouponApplication | null;
  isApplying: boolean;
  error: string | null;
  originalTotal: number;
  discountAmount: number;
  finalTotal: number;
  savings: number;
}

interface UsePaymentCouponsProps {
  cartTotal: number;
  cartItems: Array<{
    productId: string;
    quantity: number;
    price: number;
    category?: string;
    storeId?: string;
  }>;
  storeId?: string;
  userId?: string;
}

export function usePaymentCoupons({
  cartTotal,
  cartItems,
  storeId,
  userId
}: UsePaymentCouponsProps) {
  const [state, setState] = useState<PaymentCouponState>({
    appliedCoupon: null,
    isApplying: false,
    error: null,
    originalTotal: cartTotal,
    discountAmount: 0,
    finalTotal: cartTotal,
    savings: 0
  });

  // Criar contexto do cupom
  const createCouponContext = useCallback((): CouponContext => {
    return {
      cartTotal,
      items: cartItems,
      storeId,
      userId
    };
  }, [cartTotal, cartItems, storeId, userId]);
  
  // Contexto atual
  const couponContext = createCouponContext();
  
  const {
    validateCoupon,
    applyCoupon,
    removeCoupon,
    refreshAvailableCoupons,
    getAutoCoupons,
    applyBestCoupon: applyBestCouponFromHook,
    isLoading
  } = useCoupons({ context: couponContext });

  // Atualizar totais quando o carrinho mudar
  useEffect(() => {
    setState(prev => ({
      ...prev,
      originalTotal: cartTotal,
      finalTotal: prev.appliedCoupon ? cartTotal - prev.discountAmount : cartTotal
    }));
  }, [cartTotal]);

  // Aplicar cupom no pagamento
  const applyPaymentCoupon = useCallback(async (
    couponCode: string,
    orderId?: string
  ): Promise<boolean> => {
    if (!userId) {
      setState(prev => ({ ...prev, error: 'Usuário não autenticado' }));
      return false;
    }

    setState(prev => ({ ...prev, isApplying: true, error: null }));

    try {
      // Primeiro validar o cupom
      const validation = await validateCoupon(couponCode);
      
      if (!validation.isValid) {
        setState(prev => ({
          ...prev,
          isApplying: false,
          error: validation.errors?.[0]?.message || 'Cupom inválido'
        }));
        return false;
      }

      // Aplicar o cupom
      const success = await applyCoupon(couponCode);
      
      if (success) {
        // Calcular valores baseado na validação
        const discountAmount = validation.discountAmount || 0;
        const finalTotal = Math.max(0, cartTotal - discountAmount);
        const savings = discountAmount;
        
        const application: CouponApplication = {
          couponId: validation.couponId || '',
          couponCode,
          couponName: validation.couponName || '',
          discountType: validation.discountType || 'percentage',
          discountValue: validation.discountValue || 0,
          discountAmount,
          finalTotal,
          savings
        };
        
        setState(prev => ({
          ...prev,
          appliedCoupon: application,
          discountAmount,
          finalTotal,
          savings,
          isApplying: false,
          error: null
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isApplying: false,
          error: 'Erro ao aplicar cupom'
        }));
        return false;
      }
    } catch (error) {
      console.error('Erro ao aplicar cupom no pagamento:', error);
      setState(prev => ({
        ...prev,
        isApplying: false,
        error: 'Erro ao aplicar cupom'
      }));
      return false;
    }
  }, [userId, validateCoupon, applyCoupon, cartTotal]);

  // Remover cupom do pagamento
  const removePaymentCoupon = useCallback(async (): Promise<boolean> => {
    if (!state.appliedCoupon) return true;

    setState(prev => ({ ...prev, isApplying: true, error: null }));

    try {
      removeCoupon();
      
      setState(prev => ({
        ...prev,
        appliedCoupon: null,
        discountAmount: 0,
        finalTotal: cartTotal,
        savings: 0,
        isApplying: false,
        error: null
      }));
      return true;
    } catch (error) {
      console.error('Erro ao remover cupom do pagamento:', error);
      setState(prev => ({
        ...prev,
        isApplying: false,
        error: 'Erro ao remover cupom'
      }));
      return false;
    }
  }, [state.appliedCoupon, removeCoupon, cartTotal]);

  // Aplicar melhor cupom automaticamente
  const applyBestPaymentCoupon = useCallback(async (orderId?: string): Promise<boolean> => {
    if (!userId) return false;

    setState(prev => ({ ...prev, isApplying: true, error: null }));

    try {
      const success = await applyBestCouponFromHook();
      
      if (success) {
        setState(prev => ({
          ...prev,
          isApplying: false,
          error: null
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isApplying: false,
          error: 'Nenhum cupom aplicável encontrado'
        }));
        return false;
      }
    } catch (error) {
      console.error('Erro ao aplicar melhor cupom:', error);
      setState(prev => ({
        ...prev,
        isApplying: false,
        error: 'Erro ao buscar cupons'
      }));
      return false;
    }
  }, [userId, applyBestCouponFromHook]);

  // Buscar cupons disponíveis para o pagamento
  const getPaymentCoupons = useCallback(async () => {
    if (!userId) return [];

    try {
      await refreshAvailableCoupons();
      return [];
    } catch (error) {
      console.error('Erro ao buscar cupons para pagamento:', error);
      return [];
    }
  }, [userId, refreshAvailableCoupons]);

  // Validar se há cupom aplicado e se ainda é válido
  const validateAppliedCoupon = useCallback(async (): Promise<boolean> => {
    if (!state.appliedCoupon || !userId) return true;

    try {
      const validation = await validateCoupon(state.appliedCoupon.couponCode);
      
      if (!validation.isValid) {
        // Remover cupom inválido
        setState(prev => ({
          ...prev,
          appliedCoupon: null,
          discountAmount: 0,
          finalTotal: cartTotal,
          savings: 0,
          error: validation.errors?.[0]?.message || 'Cupom não é mais válido'
        }));
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao validar cupom aplicado:', error);
      return false;
    }
  }, [state.appliedCoupon, validateCoupon, cartTotal]);

  // Limpar estado de erro
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Calcular resumo do pagamento
  const getPaymentSummary = useCallback(() => {
    return {
      subtotal: state.originalTotal,
      discount: state.discountAmount,
      total: state.finalTotal,
      savings: state.savings,
      couponApplied: !!state.appliedCoupon,
      couponCode: state.appliedCoupon?.couponCode,
      couponName: state.appliedCoupon?.couponName
    };
  }, [state]);

  return {
    // Estado
    appliedCoupon: state.appliedCoupon,
    isApplying: state.isApplying || isLoading,
    error: state.error,
    originalTotal: state.originalTotal,
    discountAmount: state.discountAmount,
    finalTotal: state.finalTotal,
    savings: state.savings,
    
    // Ações
    applyPaymentCoupon,
    removePaymentCoupon,
    applyBestCoupon: applyBestPaymentCoupon,
    getPaymentCoupons,
    validateAppliedCoupon,
    clearError,
    getPaymentSummary
  };
}

export default usePaymentCoupons;