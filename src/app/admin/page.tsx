'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, usePermissions, useAdminActions } from '@/store/authStore';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  Users, 
  Store, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Bell,
  Sparkles,
  Zap,
  BarChart3
} from 'lucide-react';
import StoreStatusNotifications from '@/components/notifications/StoreStatusNotifications';

// Dados mock para o dashboard
const dashboardStats = {
  totalUsers: 1247,
  totalStores: 89,
  totalProducts: 3456,
  totalOrders: 892,
  monthlyRevenue: 125430.50,
  pendingApprovals: 12,
  activeUsers: 234,
  conversionRate: 3.2
};

const recentActivities = [
  {
    id: 1,
    type: 'new_store',
    message: 'Nova loja "Tech Store" aguardando aprovação',
    time: '2 min atrás',
    status: 'pending'
  },
  {
    id: 2,
    type: 'new_user',
    message: 'Novo usuário cadastrado: Maria Silva',
    time: '15 min atrás',
    status: 'success'
  },
  {
    id: 3,
    type: 'order',
    message: 'Pedido #1234 finalizado - R$ 299,90',
    time: '1 hora atrás',
    status: 'success'
  },
  {
    id: 4,
    type: 'report',
    message: 'Produto reportado por violação de política',
    time: '2 horas atrás',
    status: 'warning'
  },
  {
    id: 5,
    type: 'payment',
    message: 'Falha no pagamento - Pedido #1235',
    time: '3 horas atrás',
    status: 'error'
  }
];

const quickActions = [
  {
    title: 'Aprovar Lojas',
    description: '12 lojas aguardando aprovação',
    icon: Store,
    color: 'bg-blue-500',
    href: '/admin/store-approval'
  },
  {
    title: 'Moderar Reviews',
    description: 'Gerenciar avaliações e reports',
    icon: Eye,
    color: 'bg-orange-500',
    href: '/admin/moderation'
  },
  {
    title: 'Gerenciar Usuários',
    description: 'Visualizar e gerenciar usuários',
    icon: Users,
    color: 'bg-green-500',
    href: '/admin/users'
  },
  {
    title: 'Analytics Globais',
    description: 'Ver relatórios detalhados',
    icon: BarChart3,
    color: 'bg-purple-500',
    href: '/admin/analytics'
  }
];

// testNotifications será definido dentro do componente

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const { isAdmin } = usePermissions();
  const { 
    stats, 
    fetchUserStats, 
    canViewStats,
    users,
    fetchUsers,
    canManageUsers 
  } = useAdminActions();
  const { notifySuccess, notifyInfo, notifyWarning } = useNotifications();

  const testNotifications = [
    {
      title: 'Testar Notificação de Sucesso',
      description: 'Simular uma notificação de sucesso',
      action: () => notifySuccess('Teste de Sucesso', 'Esta é uma notificação de teste de sucesso!'),
      icon: Sparkles,
      color: 'bg-green-500'
    },
    {
      title: 'Testar Notificação de Info',
      description: 'Simular uma notificação informativa',
      action: () => notifyInfo('Informação', 'Esta é uma notificação informativa de teste.'),
      icon: Bell,
      color: 'bg-blue-500'
    },
    {
      title: 'Testar Notificação de Aviso',
      description: 'Simular uma notificação de aviso',
      action: () => notifyWarning('Atenção', 'Esta é uma notificação de aviso de teste.'),
      icon: AlertTriangle,
      color: 'bg-yellow-500'
    },
    {
      title: 'Iniciar Simulação em Tempo Real',
      description: 'Ativar notificações automáticas aleatórias',
      action: () => {
        notifySuccess('Simulação Ativada', 'Notificações em tempo real foram ativadas!');
      },
      icon: Zap,
      color: 'bg-indigo-500'
    },
  ];

  const router = useRouter();

  useEffect(() => {
    // Verificar autenticação e permissões
    if (!user || !isAdmin) {
      router.replace('/');
      return;
    }
    
    // Carregar dados do admin
    if (canViewStats && fetchUserStats) {
      fetchUserStats();
    }
    if (canManageUsers && fetchUsers) {
      fetchUsers();
    }
  }, [user, isAdmin, canViewStats, canManageUsers, fetchUserStats, fetchUsers, router]);

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_store': return Store;
      case 'new_user': return Users;
      case 'order': return ShoppingCart;
      case 'report': return AlertTriangle;
      case 'payment': return DollarSign;
      default: return CheckCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
              <p className="text-gray-600">Bem-vindo, {user.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Eye className="h-4 w-4" />
                <span>{dashboardStats.activeUsers} usuários online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers?.toLocaleString() || dashboardStats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Store className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Lojas Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalStores}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Produtos</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalProducts.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {dashboardStats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Ações Rápidas</h3>
              </div>
              <div className="p-6 space-y-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => router.push(action.href)}
                      className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">{action.title}</p>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Atividades Recentes</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{activity.message}</p>
                          <div className="flex items-center mt-1">
                            <Clock className="h-3 w-3 text-gray-400 mr-1" />
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Componente de Notificações de Status de Loja */}
        <div className="mt-8">
          <StoreStatusNotifications />
        </div>

        {/* Seção de Teste de Notificações */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Bell className="h-5 w-5 text-blue-600 mr-2" />
              Sistema de Notificações - Testes
            </h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {testNotifications.map((test, index) => {
                const Icon = test.icon;
                return (
                  <button
                    key={index}
                    onClick={test.action}
                    className="w-full flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                  >
                    <div className={`p-3 rounded-lg ${test.color} mb-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="font-medium text-gray-900 text-sm mb-1">{test.title}</p>
                    <p className="text-xs text-gray-600">{test.description}</p>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Dica:</strong> Use estes botões para testar o sistema de notificações em tempo real. 
                As notificações aparecerão como toast e também na central de notificações (ícone do sino na navbar).
              </p>
            </div>
          </div>
        </div>

        {/* Analytics Preview */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <BarChart3 className="h-5 w-5 text-indigo-600 mr-2" />
                Prévia de Analytics
              </h3>
              <button
                onClick={() => router.push('/admin/analytics')}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Ver relatório completo →
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-600">Pedidos Hoje</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalOrders}</p>
                  <div className="flex items-center justify-center text-sm text-green-600 mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>+12% vs ontem</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.conversionRate}%</p>
                  <div className="flex items-center justify-center text-sm text-green-600 mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>+0.3% vs mês passado</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-600">Aprovações Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.pendingApprovals}</p>
                  <div className="mt-1">
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Ver todas →
                    </button>
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