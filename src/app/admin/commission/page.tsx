'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, usePermissions } from '@/store/authStore';
import { useCommissionStore } from '@/store/commissionStore';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Settings, 
  FileText, 
  CreditCard,
  BarChart3,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { LoadingButton } from '@/components/ui/LoadingStates';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CommissionDashboard() {
  const { user } = useAuthStore();
  const { isAdmin } = usePermissions();
  const {
    stats,
    rates,
    transactions,
    payouts,
    loading,
    error,
    fetchStats,
    fetchRates,
    fetchTransactions,
    fetchPayouts,
    clearError
  } = useCommissionStore();

  const [refreshing, setRefreshing] = useState(false);

  // Verificar autenticaÃ§Ã£o e permissÃµes
  useEffect(() => {
    if (!user || !isAdmin) {
      window.location.href = '/';
    }
  }, [user, isAdmin]);

  // Carregar dados ao montar o componente
  useEffect(() => {
    if (user && isAdmin) {
      loadDashboardData();
    }
  }, [user, isAdmin]);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        fetchStats(),
        fetchRates(),
        fetchTransactions({ limit: 5 }),
        fetchPayouts()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calcular estatÃ­sticas resumidas
  const totalCommission = stats?.summary?.totalCommission || 0;
  const paidCommission = stats?.summary?.paidCommission || 0;
  const pendingCommission = stats?.summary?.pendingCommission || 0;
  const totalOrders = stats?.summary?.totalOrders || 0;
  const averageCommissionRate = stats?.summary?.averageCommissionRate || 0;

  const activeRates = rates.filter(rate => rate.isActive).length;
  const pendingPayouts = payouts.filter(payout => payout.status === 'pending').length;
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema de ComissÃµes</h1>
              <p className="text-gray-600">Gerencie taxas, transaÃ§Ãµes e repasses de comissÃ£o</p>
            </div>
            <LoadingButton
              onClick={handleRefresh}
              loading={refreshing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Atualizar Dados
            </LoadingButton>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="text-red-800 font-medium">Erro ao carregar dados</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => {
                  clearError();
                  handleRefresh();
                }}
                className="ml-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de ComissÃµes</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCommission)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">ComissÃµes Pagas</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(paidCommission)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">ComissÃµes Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(pendingCommission)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Taxa MÃ©dia</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(averageCommissionRate)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            href="/admin/commission-rates"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Configurar Taxas</h3>
                  <p className="text-sm text-gray-600">{activeRates} taxas ativas</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </Link>
          
          <Link
            href="/admin/commission-reports"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">RelatÃ³rios</h3>
                  <p className="text-sm text-gray-600">{totalOrders} pedidos analisados</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
            </div>
          </Link>
          
          <Link
            href="/admin/commission-financial-reports"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">RelatÃ³rios Financeiros</h3>
                  <p className="text-sm text-gray-600">AnÃ¡lise detalhada</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
            </div>
          </Link>
          
          <Link
            href="/admin/payouts"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Repasses</h3>
                  <p className="text-sm text-gray-600">{pendingPayouts} pendentes</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">TransaÃ§Ãµes Recentes</h3>
                <Link
                  href="/admin/commission-reports"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Ver todas
                </Link>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentTransactions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma transaÃ§Ã£o encontrada</p>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.storeName || 'Loja nÃ£o identificada'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Pedido #{transaction.orderId} â€¢ {formatCurrency(transaction.orderAmount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          {formatCurrency(transaction.commissionAmount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatPercentage(transaction.commissionRate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Commission Summary */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Resumo do PerÃ­odo</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total de Pedidos</span>
                  <span className="text-sm font-semibold text-gray-900">{totalOrders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Valor Total dos Pedidos</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(stats?.summary?.totalOrderValue || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ComissÃ£o Total</span>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(totalCommission)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Taxa MÃ©dia de ComissÃ£o</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {formatPercentage(averageCommissionRate)}
                  </span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">EficiÃªncia</span>
                    <span className="text-sm font-semibold text-purple-600">
                      {totalOrders > 0 ? formatPercentage((totalCommission / (stats?.summary?.totalOrderValue || 1)) * 100) : '0%'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
