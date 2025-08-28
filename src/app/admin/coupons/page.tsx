'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, MoreVertical, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Coupon, CouponFilter, CouponType, CouponStatus } from '@/types';
import { formatters } from '@/utils/formatters';

interface CouponsPageState {
  coupons: Coupon[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  filters: CouponFilter;
  searchTerm: string;
  selectedCoupons: string[];
}

export default function CouponsAdminPage() {
  const router = useRouter();
  const [state, setState] = useState<CouponsPageState>({
    coupons: [],
    loading: true,
    error: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      total: 0,
      limit: 20
    },
    filters: {},
    searchTerm: '',
    selectedCoupons: []
  });

  const [showFilters, setShowFilters] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    loadCoupons();
  }, [state.pagination.currentPage, state.filters, state.searchTerm]);

  const loadCoupons = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const params = new URLSearchParams({
        page: state.pagination.currentPage.toString(),
        limit: state.pagination.limit.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      if (state.searchTerm) {
        params.append('search', state.searchTerm);
      }

      if (state.filters.type) {
        params.append('type', state.filters.type);
      }

      if (state.filters.status) {
        params.append('status', state.filters.status);
      }

      if (state.filters.storeId) {
        params.append('storeId', state.filters.storeId);
      }

      if (state.filters.isActive !== undefined) {
        params.append('isActive', state.filters.isActive.toString());
      }

      const response = await fetch(`/api/coupons?${params}`);
      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          coupons: data.data || [],
          pagination: data.pagination || prev.pagination,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: data.error || 'Erro ao carregar cupons',
          loading: false
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
      setState(prev => ({
        ...prev,
        error: 'Erro ao carregar cupons',
        loading: false
      }));
    }
  };

  const handleSearch = (term: string) => {
    setState(prev => ({
      ...prev,
      searchTerm: term,
      pagination: { ...prev.pagination, currentPage: 1 }
    }));
  };

  const handleFilterChange = (filters: Partial<CouponFilter>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      pagination: { ...prev.pagination, currentPage: 1 }
    }));
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Tem certeza que deseja deletar este cupom?')) {
      return;
    }

    try {
      const response = await fetch(`/api/coupons?id=${couponId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await loadCoupons();
      } else {
        alert(data.error || 'Erro ao deletar cupom');
      }
    } catch (error) {
      console.error('Erro ao deletar cupom:', error);
      alert('Erro ao deletar cupom');
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
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
        await loadCoupons();
      } else {
        alert(data.error || 'Erro ao atualizar cupom');
      }
    } catch (error) {
      console.error('Erro ao atualizar cupom:', error);
      alert('Erro ao atualizar cupom');
    }
  };

  const handleExportCoupons = async () => {
    try {
      const params = new URLSearchParams();
      params.set('export', 'true');
      
      // Convert filter values to strings
      Object.entries(state.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      });

      if (state.searchTerm) {
        params.append('search', state.searchTerm);
      }

      const response = await fetch(`/api/coupons?${params}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cupons-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao exportar cupons:', error);
      alert('Erro ao exportar cupons');
    }
  };

  const getStatusBadge = (status: CouponStatus) => {
    const statusConfig = {
      active: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
      expired: { label: 'Expirado', className: 'bg-red-100 text-red-800' },
      used: { label: 'Usado', className: 'bg-gray-100 text-gray-800' },
      disabled: { label: 'Desabilitado', className: 'bg-yellow-100 text-yellow-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.disabled;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type: CouponType) => {
    const typeConfig = {
      percentage: { label: 'Percentual', className: 'bg-blue-100 text-blue-800' },
      fixed: { label: 'Valor Fixo', className: 'bg-purple-100 text-purple-800' },
      shipping: { label: 'Frete Grátis', className: 'bg-green-100 text-green-800' }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.fixed;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Cupons</h1>
          <p className="mt-2 text-gray-600">Gerencie cupons de desconto da plataforma</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar cupons..."
                  value={state.searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                Filtros
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleExportCoupons}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
              
              <button
                onClick={() => router.push('/admin/coupons/new')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Novo Cupom
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo
                  </label>
                  <select
                    value={state.filters.type || ''}
                    onChange={(e) => handleFilterChange({ type: e.target.value as CouponType || undefined })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos os tipos</option>
                    <option value="percentage">Percentual</option>
                    <option value="fixed">Valor Fixo</option>
                    <option value="shipping">Frete Grátis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={state.filters.status || ''}
                    onChange={(e) => handleFilterChange({ status: e.target.value as CouponStatus || undefined })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos os status</option>
                    <option value="active">Ativo</option>
                    <option value="expired">Expirado</option>
                    <option value="used">Usado</option>
                    <option value="disabled">Desabilitado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ativo
                  </label>
                  <select
                    value={state.filters.isActive?.toString() || ''}
                    onChange={(e) => handleFilterChange({ 
                      isActive: e.target.value === '' ? undefined : e.target.value === 'true' 
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setState(prev => ({
                        ...prev,
                        filters: {},
                        pagination: { ...prev.pagination, currentPage: 1 }
                      }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {state.loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando cupons...</p>
            </div>
          ) : state.error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{state.error}</p>
              <button
                onClick={loadCoupons}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tentar Novamente
              </button>
            </div>
          ) : state.coupons.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Nenhum cupom encontrado</p>
              <button
                onClick={() => router.push('/admin/coupons/new')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Criar Primeiro Cupom
              </button>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Desconto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Validade
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
                    {state.coupons.map((coupon) => (
                      <tr key={coupon.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {coupon.code}
                            </div>
                            <div className="text-sm text-gray-500">
                              {coupon.description}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTypeBadge(coupon.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {coupon.type === 'percentage'
                            ? `${coupon.value}%`
                            : coupon.type === 'fixed_amount'
                            ? formatters.formatCurrency(coupon.value)
                            : 'Frete Grátis'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {coupon.usedCount || 0}
                          {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {coupon.endDate
                            ? formatters.formatDate(coupon.endDate)
                            : 'Sem expiração'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(coupon.isActive ? 'active' : 'inactive')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="relative">
                            <button
                              onClick={() => setActionMenuOpen(
                                actionMenuOpen === coupon.id ? null : coupon.id
                              )}
                              className="p-2 hover:bg-gray-100 rounded-full"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {actionMenuOpen === coupon.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      router.push(`/admin/coupons/${coupon.id}`);
                                      setActionMenuOpen(null);
                                    }}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Visualizar
                                  </button>
                                  <button
                                    onClick={() => {
                                      router.push(`/admin/coupons/${coupon.id}/edit`);
                                      setActionMenuOpen(null);
                                    }}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleToggleActive(coupon);
                                      setActionMenuOpen(null);
                                    }}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    {coupon.isActive ? 'Desativar' : 'Ativar'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDeleteCoupon(coupon.id);
                                      setActionMenuOpen(null);
                                    }}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Deletar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {state.pagination.totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {((state.pagination.currentPage - 1) * state.pagination.limit) + 1} a{' '}
                    {Math.min(state.pagination.currentPage * state.pagination.limit, state.pagination.total)} de{' '}
                    {state.pagination.total} cupons
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setState(prev => ({
                        ...prev,
                        pagination: { ...prev.pagination, currentPage: prev.pagination.currentPage - 1 }
                      }))}
                      disabled={state.pagination.currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      {state.pagination.currentPage} de {state.pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setState(prev => ({
                        ...prev,
                        pagination: { ...prev.pagination, currentPage: prev.pagination.currentPage + 1 }
                      }))}
                      disabled={state.pagination.currentPage === state.pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}