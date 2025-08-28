'use client';

import { useState, useEffect } from 'react';
import { Calendar, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useCommissionStore } from '@/store/commissionStore';
import { useAuthStore } from '@/store/authStore';
import { CommissionPayout } from '@/types';
import { LoadingTable } from '@/components/ui/LoadingStates';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type PayoutStatus = 'all' | 'pending' | 'processing' | 'completed' | 'failed';

export default function SellerPayoutsPage() {
  const { user } = useAuthStore();
  const {
    payouts,
    loading,
    error,
    fetchPayouts,
    clearError
  } = useCommissionStore();

  const [statusFilter, setStatusFilter] = useState<PayoutStatus>('all');
  const [periodFilter, setPeriodFilter] = useState('');

  // Carregar repasses ao montar o componente
  useEffect(() => {
    if (user?.type === 'SELLER') {
      fetchPayouts({ sellerId: user.id });
    }
  }, [user, fetchPayouts]);

  const filteredPayouts = payouts.filter(payout => {
    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
    const matchesPeriod = !periodFilter || payout.period.includes(periodFilter);
    return matchesStatus && matchesPeriod;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'processing':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      pending: 'Pendente',
      processing: 'Processando',
      completed: 'Concluído',
      failed: 'Falhou'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleDownloadReceipt = (payout: CommissionPayout) => {
    // Simular download de comprovante
    toast.info('Funcionalidade de download será implementada em breve');
  };

  // Calcular estatísticas
  const totalEarnings = filteredPayouts
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const pendingAmount = filteredPayouts
    .filter(p => ['pending', 'processing'].includes(p.status))
    .reduce((sum, p) => sum + p.amount, 0);

  const thisMonthPayouts = filteredPayouts
    .filter(p => p.period === format(new Date(), 'yyyy-MM'));
  
  const thisMonthAmount = thisMonthPayouts.reduce((sum, p) => sum + p.amount, 0);

  if (!user || user.type !== 'SELLER') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-600">Esta página é apenas para vendedores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Repasses</h1>
          <p className="text-gray-600">Acompanhe seus repasses de comissão e histórico de pagamentos</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="text-red-800 font-medium">Erro ao carregar repasses</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => {
                  clearError();
                  if (user?.type === 'SELLER') {
                    fetchPayouts({ storeId: user.id });
                  }
                }}
                className="ml-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Recebido</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(totalEarnings)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pendente</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(pendingAmount)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Este Mês</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(thisMonthAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PayoutStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendente</option>
                <option value="processing">Processando</option>
                <option value="completed">Concluído</option>
                <option value="failed">Falhou</option>
              </select>
            </div>

            {/* Period Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período (YYYY-MM)
              </label>
              <input
                type="text"
                placeholder="Ex: 2024-01"
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Payouts Table */}
        {loading ? (
          <LoadingTable columns={6} rows={5} />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Período
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data de Criação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data de Processamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayouts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        {statusFilter !== 'all' || periodFilter 
                          ? 'Nenhum repasse encontrado para os filtros selecionados.'
                          : 'Nenhum repasse disponível ainda.'
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredPayouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                              <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {format(new Date(`${payout.period}-01`), 'MMMM yyyy', { locale: ptBR })}
                              </div>
                              <div className="text-sm text-gray-500">
                                {payout.period}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-semibold text-gray-900">
                            {formatCurrency(payout.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(payout.status)}
                            <span className="ml-2">
                              {getStatusBadge(payout.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(payout.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payout.processedAt 
                            ? format(new Date(payout.processedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                            : '-'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {payout.status === 'completed' && (
                              <button
                                onClick={() => handleDownloadReceipt(payout)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded flex items-center"
                                title="Baixar comprovante"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                            {payout.notes && (
                              <div className="relative group">
                                <AlertCircle className="h-4 w-4 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                  {payout.notes}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-blue-800 font-medium mb-2">Informações sobre Repasses</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Os repasses são processados mensalmente até o dia 5 do mês seguinte</li>
                <li>• Valores mínimos de R$ 50,00 para processamento</li>
                <li>• Repasses são feitos via PIX ou transferência bancária</li>
                <li>• Em caso de dúvidas, entre em contato com o suporte</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}