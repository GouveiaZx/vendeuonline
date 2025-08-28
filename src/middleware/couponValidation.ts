import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase';
import { couponValidationService } from '@/services/couponValidation';
import { Coupon, CouponContext, CouponValidation } from '@/types';

export interface CouponValidationMiddlewareOptions {
  requireAuth?: boolean;
  checkUserUsage?: boolean;
  allowInactiveCoupons?: boolean;
}

export interface ValidatedCouponRequest extends NextApiRequest {
  coupon?: Coupon;
  validation?: CouponValidation;
  context?: CouponContext;
  userId?: string;
}

// Middleware para validação de cupons
export function withCouponValidation(
  handler: (req: ValidatedCouponRequest, res: NextApiResponse) => Promise<void>,
  options: CouponValidationMiddlewareOptions = {}
) {
  return async (req: ValidatedCouponRequest, res: NextApiResponse) => {
    try {
      const { requireAuth = true, checkUserUsage = true, allowInactiveCoupons = false } = options;
      
      // Extrair dados da requisição
      const { code, couponId, orderTotal, storeId, categories, productIds, userId } = req.body;
      const couponIdentifier = code || couponId;

      if (!couponIdentifier) {
        return res.status(400).json({
          success: false,
          error: 'Código ou ID do cupom é obrigatório'
        });
      }

      // Buscar cupom usando o service
      const coupon = await couponValidationService.findCouponByIdentifier(
        couponIdentifier,
        code ? 'code' : 'id'
      );

      if (!coupon) {
        return res.status(404).json({
          success: false,
          error: 'Cupom não encontrado',
          code: 'COUPON_NOT_FOUND'
        });
      }

      // Verificar se o cupom está ativo (se necessário)
      if (!allowInactiveCoupons && !coupon.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Cupom não está ativo',
          code: 'COUPON_INACTIVE'
        });
      }

      // Verificar autenticação se necessário
      if (requireAuth && !userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
          code: 'UNAUTHORIZED'
        });
      }

      // Verificar uso por usuário se necessário
      if (checkUserUsage && userId) {
        const userUsageValidation = await couponValidationService.validateUserUsage(
          coupon,
          userId,
          async (couponId: string, userId: string) => {
            if (!supabaseServer) return 0;
            const { count } = await supabaseServer
              .from('coupon_usage')
              .select('*', { count: 'exact' })
              .eq('coupon_id', couponId)
              .eq('user_id', userId);
            return count || 0;
          }
        );

        if (!userUsageValidation.isValid) {
          return res.status(400).json({
            success: false,
            error: userUsageValidation.error,
            code: 'USER_USAGE_LIMIT_EXCEEDED'
          });
        }
      }

      // Verificar se é primeira compra usando o service
      let isFirstPurchase = false;
      if (userId && coupon.autoApplyFirstPurchase) {
        isFirstPurchase = await couponValidationService.checkIsFirstPurchase(userId);
      }

      // Criar contexto de validação
      const context: CouponContext = {
        orderTotal: orderTotal || 0,
        cartTotal: orderTotal || 0,
        items: [],
        storeId: storeId || undefined,
        categories: categories || [],
        productIds: productIds || [],
        userId: userId || undefined,
        isFirstPurchase
      };

      // Executar validação completa
      const validation = await couponValidationService.validateCoupon(coupon, context);

      // Adicionar dados à requisição
      req.coupon = coupon;
      req.validation = validation;
      req.context = context;
      req.userId = userId;

      // Continuar para o handler
      return handler(req, res);

    } catch (error) {
      console.error('Erro no middleware de validação de cupom:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };
}

// Middleware específico para aplicação de cupons
export function withCouponApplication(
  handler: (req: ValidatedCouponRequest, res: NextApiResponse) => Promise<void>
) {
  return withCouponValidation(async (req: ValidatedCouponRequest, res: NextApiResponse) => {
    const { validation, coupon } = req;

    if (!validation?.isValid) {
      return res.status(400).json({
        success: false,
        error: validation?.errors?.[0]?.message || 'Cupom inválido',
        code: validation?.errors?.[0]?.code || 'INVALID_COUPON',
        errors: validation?.errors
      });
    }

    return handler(req, res);
  }, {
    requireAuth: true,
    checkUserUsage: true,
    allowInactiveCoupons: false
  });
}

// Middleware para validação sem aplicação (apenas verificação)
export function withCouponCheck(
  handler: (req: ValidatedCouponRequest, res: NextApiResponse) => Promise<void>
) {
  return withCouponValidation(handler, {
    requireAuth: false,
    checkUserUsage: false,
    allowInactiveCoupons: true
  });
}

// Função utilitária para buscar cupons automáticos
export async function getAutoCoupons(
  context: CouponContext
): Promise<Coupon[]> {
  return couponValidationService.findAutoCoupons(context);
}

// Função para registrar uso de cupom
export async function recordCouponUsage(
  couponId: string,
  userId: string,
  orderId: string,
  discountAmount: number
): Promise<boolean> {
  return couponValidationService.recordCouponUsage(couponId, userId, orderId, discountAmount);
}