'use client';

import { useState, useEffect } from 'react';
import { Calendar, Download, Filter, TrendingUp, DollarSign, Users, ShoppingBag, BarChart3, PieChart } from 'lucide-react';
import { toast } from 'sonner';
import { useCommissionStore } from '@/store/commissionStore';
import { LoadingButton } from '@/components/ui/LoadingStates';
import { format as formatDate, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ExportReports from '@/components/ExportReports';

type ReportPeriod = '7d' | '30d' | '3m' | '6m' | '1y' | 'custom';
type GroupBy = 'month' | 'category' | 'store';

export default function CommissionReportsPage() {
  const {
    stats,
    transactions,
    loading,
    error,
    fetchStats,
    fetchTransactions,
    clearError
  } = useCommissionStore();

  const [period, setPeriod] = useState<ReportPeriod>('30d');
  const [groupBy, setGroupBy] = useState<GroupBy>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  // Calcular datas baseado no período selecionado
  const getDateRange = () => {
    const now = new Date();
    
    switch (period) {
      case '7d':
        return {
          startDate: formatDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          endDate: formatDate(now, 'yyyy-MM-dd')
        };
      case '30d':
        return {
          startDate: formatDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          endDate: formatDate(now, 'yyyy-MM-dd')
        };
      case '3m':
        return {
          startDate: formatDate(subMonths(now, 3), 'yyyy-MM-dd'),
          endDate: formatDate(now, 'yyyy-MM-dd')
        };
      case '6m':
        return {
          startDate: formatDate(subMonths(now, 6), 'yyyy-MM-dd'),
          endDate: formatDate(now, 'yyyy-MM-dd')
        };
      case '1y':
        return {
          startDate: formatDate(subMonths(now, 12), 'yyyy-MM-dd'),
          endDate: formatDate(now, 'yyyy-MM-dd')
        };
      case 'custom':
        return {
          startDate: customStartDate,
          endDate: customEndDate
        };
      default:
        return {
          startDate: formatDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          endDate: formatDate(now, 'yyyy-MM-dd')
        };
    }
  };

  // Carregar dados quando filtros mudarem
  useEffect(() => {
    const { startDate, endDate } = getDateRange();
    
    if (startDate && endDate) {
      const params = {
        startDate,
        endDate,
        groupBy,
        ...(selectedStoreId && { storeId: selectedStoreId })
      };
      
      fetchStats(params as any);
      fetchTransactions({ ...params, limit: 100 });
    }
  }, [period, groupBy, customStartDate, customEndDate, selectedStoreId, fetchStats, fetchTransactions]);

  // Função para buscar dados com filtros específicos para exportação
  const handleFetchDataForExport = async (filters: any) => {
    try {
      // Buscar dados com os filtros aplicados
      await fetchTransactions({
        startDate: filters.startDate,
        endDate: filters.endDate,
        storeId: filters.storeId,
        limit: 1000 // Buscar mais dados para exportação
      });
      
      return {
        transactions,
        payouts: [], // Buscar repasses se necessário
        salesData: [] // Buscar dados de vendas se necessário
      };
    } catch (error) {
      toast.error('Erro ao buscar dados para exportação');
      throw error;
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios de Comissões</h1>
          <p className="text-gray-600">Análise detalhada das comissões e performance financeira</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Period Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="3m">Últimos 3 meses</option>
                <option value="6m">Últimos 6 meses</option>
                <option value="1y">Último ano</option>
                <option value="custom">Período personalizado</option>
              </select>
            </div>

            {/* Group By Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agrupar por
              </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="month">Mês</option>
                <option value="category">Categoria</option>
                <option value="store">Loja</option>
              </select>
            </div>

            {/* Store Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loja (opcional)
              </label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas as lojas</option>
                {/* Em produção, carregar lojas da API */}
              </select>
            </div>

            {/* Export Actions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exportar Relatórios
              </label>
              <button
                onClick={() => setShowExportModal(true)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar Dados
              </button>
            </div>
          </div>

          {/* Custom Date Range */}
          {period === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Final
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {stats?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Comissão Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.summary.totalCommission)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total de Pedidos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.summary.totalOrders}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Taxa Média</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPercentage(stats.summary.averageCommissionRate)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Users className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Valor Total Vendas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.summary.totalOrderValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pending vs Paid Commissions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Status das Comissões</h3>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            
            {stats?.summary && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Pendente</span>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(stats.summary.pendingCommission)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Pago</span>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(stats.summary.paidCommission)}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${stats.summary.totalCommission > 0 
                          ? (stats.summary.paidCommission / stats.summary.totalCommission) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.summary.totalCommission > 0 
                      ? `${((stats.summary.paidCommission / stats.summary.totalCommission) * 100).toFixed(1)}% pago`
                      : '0% pago'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Top Categories/Stores */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Top {groupBy === 'category' ? 'Categorias' : groupBy === 'store' ? 'Lojas' : 'Períodos'}
              </h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            
            {stats && (
              <div className="space-y-3">
                {(() => {
                  const data = groupBy === 'category' ? stats.categoryStats : stats.storeStats;
                  return data.slice(0, 5).map((item: any, index: number) => {
                    const name = item.categoryName || item.storeName || item.month || 'N/A';
                    const value = item.totalCommission || 0;
                    const maxValue = Math.max(...data.map((d: any) => d.totalCommission || 0));
                    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                  
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {name}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(value)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Transações Recentes</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor do Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taxa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comissão
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Nenhuma transação encontrada para o período selecionado.
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 10).map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(new Date(transaction.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.storeName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{transaction.orderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(transaction.orderAmount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPercentage(transaction.commissionRate || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(transaction.commissionAmount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'paid' 
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'calculated'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.status === 'paid' ? 'Pago' : 
                           transaction.status === 'calculated' ? 'Calculado' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Reports Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Exportar Relatórios de Comissões</h2>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <ExportReports
                  transactions={transactions}
                  payouts={[]} // Adicionar repasses quando disponível
                  salesData={[]} // Adicionar dados de vendas quando disponível
                  showTransactions={true}
                  showPayouts={false}
                  showSalesReport={false}
                  defaultStoreId={selectedStoreId}
                  onFetchData={handleFetchDataForExport}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}