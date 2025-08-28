'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, UserPlus, Edit, Trash2, CheckCircle, XCircle, Shield, Store, User, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { DeleteConfirmDialog, StatusChangeConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingButton, ContextLoading, LoadingTable } from '@/components/ui/LoadingStates';

export default function AdminUsersPage() {
  const {
    users,
    loadingStates: { users: loading },
    error,
    filters,
    fetchUsers,
    updateUserStatus,
    deleteUser,
    setFilters,
    clearError
  } = useAuthStore(); // TODO: Implementar useUserStore específico
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; user: any | null }>({ show: false, user: null });
  const [statusConfirm, setStatusConfirm] = useState<{ show: boolean; user: any | null; newStatus: string }>({ show: false, user: null, newStatus: '' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Carregar usuários ao montar o componente
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         user.email.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' || user.status === filters.status;
    const matchesType = filters.type === 'all' || user.type === filters.type;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'inactive') => {
    setActionLoading(userId);
    try {
      // Convert to uppercase enum values expected by API
      const enumStatus = newStatus === 'active' ? 'ACTIVE' : 'INACTIVE';
      await updateUserStatus(userId, enumStatus);
      toast.success(`Status do usuário atualizado para ${newStatus === 'active' ? 'ativo' : 'inativo'}`);
      setStatusConfirm({ show: false, user: null, newStatus: '' });
    } catch (error) {
      toast.error('Erro ao atualizar status do usuário');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await deleteUser(userId);
      toast.success('Usuário excluído com sucesso');
      setDeleteConfirm({ show: false, user: null });
    } catch (error) {
      toast.error('Erro ao excluir usuário');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearchChange = (value: string) => {
    setFilters({ search: value });
  };

  const handleStatusFilterChange = (value: string) => {
    setFilters({ status: value });
  };

  const handleTypeFilterChange = (value: string) => {
    setFilters({ type: value });
  };

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'ADMIN': return <Shield className="h-4 w-4 text-purple-600" />;
      case 'SELLER': return <Store className="h-4 w-4 text-blue-600" />;
      case 'BUYER': return <User className="h-4 w-4 text-green-600" />;
      default: return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    const statusValue = status || 'PENDING';
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-red-100 text-red-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      BANNED: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[statusValue as keyof typeof styles]}`}>
        {statusValue === 'ACTIVE' ? 'Ativo' : statusValue === 'INACTIVE' ? 'Inativo' : statusValue === 'BANNED' ? 'Banido' : 'Pendente'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Usuários</h1>
          <p className="text-gray-600">Gerencie todos os usuários da plataforma Vendeu Online</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="text-red-800 font-medium">Erro ao carregar usuários</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => {
                  clearError();
                  fetchUsers();
                }}
                className="ml-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="pending">Pendente</option>
            </select>

            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => handleTypeFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="all">Todos os Tipos</option>
              <option value="buyer">Comprador</option>
              <option value="seller">Vendedor</option>
              <option value="admin">Administrador</option>
            </select>

            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <UserPlus className="h-4 w-4" />
              Novo Usuário
            </button>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <LoadingTable 
            columns={6} 
            rows={5}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estatísticas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium mb-2">Nenhum usuário encontrado</p>
                          <p className="text-sm">Tente ajustar os filtros de busca</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getUserTypeIcon(user.type)}
                        <span className="text-sm text-gray-900 capitalize">
                          {user.type === 'BUYER' ? 'Comprador' : 
                           user.type === 'SELLER' ? 'Vendedor' : 'Administrador'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {user.storeCount !== undefined && (
                          <div>Lojas: {user.storeCount}</div>
                        )}
                        <div>Pedidos: {user.orderCount || 0}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin || new Date()).toLocaleDateString('pt-BR') : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button 
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={loading}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <LoadingButton
                          variant="ghost"
                          size="sm"
                          loading={actionLoading === user.id}
                          onClick={() => setStatusConfirm({ 
                            show: true, 
                            user, 
                            newStatus: user.status === 'ACTIVE' ? 'inactive' : 'active' 
                          })}
                          className={user.status === 'ACTIVE' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                        >
                          {user.status === 'ACTIVE' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </LoadingButton>
                        <LoadingButton
                          variant="ghost"
                          size="sm"
                          loading={actionLoading === user.id}
                          onClick={() => setDeleteConfirm({ show: true, user })}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </LoadingButton>
                      </div>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Usuários Ativos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.status === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Store className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Vendedores</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.type === 'SELLER').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <XCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, user: null })}
        onConfirm={() => handleDeleteUser(deleteConfirm.user?.id)}
        itemName={deleteConfirm.user?.name || ''}
        loading={actionLoading === deleteConfirm.user?.id}
      />

      <StatusChangeConfirmDialog
        isOpen={statusConfirm.show}
        onClose={() => setStatusConfirm({ show: false, user: null, newStatus: '' })}
        onConfirm={() => handleStatusChange(statusConfirm.user?.id, statusConfirm.newStatus as 'active' | 'inactive')}
        itemName={statusConfirm.user?.name || ''}
        newStatus={statusConfirm.newStatus === 'active' ? 'ativo' : 'inativo'}
        loading={actionLoading === statusConfirm.user?.id}
      />
    </div>
  );
}