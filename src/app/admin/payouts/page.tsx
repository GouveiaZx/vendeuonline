'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Eye, DollarSign, Users, Calendar, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCommissionStore } from '@/store/commissionStore';
import { CommissionPayout } from '@/types';
import { LoadingButton, LoadingTable } from '@/components/ui/LoadingStates';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type PayoutStatus = 'all' | 'pending' | 'processing' | 'completed' | 'failed';

export default function AdminPayoutsPage() {
  const {
    payouts,
    loading,
    error,
    fetchPayouts,
    createPayout,
    updatePayoutStatus,
    clearError
  } = useCommissionStore();

  const [statusFilter, setStatusFilter] = useState<PayoutStatus>('all');
  const [storeFilter, setStoreFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<CommissionPayout | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchAction, setBatchAction] = useState<'approve' | 'reject' | 'process'>('approve');
  const [batchNotes, setBatchNotes] = useState('');
  const [createFormData, setCreateFormData] = useState({
    storeId: '',
    period: format(new Date(), 'yyyy-MM'),
    notes: ''
  });
  const [statusFormData, setStatusFormData] = useState({
    status: 'pending' as CommissionPayout['status'],
    notes: '',
    paymentReference: ''
  });

  // Carregar repasses ao montar o componente
  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const filteredPayouts = payouts.filter(payout => {
    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
    const matchesStore = !storeFilter || payout.storeId.includes(storeFilter);
    return matchesStatus && matchesStore;
  });

  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('create');

    try {
      await createPayout({
        storeId: createFormData.storeId,
        period: createFormData.period,
        notes: createFormData.notes || undefined
      });
      
      toast.success('Repasse criado com sucesso');
      setShowCreateForm(false);
      setCreateFormData({
        storeId: '',
        period: format(new Date(), 'yyyy-MM'),
        notes: ''
      });
    } catch (error) {
      toast.error('Erro ao criar repasse');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;

    setActionLoading('status');

    try {
      await updatePayoutStatus(selectedPayout.id, {
        status: statusFormData.status,
        notes: statusFormData.notes || undefined,
        paymentReference: statusFormData.paymentReference || undefined
      });
      
      toast.success('Status do repasse atualizado com sucesso');
      setShowStatusModal(false);
      setSelectedPayout(null);
    } catch (error) {
      toast.error('Erro ao atualizar status do repasse');
    } finally {
      setActionLoading(null);
    }
  };

  const openStatusModal = (payout: CommissionPayout) => {
    setSelectedPayout(payout);
    setStatusFormData({
      status: payout.status,
      notes: payout.notes || '',
      paymentReference: payout.paymentReference || ''
    });
    setShowStatusModal(true);
  };

  const handleSelectPayout = (payoutId: string) => {
    setSelectedPayouts(prev => 
      prev.includes(payoutId) 
        ? prev.filter(id => id !== payoutId)
        : [...prev, payoutId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPayouts.length === filteredPayouts.length) {
      setSelectedPayouts([]);
    } else {
      setSelectedPayouts(filteredPayouts.map(p => p.id));
    }
  };

  const handleBatchAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPayouts.length === 0) return;

    setActionLoading('batch');

    try {
      const promises = selectedPayouts.map(payoutId => {
        let newStatus: CommissionPayout['status'];
        switch (batchAction) {
          case 'approve':
            newStatus = 'processing';
            break;
          case 'process':
            newStatus = 'completed';
            break;
          case 'reject':
            newStatus = 'failed';
            break;
          default:
            newStatus = 'pending';
        }

        return updatePayoutStatus(payoutId, {
          status: newStatus,
          notes: batchNotes || undefined
        });
      });

      await Promise.all(promises);
      
      toast.success(`${selectedPayouts.length} repasses processados com sucesso`);
      setShowBatchModal(false);
      setSelectedPayouts([]);
      setBatchNotes('');
    } catch (error) {
      toast.error('Erro ao processar repasses em lote');
    } finally {
      setActionLoading(null);
    }
  };

  const openBatchModal = (action: 'approve' | 'reject' | 'process') => {
    setBatchAction(action);
    setShowBatchModal(true);
  };

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

  // Calcular estatísticas
  const totalAmount = filteredPayouts.reduce((sum, p) => sum + p.amount, 0);
  const completedAmount = filteredPayouts
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = filteredPayouts
    .filter(p => ['pending', 'processing'].includes(p.status))
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Repasses</h1>
          <p className="text-gray-600">Gerencie repasses de comissão para vendedores</p>
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
                  fetchPayouts();
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
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total de Repasses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Concluídos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(completedAmount)}
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
                  <p className="text-sm font-medium text-gray-500">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(pendingAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex flex-col lg:flex-row gap-4 flex-1">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PayoutStatus)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">Pendente</option>
                  <option value="processing">Processando</option>
                  <option value="completed">Concluído</option>
                  <option value="failed">Falhou</option>
                </select>
              </div>

              {/* Store Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por Loja
                </label>
                <input
                  type="text"
                  placeholder="ID ou nome da loja..."
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-end gap-3">
              {selectedPayouts.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedPayouts.length} selecionados
                  </span>
                  <button
                    onClick={() => openBatchModal('approve')}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    disabled={loading}
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => openBatchModal('process')}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    disabled={loading}
                  >
                    Processar
                  </button>
                  <button
                    onClick={() => openBatchModal('reject')}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                    disabled={loading}
                  >
                    Rejeitar
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                <Plus className="h-4 w-4" />
                Novo Repasse
              </button>
            </div>
          </div>
        </div>

        {/* Payouts Table */}
        {loading ? (
          <LoadingTable columns={7} rows={5} />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedPayouts.length === filteredPayouts.length && filteredPayouts.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loja
                    </th>
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
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Processado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayouts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        {statusFilter !== 'all' || storeFilter 
                          ? 'Nenhum repasse encontrado para os filtros selecionados.'
                          : 'Nenhum repasse criado ainda.'
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredPayouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedPayouts.includes(payout.id)}
                            onChange={() => handleSelectPayout(payout.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg mr-3">
                              <Users className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {payout.storeName || 'Loja não encontrada'}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {payout.storeId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {format(new Date(`${payout.period}-01`), 'MMM yyyy', { locale: ptBR })}
                            </span>
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
                            <button
                              onClick={() => openStatusModal(payout)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              title="Atualizar status"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {payout.notes && (
                              <div className="relative group">
                                <Eye className="h-4 w-4 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 max-w-xs">
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

        {/* Create Payout Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Criar Novo Repasse</h2>
              
              <form onSubmit={handleCreatePayout} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID da Loja *
                  </label>
                  <input
                    type="text"
                    value={createFormData.storeId}
                    onChange={(e) => setCreateFormData({ ...createFormData, storeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={actionLoading === 'create'}
                    placeholder="Ex: store-123"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Período (YYYY-MM) *
                  </label>
                  <input
                    type="text"
                    value={createFormData.period}
                    onChange={(e) => setCreateFormData({ ...createFormData, period: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={actionLoading === 'create'}
                    placeholder="Ex: 2024-01"
                    pattern="\d{4}-\d{2}"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={createFormData.notes}
                    onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    disabled={actionLoading === 'create'}
                    placeholder="Observações sobre o repasse..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={actionLoading === 'create'}
                  >
                    Cancelar
                  </button>
                  <LoadingButton
                    type="submit"
                    loading={actionLoading === 'create'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Criar Repasse
                  </LoadingButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {showStatusModal && selectedPayout && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Atualizar Status do Repasse</h2>
              
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={statusFormData.status}
                    onChange={(e) => setStatusFormData({ ...statusFormData, status: e.target.value as CommissionPayout['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={actionLoading === 'status'}
                  >
                    <option value="pending">Pendente</option>
                    <option value="processing">Processando</option>
                    <option value="completed">Concluído</option>
                    <option value="failed">Falhou</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referência do Pagamento
                  </label>
                  <input
                    type="text"
                    value={statusFormData.paymentReference}
                    onChange={(e) => setStatusFormData({ ...statusFormData, paymentReference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={actionLoading === 'status'}
                    placeholder="Ex: PIX-123456789"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={statusFormData.notes}
                    onChange={(e) => setStatusFormData({ ...statusFormData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    disabled={actionLoading === 'status'}
                    placeholder="Observações sobre a atualização..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowStatusModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={actionLoading === 'status'}
                  >
                    Cancelar
                  </button>
                  <LoadingButton
                    type="submit"
                    loading={actionLoading === 'status'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Atualizar Status
                  </LoadingButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Ação em Lote */}
        {showBatchModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {batchAction === 'approve' && 'Aprovar Repasses'}
                {batchAction === 'process' && 'Processar Repasses'}
                {batchAction === 'reject' && 'Rejeitar Repasses'}
              </h3>
              
              <p className="text-gray-600 mb-4">
                Você está prestes a {batchAction === 'approve' ? 'aprovar' : batchAction === 'process' ? 'processar' : 'rejeitar'} {selectedPayouts.length} repasse(s).
              </p>

              <form onSubmit={handleBatchAction}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={batchNotes}
                    onChange={(e) => setBatchNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Adicione observações sobre esta ação..."
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBatchModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    disabled={actionLoading === 'batch'}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-lg transition-colors ${
                      batchAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                      batchAction === 'process' ? 'bg-blue-600 hover:bg-blue-700' :
                      'bg-red-600 hover:bg-red-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={actionLoading === 'batch'}
                  >
                    {actionLoading === 'batch' ? 'Processando...' : 'Confirmar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}