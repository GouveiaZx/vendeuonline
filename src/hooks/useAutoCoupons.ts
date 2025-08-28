import { useState, useEffect, useCallback } from 'react';
import { AutoCoupon, CouponContext, CouponApplication } from '@/types';

interface AutoCouponsState {
  autoCoupons: AutoCoupon[];
  bestCoupon: AutoCoupon | null;
  appliedCoupon: CouponApplication | null;
  totalSavings: number;
  isLoading: boolean;
  error: string | null;
}

interface UseAutoCouponsProps {
  userId?: string;
  context: CouponContext;
  autoApply?: boolean;
  orderId?: string;
}

export function useAutoCoupons({
  userId,
  context,
  autoApply = false,
  orderId
}: UseAutoCouponsProps) {
  const [state, setState] = useState<AutoCouponsState>({
    autoCoupons: [],
    bestCoupon: null,
    appliedCoupon: null,
    totalSavings: 0,
    isLoading: false,
    error: null
  });

  // Buscar cupons automáticos
  const fetchAutoCoupons = useCallback(async (applyBest = false) => {
    if (!userId || !context.cartTotal || context.cartTotal <= 0) {
      setState(prev => ({
        ...prev,
        autoCoupons: [],
        bestCoupon: null,
        totalSavings: 0,
        error: null
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/coupons/auto-apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}`
        },
        body: JSON.stringify({
          context,
          orderId,
          applyBest
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar cupons automáticos');
      }

      setState(prev => ({
        ...prev,
        autoCoupons: data.autoCoupons || [],
        bestCoupon: data.bestCoupon || null,
        appliedCoupon: data.appliedCoupon || prev.appliedCoupon,
        totalSavings: data.totalSavings || 0,
        isLoading: false,
        error: null
      }));

      return data;
    } catch (error) {
      console.error('Erro ao buscar cupons automáticos:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar cupons automáticos'
      }));
      return null;
    }
  }, [userId, context, orderId]);

  // Aplicar melhor cupom automaticamente
  const applyBestCoupon = useCallback(async () => {
    if (!state.bestCoupon || !orderId) {
      return false;
    }

    try {
      const result = await fetchAutoCoupons(true);
      return result?.appliedCoupon ? true : false;
    } catch (error) {
      console.error('Erro ao aplicar melhor cupom:', error);
      return false;
    }
  }, [state.bestCoupon, orderId, fetchAutoCoupons]);

  // Aplicar cupom específico
  const applySpecificCoupon = useCallback(async (couponCode: string) => {
    if (!userId || !orderId) {
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}`
        },
        body: JSON.stringify({
          code: couponCode,
          context,
          orderId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao aplicar cupom');
      }

      if (data.success && data.application) {
        setState(prev => ({
          ...prev,
          appliedCoupon: data.application,
          isLoading: false,
          error: null
        }));
        
        // Recarregar cupons automáticos para atualizar disponibilidade
        await fetchAutoCoupons(false);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao aplicar cupom'
      }));
      return false;
    }
  }, [userId, orderId, context, fetchAutoCoupons]);

  // Remover cupom aplicado
  const removeAppliedCoupon = useCallback(async () => {
    if (!state.appliedCoupon || !userId) {
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/coupons/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}`
        },
        body: JSON.stringify({
          couponCode: state.appliedCoupon.couponCode,
          orderId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao remover cupom');
      }

      if (data.success) {
        setState(prev => ({
          ...prev,
          appliedCoupon: null,
          isLoading: false,
          error: null
        }));
        
        // Recarregar cupons automáticos
        await fetchAutoCoupons(false);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao remover cupom:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao remover cupom'
      }));
      return false;
    }
  }, [state.appliedCoupon, userId, orderId, fetchAutoCoupons]);

  // Buscar cupons quando contexto mudar
  useEffect(() => {
    fetchAutoCoupons(autoApply);
  }, [fetchAutoCoupons, autoApply]);

  // Filtrar cupons por tipo
  const getFirstPurchaseCoupons = useCallback(() => {
    return state.autoCoupons.filter(coupon => coupon.isFirstPurchase);
  }, [state.autoCoupons]);

  const getCategoryCoupons = useCallback(() => {
    return state.autoCoupons.filter(coupon => coupon.isCategory && !coupon.isFirstPurchase);
  }, [state.autoCoupons]);

  const getGeneralCoupons = useCallback(() => {
    return state.autoCoupons.filter(coupon => !coupon.isCategory && !coupon.isFirstPurchase);
  }, [state.autoCoupons]);

  // Verificar se há cupons aplicáveis
  const hasApplicableCoupons = useCallback(() => {
    return state.autoCoupons.length > 0;
  }, [state.autoCoupons]);

  // Obter economia potencial total
  const getPotentialSavings = useCallback(() => {
    return state.totalSavings;
  }, [state.totalSavings]);

  // Obter melhor economia possível
  const getBestSavings = useCallback(() => {
    return state.bestCoupon?.savings || 0;
  }, [state.bestCoupon]);

  // Verificar se cupom está aplicado
  const isCouponApplied = useCallback((couponCode: string) => {
    return state.appliedCoupon?.couponCode === couponCode;
  }, [state.appliedCoupon]);

  return {
    ...state,
    fetchAutoCoupons,
    applyBestCoupon,
    applySpecificCoupon,
    removeAppliedCoupon,
    getFirstPurchaseCoupons,
    getCategoryCoupons,
    getGeneralCoupons,
    hasApplicableCoupons,
    getPotentialSavings,
    getBestSavings,
    isCouponApplied
  };
};