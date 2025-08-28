'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Eye, EyeOff, Calendar, Users, ShoppingCart, TrendingUp, Copy, Check } from 'lucide-react';
import { Coupon, CouponUsage, CouponStats } from '@/types';
import { formatters } from '@/utils/formatters';

export default function CouponDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [recentUsage, setRecentUsage] = useState<CouponUsage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (couponId) {
      loadCouponDetails();
    }
  }, [couponId]);

  const loadCouponDetails = async () => {
    setLoading(true);
    try {
      // Carregar dados do cupom
      const [couponResponse, statsResponse, usageResponse] = await Promise.all([
        fetch(`/api/coupons?id=${couponId}`),
        fetch(`/api/coupons/stats?id=${couponId}`),
        fetch(`/api/coupons/usage?id=${couponId}&limit=10`)
      ]);

      const couponData = await couponResponse.json();
      const statsData = await statsResponse.json();
      const usageData = await usageResponse.json();

      if (couponData.success) {
        setCoupon(couponData.data);
      } else {
        setError('Cupom não encontrado');
      }

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (usageData.success) {
        setRecentUsage(usageData.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do cupom:', error);
      setError('Erro ao carregar detalhes do cupom');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!coupon) return;
    
    setActionLoading('toggle');
    try {
      const response = await fetch('/api/coupons', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: coupon.id,
          isActive: !coupon.isActive
        })
      });

      const data = await response.json();

      if (data.success) {
        setCoupon(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
      } else {
        alert(data.error || 'Erro ao atualizar cupom');
      }
    } catch (error) {
      console.error('Erro ao atualizar cupom:', error);
      alert('Erro ao atualizar cupom');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCoupon = async () => {
    if (!coupon || !confirm('Tem certeza que deseja deletar este cupom?')) {
      return;
    }

    setActionLoading('delete');
    try {
      const response = await fetch(`/api/coupons?id=${coupon.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin/coupons');
      } else {
        alert(data.error || 'Erro ao deletar cupom');
      }
    } catch (error) {
      console.error('Erro ao deletar cupom:', error);
      alert('Erro ao deletar cupom');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyCode = async () => {
    if (!coupon) return;
    
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar código:', error);
    }
  };

  const getCouponStatus = (coupon: Coupon): string => {
    if (!coupon.isActive) return 'disabled';
    
    if (coupon.endDate && new Date(coupon.endDate) < new Date()) {
      return 'expired';
    }
    
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return 'used';
    }
    
    return 'active';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
      expired: { label: 'Expirado', className: 'bg-red-100 text-red-800' },
      used: { label: 'Usado', className: 'bg-gray-100 text-gray-800' },
      disabled: { label: 'Desabilitado', className: 'bg-yellow-100 text-yellow-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.disabled;
    
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      percentage: { label: 'Percentual', className: 'bg-blue-100 text-blue-800' },
      fixed: { label: 'Valor Fixo', className: 'bg-purple-100 text-purple-800' },
      shipping: { label: 'Frete Grátis', className: 'bg-green-100 text-green-800' }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.fixed;
    
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando detalhes do cupom...</p>
        </div>
      </div>
    );
  }

  if (error || !coupon) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'Cupom não encontrado'}</p>
          <button
            onClick={() => router.push('/admin/coupons')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar para Cupons
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/admin/coupons')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detalhes do Cupom</h1>
              <p className="text-gray-600">Visualize e gerencie informações do cupom</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/admin/coupons/${coupon.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
            
            <button
              onClick={handleToggleActive}
              disabled={actionLoading === 'toggle'}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                coupon.isActive
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              } disabled:opacity-50`}
            >
              {coupon.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {actionLoading === 'toggle' ? 'Processando...' : (coupon.isActive ? 'Desativar' : 'Ativar')}
            </button>
            
            <button
              onClick={handleDeleteCoupon}
              disabled={actionLoading === 'delete'}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {actionLoading === 'delete' ? 'Deletando...' : 'Deletar'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Informações Básicas</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código do Cupom
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-2 bg-gray-100 rounded-lg font-mono text-lg">
                      {coupon.code}
                    </code>
                    <button
                      onClick={handleCopyCode}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Copiar código"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo
                  </label>
                  <div>
                    {getTypeBadge(coupon.type)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor do Desconto
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {coupon.type === 'percentage' 
                      ? `${coupon.value}%`
                      : coupon.type === 'fixed_amount'
                      ? formatters.formatCurrency(coupon.value)
                      : 'Frete Grátis'
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div>
                    {getStatusBadge(getCouponStatus(coupon))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <p className="text-gray-900">
                    {coupon.description || 'Sem descrição'}
                  </p>
                </div>
              </div>
            </div>

            {/* Usage Limits Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Limites de Uso</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usos Máximos
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {coupon.usageLimit || 'Ilimitado'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usos por Usuário
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {coupon.usageLimitPerCustomer || 'Ilimitado'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Mínimo
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {coupon.minimumOrderValue ? formatters.formatCurrency(coupon.minimumOrderValue) : 'Sem mínimo'}
                  </p>
                </div>
              </div>
            </div>

            {/* Validity Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Validade</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Criação
                  </label>
                  <p className="text-gray-900">
                    {formatters.formatDate(coupon.createdAt)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Expiração
                  </label>
                  <p className="text-gray-900">
                    {coupon.endDate ? formatters.formatDate(coupon.endDate) : 'Sem expiração'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Usage */}
            {recentUsage.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Usos Recentes</h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pedido
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Desconto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentUsage.map((usage, index) => (
                        <tr key={index}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {usage.userName || 'Usuário anônimo'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            #{usage.orderId}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatters.formatCurrency(usage.discountAmount)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatters.formatDate(usage.usedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {stats && (
              <>
                {/* Usage Stats */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas de Uso</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-600">Total de Usos</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900">
                        {stats.totalUsage}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-600">Pedidos</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900">
                        {stats.totalOrders}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-600">Desconto Total</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatters.formatCurrency(stats.totalDiscount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-gray-600">Último Uso</span>
                      </div>
                      <span className="text-sm text-gray-900">
                        {stats.lastUsed ? formatters.formatDate(stats.lastUsed) : 'Nunca usado'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Usage Progress */}
                {coupon.usageLimit && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Progresso de Uso</h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Usado</span>
                        <span className="text-gray-900">
                          {stats.totalUsage} / {coupon.usageLimit}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min((stats.totalUsage / coupon.usageLimit) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        {Math.max(0, coupon.usageLimit - stats.totalUsage)} usos restantes
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/admin/coupons/${coupon.id}/edit`)}
                  className="w-full flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  Editar Cupom
                </button>
                
                <button
                  onClick={handleCopyCode}
                  className="w-full flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado!' : 'Copiar Código'}
                </button>
                
                <button
                  onClick={() => router.push('/admin/coupons/new')}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Criar Cupom Similar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}