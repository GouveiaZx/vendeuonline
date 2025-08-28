import { Coupon, CouponValidation, CouponValidationError, CouponContext } from '@/types';
import { supabaseServer } from '@/lib/supabase';

export interface ValidationRule {
  name: string;
  validate: (coupon: Coupon, context: CouponContext) => Promise<boolean> | boolean;
  errorMessage: string;
  errorCode: CouponValidationError;
}

export class CouponValidationService {
  private rules: ValidationRule[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules() {
    this.rules = [
      {
        name: 'coupon_exists',
        validate: (coupon: Coupon) => !!coupon,
        errorMessage: 'Cupom não encontrado',
        errorCode: CouponValidationError.COUPON_NOT_FOUND
      },
      {
        name: 'coupon_active',
        validate: (coupon: Coupon) => coupon.isActive,
        errorMessage: 'Cupom não está ativo',
        errorCode: CouponValidationError.COUPON_INACTIVE
      },
      {
        name: 'not_expired',
        validate: (coupon: Coupon) => {
          if (!coupon.endDate) return true;
          return new Date(coupon.endDate) >= new Date();
        },
        errorMessage: 'Cupom expirado',
        errorCode: CouponValidationError.COUPON_EXPIRED
      },
      {
        name: 'start_date_valid',
        validate: (coupon: Coupon) => {
          return new Date(coupon.startDate) <= new Date();
        },
        errorMessage: 'Cupom ainda não está válido',
        errorCode: CouponValidationError.COUPON_NOT_STARTED
      },
      {
        name: 'usage_limit_not_exceeded',
        validate: (coupon: Coupon) => {
          if (!coupon.usageLimit) return true;
          return coupon.usedCount < coupon.usageLimit;
        },
        errorMessage: 'Limite de uso do cupom esgotado',
        errorCode: CouponValidationError.USAGE_LIMIT_EXCEEDED
      },
      {
        name: 'minimum_order_value',
        validate: (coupon: Coupon, context: CouponContext) => {
          if (!coupon.minimumOrderValue || coupon.minimumOrderValue === 0) return true;
          return (context.orderTotal || 0) >= coupon.minimumOrderValue;
        },
        errorMessage: 'Valor mínimo do pedido não atingido',
        errorCode: CouponValidationError.MINIMUM_ORDER_VALUE_NOT_MET
      },
      {
        name: 'store_restriction',
        validate: (coupon: Coupon, context: CouponContext) => {
          if (!coupon.storeId) return true;
          return context.storeId === coupon.storeId;
        },
        errorMessage: 'Cupom não válido para esta loja',
        errorCode: CouponValidationError.STORE_RESTRICTION
      },
      {
        name: 'category_restriction',
        validate: (coupon: Coupon, context: CouponContext) => {
          if (!coupon.applicableCategories || coupon.applicableCategories.length === 0) return true;
          if (!context.categories || context.categories.length === 0) return false;
          
          return context.categories.some(category => 
            coupon.applicableCategories!.includes(category)
          );
        },
        errorMessage: 'Cupom não válido para as categorias do carrinho',
        errorCode: CouponValidationError.CATEGORY_RESTRICTION
      },
      {
        name: 'product_restriction',
        validate: (coupon: Coupon, context: CouponContext) => {
          if (!coupon.applicableProducts || coupon.applicableProducts.length === 0) return true;
          if (!context.productIds || context.productIds.length === 0) return false;
          
          return context.productIds.some(productId => 
            coupon.applicableProducts!.includes(productId)
          );
        },
        errorMessage: 'Cupom não válido para os produtos do carrinho',
        errorCode: CouponValidationError.PRODUCT_RESTRICTION
      },
      {
        name: 'store_list_restriction',
        validate: (coupon: Coupon, context: CouponContext) => {
          if (!coupon.applicableStores || coupon.applicableStores.length === 0) return true;
          if (!context.storeId) return false;
          
          return coupon.applicableStores.includes(context.storeId);
        },
        errorMessage: 'Cupom não válido para esta loja',
        errorCode: CouponValidationError.STORE_RESTRICTION
      },
      {
        name: 'first_purchase_restriction',
        validate: async (coupon: Coupon, context: CouponContext) => {
          if (!coupon.autoApplyFirstPurchase) return true;
          if (!context.userId) return false;
          
          // Esta validação precisa ser implementada com uma consulta ao banco
          // Por enquanto, vamos assumir que o contexto já inclui essa informação
          return context.isFirstPurchase === true;
        },
        errorMessage: 'Cupom válido apenas para primeira compra',
        errorCode: CouponValidationError.FIRST_PURCHASE_ONLY
      }
    ];
  }

  async validateCoupon(
    coupon: Coupon, 
    context: CouponContext
  ): Promise<CouponValidation> {
    const errors: Array<{ rule: string; message: string; code: CouponValidationError }> = [];
    
    for (const rule of this.rules) {
      try {
        const isValid = await rule.validate(coupon, context);
        if (!isValid) {
          errors.push({
            rule: rule.name,
            message: rule.errorMessage,
            code: rule.errorCode
          });
        }
      } catch (error) {
        console.error(`Erro na validação da regra ${rule.name}:`, error);
        errors.push({
          rule: rule.name,
          message: 'Erro interno na validação',
          code: CouponValidationError.VALIDATION_ERROR
        });
      }
    }

    const isValid = errors.length === 0;
    let discountAmount = 0;
    let finalTotal = context.orderTotal;

    if (isValid) {
      const calculation = this.calculateDiscount(coupon, context);
      discountAmount = calculation.discountAmount;
      finalTotal = calculation.finalTotal;
    }

    return {
      isValid,
      errors: errors.map(e => ({
        message: e.message,
        code: e.code
      })),
      discountAmount,
      finalTotal,
      appliedRules: this.rules.map(r => r.name)
    };
  }

  calculateDiscount(
    coupon: Coupon, 
    context: CouponContext
  ): { discountAmount: number; finalTotal: number } {
    let discountAmount = 0;
    const orderTotal = context.orderTotal || 0;

    if (coupon.type === 'percentage') {
      discountAmount = (orderTotal * coupon.value) / 100;
      
      // Aplicar limite máximo de desconto se definido
      if (coupon.maximumDiscountAmount && discountAmount > coupon.maximumDiscountAmount) {
        discountAmount = coupon.maximumDiscountAmount;
      }
    } else if (coupon.type === 'fixed_amount') {
      discountAmount = Math.min(coupon.value, orderTotal);
    }

    // Garantir que o desconto não seja maior que o total do pedido
    discountAmount = Math.min(discountAmount, orderTotal);
    
    // Garantir que o desconto não seja negativo
    discountAmount = Math.max(0, discountAmount);

    const finalTotal = Math.max(0, orderTotal - discountAmount);

    return {
      discountAmount: Math.round(discountAmount * 100) / 100, // Arredondar para 2 casas decimais
      finalTotal: Math.round(finalTotal * 100) / 100
    };
  }

  // Validação específica para uso por cliente
  async validateUserUsage(
    coupon: Coupon,
    userId: string,
    getUserUsageCount: (couponId: string, userId: string) => Promise<number>
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Se não há limite por cliente, sempre válido
      if (!coupon.usageLimitPerCustomer || coupon.usageLimitPerCustomer <= 0) {
        return { isValid: true };
      }

      const userUsageCount = await getUserUsageCount(coupon.id, userId);
      
      if (userUsageCount >= coupon.usageLimitPerCustomer) {
        return {
          isValid: false,
          error: `Você já utilizou este cupom ${coupon.usageLimitPerCustomer} vez(es). Limite por cliente atingido.`
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Erro ao validar uso por usuário:', error);
      return {
        isValid: false,
        error: 'Erro ao verificar histórico de uso do cupom'
      };
    }
  }

  // Validação rápida apenas para verificar se o cupom pode ser aplicado
  quickValidate(coupon: Coupon, context: CouponContext): boolean {
    // Verificações básicas que não requerem consultas ao banco
    if (!coupon.isActive) return false;
    if (coupon.endDate && new Date(coupon.endDate) < new Date()) return false;
    if (new Date(coupon.startDate) > new Date()) return false;
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return false;
    if (coupon.minimumOrderValue && (context.orderTotal || 0) < coupon.minimumOrderValue) return false;
    
    return true;
  }

  // Buscar cupons automáticos aplicáveis
  findApplicableAutoCoupons(
    coupons: Coupon[],
    context: CouponContext
  ): Coupon[] {
    return coupons.filter(coupon => {
      if (!coupon.isAutoApply) return false;
      if (!this.quickValidate(coupon, context)) return false;
      
      // Verificar restrições específicas para auto-aplicação
      if (coupon.autoApplyFirstPurchase && !context.isFirstPurchase) return false;
      if (coupon.autoApplyCategory && (!context.categories || !context.categories.includes(coupon.autoApplyCategory))) return false;
      
      return true;
    });
  }

  // Encontrar o melhor cupom (maior desconto)
  findBestCoupon(
    coupons: Coupon[],
    context: CouponContext
  ): Coupon | null {
    let bestCoupon: Coupon | null = null;
    let maxDiscount = 0;

    for (const coupon of coupons) {
      if (!this.quickValidate(coupon, context)) continue;
      
      const { discountAmount } = this.calculateDiscount(coupon, context);
      if (discountAmount > maxDiscount) {
        maxDiscount = discountAmount;
        bestCoupon = coupon;
      }
    }

    return bestCoupon;
  }

  // Adicionar regra customizada
  addCustomRule(rule: ValidationRule) {
    this.rules.push(rule);
  }

  // Remover regra
  removeRule(ruleName: string) {
    this.rules = this.rules.filter(rule => rule.name !== ruleName);
  }

  // Obter todas as regras
  getRules(): ValidationRule[] {
    return [...this.rules];
  }

  // Buscar cupom por identificador (código ou ID)
  async findCouponByIdentifier(
    identifier: string,
    type: 'code' | 'id'
  ): Promise<Coupon | null> {
    if (!supabaseServer) {
      console.error('Supabase server client não configurado');
      return null;
    }

    try {
      let query = supabaseServer
        .from('coupons')
        .select('*');

      if (type === 'code') {
        query = query.eq('code', identifier.toUpperCase());
      } else {
        query = query.eq('id', identifier);
      }

      const { data: couponData, error } = await query.single();

      if (error || !couponData) {
        return null;
      }

      // Converter dados do banco para o tipo Coupon
      return {
        id: couponData.id,
        code: couponData.code,
        name: couponData.name,
        description: couponData.description,
        type: couponData.type,
        value: couponData.value,
        minimumOrderValue: couponData.minimum_order_value,
        maximumDiscountAmount: couponData.maximum_discount_amount,
        usageLimit: couponData.usage_limit,
        usageLimitPerCustomer: couponData.usage_limit_per_customer,
        usedCount: couponData.used_count,
        isActive: couponData.is_active,
        isAutoApply: couponData.is_auto_apply,
        autoApplyCategory: couponData.auto_apply_category,
        autoApplyFirstPurchase: couponData.auto_apply_first_purchase,
        startDate: couponData.start_date,
        endDate: couponData.end_date,
        storeId: couponData.store_id,
        applicableCategories: couponData.applicable_categories,
        applicableProducts: couponData.applicable_products,
        applicableStores: couponData.applicable_stores,
        createdAt: couponData.created_at,
        updatedAt: couponData.updated_at
      };
    } catch (error) {
      console.error('Erro ao buscar cupom:', error);
      return null;
    }
  }

  // Verificar se é primeira compra do usuário
  async checkIsFirstPurchase(userId: string): Promise<boolean> {
    if (!supabaseServer) return false;

    try {
      const { count } = await supabaseServer
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'completed');
      
      return (count || 0) === 0;
    } catch (error) {
      console.error('Erro ao verificar primeira compra:', error);
      return false;
    }
  }

  // Registrar uso de cupom
  async recordCouponUsage(
    couponId: string,
    userId: string,
    orderId: string,
    discountAmount: number
  ): Promise<boolean> {
    if (!supabaseServer) return false;

    try {
      // Registrar uso na tabela coupon_usage
      const { error: usageError } = await supabaseServer
        .from('coupon_usage')
        .insert({
          coupon_id: couponId,
          user_id: userId,
          order_id: orderId,
          discount_amount: discountAmount,
          used_at: new Date().toISOString()
        });

      if (usageError) {
        console.error('Erro ao registrar uso do cupom:', usageError);
        return false;
      }

      // Incrementar contador de uso do cupom
      const { data: currentCoupon } = await supabaseServer
        .from('coupons')
        .select('used_count')
        .eq('id', couponId)
        .single();
      
      const newUsedCount = (currentCoupon?.used_count || 0) + 1;
      
      const { error: updateError } = await supabaseServer
        .from('coupons')
        .update({ 
          used_count: newUsedCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', couponId);

      if (updateError) {
        console.error('Erro ao atualizar contador do cupom:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao registrar uso do cupom:', error);
      return false;
    }
  }

  // Buscar cupons automáticos
  async findAutoCoupons(context: CouponContext): Promise<Coupon[]> {
    if (!supabaseServer) return [];

    try {
      let query = supabaseServer
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .eq('is_auto_apply', true)
        .lte('start_date', new Date().toISOString());

      // Filtrar por data de expiração
      query = query.or('end_date.is.null,end_date.gte.' + new Date().toISOString());

      // Filtrar por loja se especificada
      if (context.storeId) {
        query = query.or(`store_id.is.null,store_id.eq.${context.storeId},applicable_stores.cs.{${context.storeId}}`);
      }

      const { data: couponsData, error } = await query;

      if (error) {
        console.error('Erro ao buscar cupons automáticos:', error);
        return [];
      }

      // Converter para o tipo Coupon
      const coupons: Coupon[] = (couponsData || []).map(couponData => ({
        id: couponData.id,
        code: couponData.code,
        name: couponData.name,
        description: couponData.description,
        type: couponData.type,
        value: couponData.value,
        minimumOrderValue: couponData.minimum_order_value,
        maximumDiscountAmount: couponData.maximum_discount_amount,
        usageLimit: couponData.usage_limit,
        usageLimitPerCustomer: couponData.usage_limit_per_customer,
        usedCount: couponData.used_count,
        isActive: couponData.is_active,
        isAutoApply: couponData.is_auto_apply,
        autoApplyCategory: couponData.auto_apply_category,
        autoApplyFirstPurchase: couponData.auto_apply_first_purchase,
        startDate: couponData.start_date,
        endDate: couponData.end_date,
        storeId: couponData.store_id,
        applicableCategories: couponData.applicable_categories,
        applicableProducts: couponData.applicable_products,
        applicableStores: couponData.applicable_stores,
        createdAt: couponData.created_at,
        updatedAt: couponData.updated_at
      }));

      // Filtrar cupons aplicáveis usando validação
      return this.findApplicableAutoCoupons(coupons, context);

    } catch (error) {
      console.error('Erro ao buscar cupons automáticos:', error);
      return [];
    }
  }
}

// Instância singleton do serviço
export const couponValidationService = new CouponValidationService();

// Funções utilitárias
export const validateCouponCode = async (
  coupon: Coupon,
  context: CouponContext
): Promise<CouponValidation> => {
  return couponValidationService.validateCoupon(coupon, context);
};

export const calculateCouponDiscount = (
  coupon: Coupon,
  context: CouponContext
): { discountAmount: number; finalTotal: number } => {
  return couponValidationService.calculateDiscount(coupon, context);
};

export const findBestAutoCoupon = (
  coupons: Coupon[],
  context: CouponContext
): Coupon | null => {
  const applicableCoupons = couponValidationService.findApplicableAutoCoupons(coupons, context);
  return couponValidationService.findBestCoupon(applicableCoupons, context);
};

// Funções utilitárias adicionais
export const findCouponByCode = async (code: string): Promise<Coupon | null> => {
  return couponValidationService.findCouponByIdentifier(code, 'code');
};

export const findCouponById = async (id: string): Promise<Coupon | null> => {
  return couponValidationService.findCouponByIdentifier(id, 'id');
};

export const getAutoCoupons = async (context: CouponContext): Promise<Coupon[]> => {
  return couponValidationService.findAutoCoupons(context);
};

export const recordCouponUsage = async (
  couponId: string,
  userId: string, 
  orderId: string,
  discountAmount: number
): Promise<boolean> => {
  return couponValidationService.recordCouponUsage(couponId, userId, orderId, discountAmount);
};