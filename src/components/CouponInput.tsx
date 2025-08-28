import React, { useState, useEffect } from 'react';
import { Tag, Check, X, Loader2, Percent, DollarSign } from 'lucide-react';
import { usePost } from '@/hooks/useApi';
import {
  CouponValidation,
  CouponApplication,
  CouponContext,
  AppliedCoupon
} from '@/types';

interface CouponInputProps {
  context: CouponContext;
  appliedCoupon?: AppliedCoupon;
  onCouponApplied: (application: CouponApplication) => void;
  onCouponRemoved: () => void;
  disabled?: boolean;
  className?: string;
}

export default function CouponInput({
  context,
  appliedCoupon,
  onCouponApplied,
  onCouponRemoved,
  disabled = false,
  className = ''
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Hooks para API
  const validateApi = usePost<{
    validation: CouponValidation;
    application?: CouponApplication;
  }>();
  
  const applyApi = usePost<{
    application: CouponApplication;
  }>();

  // Limpar estado quando cupom aplicado muda
  useEffect(() => {
    if (appliedCoupon) {
      setCouponCode('');
      validateApi.reset();
    }
  }, [appliedCoupon]);

  // Validar cupom com debounce
  useEffect(() => {
    if (!couponCode.trim() || couponCode.length < 3) {
      validateApi.reset();
      return;
    }

    const timeoutId = setTimeout(() => {
      validateCoupon(couponCode.trim());
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [couponCode, context]);

  const validateCoupon = async (code: string) => {
    await validateApi.execute('/api/coupons/validate', {
      code,
      context
    });
  };

  const handleApplyCoupon = async () => {
    if (!validateApi.data?.application || !couponCode.trim()) return;

    const response = await applyApi.execute('/api/coupons/apply', {
      code: couponCode.trim(),
      context
    });

    if (response.success && response.data?.application) {
      onCouponApplied(response.data.application);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    setCouponCode('');
    validateApi.reset();
    applyApi.reset();
  };

  const getValidationIcon = () => {
    if (validateApi.loading) {
      return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;
    }
    
    if (validateApi.data?.validation?.isValid) {
      return <Check className="w-4 h-4 text-green-500" />;
    }
    
    if (validateApi.data?.validation && !validateApi.data.validation.isValid) {
      return <X className="w-4 h-4 text-red-500" />;
    }
    
    return <Tag className="w-4 h-4 text-gray-400" />;
  };

  const getValidationMessage = () => {
    if (validateApi.data?.validation?.message) {
      return validateApi.data.validation.message;
    }
    if (validateApi.error) {
      return validateApi.error;
    }
    if (applyApi.error) {
      return applyApi.error;
    }
    return null;
  };

  const formatDiscount = (application: CouponApplication) => {
    if (application.discountType === 'percentage') {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <Percent className="w-4 h-4" />
          <span>{application.discountValue}% OFF</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <DollarSign className="w-4 h-4" />
          <span>R$ {application.discountAmount.toFixed(2)} OFF</span>
        </div>
      );
    }
  };

  // Se já tem cupom aplicado, mostrar resumo
  if (appliedCoupon) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span className="font-medium text-green-800">
                Cupom {appliedCoupon.code} aplicado
              </span>
            </div>
            {appliedCoupon.name && (
              <span className="text-sm text-green-600">
                ({appliedCoupon.name})
              </span>
            )}
          </div>
          <button
            onClick={handleRemoveCoupon}
            disabled={disabled}
            className="text-green-600 hover:text-green-800 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm text-green-700">
            Economia: R$ {appliedCoupon.savings.toFixed(2)}
          </div>
          {appliedCoupon.discountType === 'percentage' ? (
            <div className="flex items-center gap-1 text-green-600">
              <Percent className="w-4 h-4" />
              <span className="text-sm">{appliedCoupon.discountValue}% OFF</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-600">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">R$ {appliedCoupon.discountAmount.toFixed(2)} OFF</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Input do cupom */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Digite o código do cupom"
              disabled={disabled}
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getValidationIcon()}
            </div>
          </div>
          
          <button
            onClick={handleApplyCoupon}
            disabled={disabled || !validateApi.data?.validation?.isValid || validateApi.loading || applyApi.loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {applyApi.loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Aplicar'
            )}
          </button>
        </div>
      </div>

      {/* Mensagem de validação */}
      {getValidationMessage() && (
        <div className={`text-sm p-2 rounded ${
          validateApi.data?.validation?.isValid
            ? 'text-green-700 bg-green-50'
            : 'text-red-700 bg-red-50'
        }`}>
          {getValidationMessage()}
        </div>
      )}

      {/* Preview do desconto */}
      {validateApi.data?.validation?.isValid && validateApi.data?.application && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-blue-800">
                {validateApi.data.application.couponName}
              </div>
              <div className="text-sm text-blue-600">
                Economia: R$ {validateApi.data.application.savings.toFixed(2)}
              </div>
            </div>
            {formatDiscount(validateApi.data.application)}
          </div>
          
          <div className="mt-2 text-xs text-blue-600">
            Total com desconto: R$ {validateApi.data.application.finalTotal.toFixed(2)}
          </div>
        </div>
      )}

      {/* Mensagem de sucesso */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-800">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Cupom aplicado com sucesso!</span>
          </div>
        </div>
      )}
    </div>
  );
}