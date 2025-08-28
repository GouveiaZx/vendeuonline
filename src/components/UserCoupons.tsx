import React, { useState, useEffect } from 'react';
import { Tag, Copy, Calendar, DollarSign, Percent, Gift, CheckCircle, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { AvailableCoupon } from '@/types';

interface UserCouponsProps {
  userId?: string;
  cartTotal?: number;
  cartItems?: Array<{
    productId: string;
    quantity: number;
    price: number;
    category?: string;
    storeId?: string;
  }>;
  storeId?: string;
  onApplyCoupon?: (couponCode: string) => Promise<boolean>;
  appliedCouponCode?: string;
  showOnlyApplicable?: boolean;
  className?: string;
}

interface CouponCategory {
  id: string;
  name: string;
  coupons: AvailableCoupon[];
}

export function UserCoupons({
  userId,
  cartTotal = 0,
  cartItems = [],
  storeId,
  onApplyCoupon,
  appliedCouponCode,
  showOnlyApplicable = false,
  className = ''
}: UserCouponsProps) {
  const [coupons, setCoupons] = useState<AvailableCoupon[]>([]);
  const [categories, setCategories] = useState<CouponCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [applyingCode, setApplyingCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'auto' | 'all'>('available');

  // Carregar cupons disponíveis
  const loadAvailableCoupons = async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ userId });
      
      if (cartTotal > 0) {
        params.append('cartTotal', cartTotal.toString());
      }
      
      if (storeId) {
        params.append('storeId', storeId);
      }
      
      if (showOnlyApplicable && cartItems.length > 0) {
        params.append('applicable', 'true');
        params.append('items', JSON.stringify(cartItems));
      }

      const response = await fetch(`/api/coupons/available?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar cupons');
      }

      const availableCoupons = data.coupons || [];
      setCoupons(availableCoupons);

      // Organizar cupons por categoria
      const categorizedCoupons: CouponCategory[] = [
        {
          id: 'auto',
          name: 'Cupons Automáticos',
          coupons: availableCoupons.filter((c: AvailableCoupon) => c.isAutomatic)
        },
        {
          id: 'manual',
          name: 'Cupons Manuais',
          coupons: availableCoupons.filter((c: AvailableCoupon) => !c.isAutomatic)
        },
        {
          id: 'first_purchase',
          name: 'Primeira Compra',
          coupons: availableCoupons.filter((c: AvailableCoupon) => c.isFirstPurchase)
        }
      ].filter(category => category.coupons.length > 0);

      setCategories(categorizedCoupons);
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar cupons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAvailableCoupons();
  }, [userId, cartTotal, storeId, showOnlyApplicable]);

  // Copiar código do cupom
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar código:', error);
    }
  };

  // Aplicar cupom
  const handleApplyCoupon = async (code: string) => {
    if (!onApplyCoupon) {
      await handleCopyCode(code);
      return;
    }

    setApplyingCode(code);
    try {
      const success = await onApplyCoupon(code);
      if (success) {
        // Recarregar cupons para atualizar disponibilidade
        await loadAvailableCoupons();
      }
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
    } finally {
      setApplyingCode(null);
    }
  };

  // Formatar data de expiração (será substituído pelo SafeDateTime)
  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Se for renderização no servidor ou se a data for inválida, mostrar apenas a data formatada
    if (typeof window === 'undefined' || isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR');
    }
    
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Expirado';
    } else if (diffDays === 0) {
      return 'Expira hoje';
    } else if (diffDays === 1) {
      return 'Expira amanhã';
    } else if (diffDays <= 7) {
      return `Expira em ${diffDays} dias`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  // Renderizar cupom
  const renderCoupon = (coupon: AvailableCoupon) => {
    const isApplied = appliedCouponCode === coupon.code;
    const isApplying = applyingCode === coupon.code;
    const isCopied = copiedCode === coupon.code;
    const canApply = !isApplied && !isApplying && coupon.isApplicable;

    return (
      <div
        key={coupon.id}
        className={`relative p-4 border rounded-lg transition-all ${
          isApplied
            ? 'border-green-300 bg-green-50'
            : coupon.isApplicable
            ? 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
            : 'border-gray-200 bg-gray-50 opacity-60'
        }`}
      >
        {/* Badge de cupom automático */}
        {coupon.isAutomatic && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
              <Sparkles className="w-3 h-3" />
              <span>Auto</span>
            </div>
          </div>
        )}

        {/* Badge de primeira compra */}
        {coupon.isFirstPurchase && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              <Gift className="w-3 h-3" />
              <span>1ª Compra</span>
            </div>
          </div>
        )}

        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="w-4 h-4 text-gray-600" />
              <span className="font-mono font-bold text-lg text-gray-900">
                {coupon.code}
              </span>
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-1">
              {coupon.name}
            </h3>
            
            {coupon.description && (
              <p className="text-sm text-gray-600 mb-2">
                {coupon.description}
              </p>
            )}
          </div>

          <div className="text-right ml-4">
            <div className="flex items-center gap-1 text-lg font-bold text-blue-600">
              {coupon.type === 'percentage' ? (
                <>
                  <Percent className="w-4 h-4" />
                  <span>{coupon.value}%</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  <span>R$ {(Number(coupon.value) || 0).toFixed(2)}</span>
                </>
              )}
            </div>
            
            {coupon.estimatedSavings && (
              <div className="text-sm text-green-600 font-medium">
                Economia: R$ {coupon.estimatedSavings.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          {coupon.endDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatExpiryDate(coupon.endDate)}</span>
            </div>
          )}
          
          {coupon.minimumOrderValue && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              <span>Mín. R$ {(Number(coupon.minimumOrderValue) || 0).toFixed(2)}</span>
            </div>
          )}
          
          {coupon.usageLimit && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{coupon.usageLimit - (coupon.usedCount || 0)} restantes</span>
            </div>
          )}
        </div>

        {/* Restrições */}
        {(coupon.applicableCategories?.length || coupon.applicableProducts?.length || coupon.applicableStores?.length) && (
          <div className="text-xs text-gray-500 mb-3">
            <span className="font-medium">Válido para: </span>
            {coupon.applicableCategories?.length && (
              <span>categorias específicas</span>
            )}
            {coupon.applicableProducts?.length && (
              <span>produtos específicos</span>
            )}
            {coupon.applicableStores?.length && (
              <span>lojas específicas</span>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2">
          {isApplied ? (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Cupom aplicado</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => handleCopyCode(coupon.code)}
                className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Copy className="w-3 h-3" />
                <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
              </button>
              
              {onApplyCoupon && canApply && (
                <button
                  onClick={() => handleApplyCoupon(coupon.code)}
                  disabled={isApplying}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isApplying ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <Tag className="w-3 h-3" />
                  )}
                  <span>{isApplying ? 'Aplicando...' : 'Aplicar'}</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Motivo de não aplicabilidade */}
        {!coupon.isApplicable && coupon.reason && (
          <div className="mt-2 text-xs text-red-600">
            {coupon.reason}
          </div>
        )}
      </div>
    );
  };

  if (!userId) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Gift className="w-8 h-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Faça login para ver cupons disponíveis</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Cabeçalho */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Cupons Disponíveis
        </h2>
        <p className="text-gray-600">
          Aproveite os cupons disponíveis para economizar em suas compras
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'available'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Aplicáveis ({coupons.filter(c => c.isApplicable).length})
        </button>
        
        <button
          onClick={() => setActiveTab('auto')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'auto'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Automáticos ({coupons.filter(c => c.isAutomatic).length})
        </button>
        
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Todos ({coupons.length})
        </button>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando cupons...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadAvailableCoupons}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'available' && (
            <div className="grid gap-4">
              {coupons.filter(c => c.isApplicable).map(renderCoupon)}
              {coupons.filter(c => c.isApplicable).length === 0 && (
                <div className="text-center py-8">
                  <Gift className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum cupom aplicável no momento</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'auto' && (
            <div className="grid gap-4">
              {coupons.filter(c => c.isAutomatic).map(renderCoupon)}
              {coupons.filter(c => c.isAutomatic).length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum cupom automático disponível</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'all' && (
            <div className="space-y-6">
              {categories.map(category => (
                <div key={category.id}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {category.name}
                  </h3>
                  <div className="grid gap-4">
                    {category.coupons.map(renderCoupon)}
                  </div>
                </div>
              ))}
              
              {categories.length === 0 && (
                <div className="text-center py-8">
                  <Gift className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum cupom disponível</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserCoupons;
