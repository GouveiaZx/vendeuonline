/**
 * Testes para o serviço consolidado de validação de cupons
 */

import { CouponValidationService } from '../couponValidation';
import { Coupon, CouponContext, CouponValidationError } from '@/types';

// Mock do Supabase
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockLt = jest.fn();
const mockGt = jest.fn();
const mockSingle = jest.fn();
const mockInsert = jest.fn();

const mockSupabaseServer = {
  from: mockFrom.mockReturnValue({
    select: mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        lt: mockLt.mockReturnValue({
          gt: mockGt.mockReturnValue({
            single: mockSingle
          })
        })
      }),
      single: mockSingle
    }),
    insert: mockInsert
  })
};

jest.mock('@/lib/supabase', () => ({
  supabaseServer: mockSupabaseServer
}));

describe('CouponValidationService', () => {
  let service: CouponValidationService;
  let mockCoupon: Coupon;
  let mockContext: CouponContext;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CouponValidationService();
    
    mockCoupon = {
      id: 'coupon_123',
      code: 'TEST10',
      name: 'Test Coupon',
      type: 'percentage',
      value: 10,
      minimumOrderValue: 50,
      isActive: true,
      startDate: new Date('2023-01-01').toISOString(),
      endDate: new Date('2025-12-31').toISOString(),
      usageLimitPerCustomer: 1,
      usedCount: 0,
      isAutoApply: false,
      autoApplyFirstPurchase: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockContext = {
      userId: 'user_123',
      orderValue: 100,
      cartTotal: 100,
      items: [],
      storeId: 'store_123'
    };
  });

  describe('validateCoupon', () => {
    it('should validate a valid coupon successfully', async () => {
      // Mock database responses
      mockSingle.mockResolvedValueOnce({ data: mockCoupon, error: null });
      mockSingle.mockResolvedValueOnce({ data: { count: 50 }, error: null }); // usage count
      mockSingle.mockResolvedValueOnce({ data: null, error: null }); // user usage

      const result = await service.validateCoupon(mockCoupon, mockContext);

      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Cupom válido');
      expect(result.errors).toHaveLength(0);
    });

    it('should reject inactive coupon', async () => {
      const inactiveCoupon = { ...mockCoupon, isActive: false };

      const result = await service.validateCoupon(inactiveCoupon, mockContext);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(CouponValidationError.COUPON_INACTIVE);
    });

    it('should reject expired coupon', async () => {
      const expiredCoupon = { ...mockCoupon, validUntil: new Date('2020-01-01') };

      const result = await service.validateCoupon(expiredCoupon, mockContext);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(CouponValidationError.COUPON_EXPIRED);
    });

    it('should reject coupon not yet valid', async () => {
      const futureCoupon = { ...mockCoupon, validFrom: new Date('2030-01-01') };

      const result = await service.validateCoupon(futureCoupon, mockContext);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(CouponValidationError.COUPON_NOT_YET_VALID);
    });

    it('should reject when order value is below minimum', async () => {
      const contextBelowMin = { ...mockContext, orderValue: 30 };

      const result = await service.validateCoupon(mockCoupon, contextBelowMin);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(CouponValidationError.MINIMUM_ORDER_VALUE_NOT_MET);
    });

    it('should reject when max uses exceeded', async () => {
      mockSingle.mockResolvedValueOnce({ data: mockCoupon, error: null });
      mockSingle.mockResolvedValueOnce({ data: { count: 100 }, error: null }); // at max uses

      const result = await service.validateCoupon(mockCoupon, mockContext);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(CouponValidationError.USAGE_LIMIT_EXCEEDED);
    });

    it('should reject when user has exceeded personal limit', async () => {
      mockSingle.mockResolvedValueOnce({ data: mockCoupon, error: null });
      mockSingle.mockResolvedValueOnce({ data: { count: 50 }, error: null }); // total usage
      mockSingle.mockResolvedValueOnce({ data: { count: 1 }, error: null }); // user usage at limit

      const result = await service.validateCoupon(mockCoupon, mockContext);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(CouponValidationError.USER_LIMIT_EXCEEDED);
    });

    it('should reject for new customers only when user is not new', async () => {
      const newCustomerCoupon = { ...mockCoupon, applicableToNewCustomers: true };
      mockSingle.mockResolvedValueOnce({ data: newCustomerCoupon, error: null });
      mockSingle.mockResolvedValueOnce({ data: { count: 50 }, error: null }); // total usage
      mockSingle.mockResolvedValueOnce({ data: null, error: null }); // user usage
      mockSingle.mockResolvedValueOnce({ data: true, error: null }); // is first purchase - FALSE

      const result = await service.validateCoupon(newCustomerCoupon, mockContext);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(CouponValidationError.FIRST_PURCHASE_ONLY);
    });

    it('should handle database errors gracefully', async () => {
      mockSingle.mockRejectedValueOnce(new Error('Database error'));

      const result = await service.validateCoupon(mockCoupon, mockContext);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(CouponValidationError.VALIDATION_ERROR);
    });
  });

  describe('findCouponByIdentifier', () => {
    it('should find coupon by code', async () => {
      mockSingle.mockResolvedValueOnce({ data: mockCoupon, error: null });

      const result = await service.findCouponByIdentifier('TEST10', 'code');

      expect(result).toEqual(mockCoupon);
      expect(mockEq).toHaveBeenCalledWith('code', 'TEST10');
    });

    it('should find coupon by ID', async () => {
      mockSingle.mockResolvedValueOnce({ data: mockCoupon, error: null });

      const result = await service.findCouponByIdentifier('coupon_123', 'id');

      expect(result).toEqual(mockCoupon);
      expect(mockEq).toHaveBeenCalledWith('id', 'coupon_123');
    });

    it('should return null when coupon not found', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      const result = await service.findCouponByIdentifier('INVALID', 'code');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockSingle.mockRejectedValueOnce(new Error('Database error'));

      const result = await service.findCouponByIdentifier('TEST10', 'code');

      expect(result).toBeNull();
    });
  });

  describe('checkIsFirstPurchase', () => {
    it('should return true for first-time buyers', async () => {
      mockSingle.mockResolvedValueOnce({ data: { count: 0 }, error: null });

      const result = await service.checkIsFirstPurchase('user_123');

      expect(result).toBe(true);
    });

    it('should return false for returning customers', async () => {
      mockSingle.mockResolvedValueOnce({ data: { count: 2 }, error: null });

      const result = await service.checkIsFirstPurchase('user_123');

      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      mockSingle.mockRejectedValueOnce(new Error('Database error'));

      const result = await service.checkIsFirstPurchase('user_123');

      expect(result).toBe(false); // Conservative default
    });
  });

  describe('recordCouponUsage', () => {
    it('should record coupon usage successfully', async () => {
      mockInsert.mockResolvedValueOnce({ data: { id: 'usage_123' }, error: null });

      const result = await service.recordCouponUsage('coupon_123', 'user_123', 'order_123', 50.00);

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith({
        coupon_id: 'coupon_123',
        user_id: 'user_123',
        order_id: 'order_123',
        used_at: expect.any(String)
      });
    });

    it('should handle insertion errors', async () => {
      mockInsert.mockResolvedValueOnce({ data: null, error: new Error('Insert failed') });

      const result = await service.recordCouponUsage('coupon_123', 'user_123', 'order_123', 25.00);

      expect(result).toBe(false);
    });
  });

  describe('findAutoCoupons', () => {
    it('should find applicable auto coupons', async () => {
      const autoCoupons = [
        { ...mockCoupon, code: 'AUTO1', isActive: true },
        { ...mockCoupon, code: 'AUTO2', isActive: true }
      ];

      mockSelect.mockReturnValueOnce({
        eq: mockEq.mockReturnValue({
          gte: mockGt.mockReturnValue(autoCoupons)
        })
      });

      const result = await service.findAutoCoupons(mockContext);

      expect(result).toEqual(autoCoupons);
    });

    it('should return empty array when no auto coupons found', async () => {
      mockSelect.mockReturnValueOnce({
        eq: mockEq.mockReturnValue({
          gte: mockGt.mockReturnValue([])
        })
      });

      const result = await service.findAutoCoupons(mockContext);

      expect(result).toEqual([]);
    });
  });

  describe('Validation Rules', () => {
    it('should have all required validation rules', () => {
      // Access private rules array via service instance
      const rules = (service as any).rules;

      expect(rules).toHaveLength(7); // Expected number of rules
      
      const ruleNames = rules.map((rule: any) => rule.name);
      expect(ruleNames).toContain('isActive');
      expect(ruleNames).toContain('notExpired');
      expect(ruleNames).toContain('isValidFromDate');
      expect(ruleNames).toContain('meetsMinOrderValue');
      expect(ruleNames).toContain('hasUsesRemaining');
      expect(ruleNames).toContain('userHasUsesRemaining');
      expect(ruleNames).toContain('applicableToCustomerType');
    });
  });
});