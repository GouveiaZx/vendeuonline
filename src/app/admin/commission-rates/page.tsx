'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, AlertCircle, Percent, Tag, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useCommissionStore } from '@/store/commissionStore';
import { CommissionRate } from '@/types';
import { LoadingButton, LoadingTable } from '@/components/ui/LoadingStates';
import { DeleteConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function AdminCommissionRatesPage() {
  const {
    rates,
    loading,
    error,
    fetchRates,
    createRate,
    updateRate,
    deleteRate,
    clearError
  } = useCommissionStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRate, setEditingRate] = useState<CommissionRate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; rate: CommissionRate | null }>({ show: false, rate: null });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    categoryName: '',
    rate: '',
    minAmount: '',
    maxAmount: '',
    isActive: true
  });

  // Carregar taxas ao montar o componente
  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const filteredRates = rates.filter(rate => 
    rate.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('form');

    try {
      const rateData = {
      categoryId: formData.categoryId,
      categoryName: formData.categoryName,
      commissionType: 'percentage' as const,
      commissionValue: parseFloat(formData.rate),
      minAmount: formData.minAmount ? parseFloat(formData.minAmount) : undefined,
      maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : undefined,
      isActive: formData.isActive
    };

      if (editingRate) {
        await updateRate(editingRate.id, rateData);
        toast.success('Taxa de comissão atualizada com sucesso');
      } else {
        await createRate(rateData);
        toast.success('Taxa de comissão criada com sucesso');
      }

      handleCloseForm();
    } catch (error) {
      toast.error(editingRate ? 'Erro ao atualizar taxa' : 'Erro ao criar taxa');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (rate: CommissionRate) => {
    setEditingRate(rate);
    setFormData({
      categoryId: rate.categoryId,
      categoryName: rate.categoryName || '',
      rate: rate.commissionValue.toString(),
      minAmount: rate.minAmount?.toString() || '',
      maxAmount: rate.maxAmount?.toString() || '',
      isActive: rate.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (rateId: string) => {
    setActionLoading(rateId);
    try {
      await deleteRate(rateId);
      toast.success('Taxa de comissão excluída com sucesso');
      setDeleteConfirm({ show: false, rate: null });
    } catch (error) {
      toast.error('Erro ao excluir taxa de comissão');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRate(null);
    setFormData({
      categoryId: '',
      categoryName: '',
      rate: '',
      minAmount: '',
      maxAmount: '',
      isActive: true
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Taxas de Comissão</h1>
          <p className="text-gray-600">Configure as taxas de comissão por categoria de produto</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="text-red-800 font-medium">Erro ao carregar taxas</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => {
                  clearError();
                  fetchRates();
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
                  <Percent className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total de Taxas</p>
                  <p className="text-2xl font-bold text-gray-900">{rates.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Tag className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Taxas Ativas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {rates.filter(rate => rate.isActive).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Taxa Média</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {rates.length > 0 
                      ? `${(rates.reduce((sum, rate) => sum + rate.commissionValue, 0) / rates.length).toFixed(1)}%`
                      : '0%'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
              Nova Taxa
            </button>
          </div>
        </div>

        {/* Rates Table */}
        {loading ? (
          <LoadingTable columns={6} rows={5} />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taxa (%)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Mínimo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Máximo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        {searchTerm ? 'Nenhuma taxa encontrada para a busca.' : 'Nenhuma taxa configurada ainda.'}
                      </td>
                    </tr>
                  ) : (
                    filteredRates.map((rate) => (
                      <tr key={rate.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                              <Tag className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {rate.categoryName}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {rate.categoryId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-semibold text-gray-900">
                            {rate.commissionValue}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {rate.minAmount ? formatCurrency(rate.minAmount) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {rate.maxAmount ? formatCurrency(rate.maxAmount) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rate.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {rate.isActive ? 'Ativa' : 'Inativa'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(rate)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              disabled={actionLoading === rate.id}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ show: true, rate })}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              disabled={actionLoading === rate.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingRate ? 'Editar Taxa de Comissão' : 'Nova Taxa de Comissão'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID da Categoria
                  </label>
                  <input
                    type="text"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={actionLoading === 'form'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Categoria
                  </label>
                  <input
                    type="text"
                    value={formData.categoryName}
                    onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={actionLoading === 'form'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taxa de Comissão (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={actionLoading === 'form'}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Mínimo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.minAmount}
                      onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={actionLoading === 'form'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Máximo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maxAmount}
                      onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={actionLoading === 'form'}
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={actionLoading === 'form'}
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Taxa ativa
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={actionLoading === 'form'}
                  >
                    Cancelar
                  </button>
                  <LoadingButton
                    type="submit"
                    loading={actionLoading === 'form'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingRate ? 'Atualizar' : 'Criar'}
                  </LoadingButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={deleteConfirm.show}
          onClose={() => setDeleteConfirm({ show: false, rate: null })}
          onConfirm={() => deleteConfirm.rate && handleDelete(deleteConfirm.rate.id)}
          itemName={deleteConfirm.rate?.categoryName || 'taxa de comissão'}
          loading={actionLoading === deleteConfirm.rate?.id}
        />
      </div>
    </div>
  );
}