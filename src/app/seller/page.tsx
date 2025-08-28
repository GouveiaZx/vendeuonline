'use client';

import { useEffect } from 'react';
import { useAuthStore, useSellerActions, usePermissions } from '@/store/authStore';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Eye,
  Star,
  MessageCircle,
  Plus,
  BarChart3,
  Settings,
  Users,
  Clock,
  FileText,
  Bell
} from 'lucide-react';
import StoreStatusNotifications from '@/components/notifications/StoreStatusNotifications';
import { useStoreNotificationsForUser } from '@/hooks/useStoreNotifications';

// Dados mock para o dashboard do vendedor
const sellerStats = {
  totalProducts: 45,
  totalOrders: 128,
  monthlyRevenue: 8750.30,
  storeViews: 2340,
  averageRating: 4.7,
  totalReviews: 89,
  pendingOrders: 5,
  lowStockProducts: 3
};

const recentOrders = [
  {
    id: '#1234',
    customer: 'Maria Silva',
    product: 'Smartphone Samsung Galaxy',
    value: 899.90,
    status: 'pending',
    time: '2 min atrás'
  },
  {
    id: '#1233',
    customer: 'João Santos',
    product: 'Fone de Ouvido Bluetooth',
    value: 199.90,
    status: 'processing',
    time: '15 min atrás'
  },
  {
    id: '#1232',
    customer: 'Ana Costa',
    product: 'Carregador Portátil',
    value: 89.90,
    status: 'shipped',
    time: '1 hora atrás'
  },
  {
    id: '#1231',
    customer: 'Pedro Lima',
    product: 'Cabo USB-C',
    value: 29.90,
    status: 'delivered',
    time: '2 horas atrás'
  }
];

const topProducts = [
  {
    id: 1,
    name: 'Smartphone Samsung Galaxy',
    sales: 23,
    revenue: 20677.70,
    stock: 12
  },
  {
    id: 2,
    name: 'Fone de Ouvido Bluetooth',
    sales: 18,
    revenue: 3598.20,
    stock: 5
  },
  {
    id: 3,
    name: 'Carregador Portátil',
    sales: 15,
    revenue: 1348.50,
    stock: 0
  }
];

const getQuickActions = (unreadCount: number) => [
  {
    title: 'Adicionar Produto',
    description: 'Cadastrar novo produto',
    icon: Plus,
    color: 'bg-blue-500',
    href: '/seller/products/new'
  },
  {
    title: 'Gerenciar Pedidos',
    description: '5 pedidos pendentes',
    icon: ShoppingCart,
    color: 'bg-green-500',
    href: '/seller/orders'
  },
  {
    title: 'Documentos',
    description: 'Gerenciar documentos da loja',
    icon: FileText,
    color: 'bg-indigo-500',
    href: '/seller/documents'
  },
  {
    title: 'Notificações',
    description: 'Ver atualizações de status',
    icon: Bell,
    color: 'bg-red-500',
    href: '/seller/notifications',
    badge: unreadCount > 0 ? unreadCount.toString() : undefined
  },
  {
    title: 'Ver Analytics',
    description: 'Relatórios de vendas',
    icon: BarChart3,
    color: 'bg-purple-500',
    href: '/seller/analytics'
  },
  {
    title: 'Configurar Loja',
    description: 'Personalizar sua loja',
    icon: Settings,
    color: 'bg-orange-500',
    href: '/seller/settings'
  }
];

export default function SellerDashboard() {
  const { user } = useAuthStore();
  const { isSeller } = usePermissions();
  const {
    storeName,
    rating,
    totalSales,
    plan,
    isVerified,
    storeData,
    hasStore,
    isUpdating
  } = useSellerActions();
  const { notifications, unreadCount } = useStoreNotificationsForUser(user?.id || '');

  useEffect(() => {
    // Verificar autenticação e tipo de usuário
    if (!user || !isSeller) {
      window.location.href = '/';
    }
  }, [user, isSeller]);

  if (!user || !isSeller) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'shipped': return 'text-purple-600 bg-purple-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'processing': return 'Processando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregue';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Painel do Vendedor</h1>
              <p className="text-gray-600">Bem-vindo, {user.name} - {storeName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => window.location.href = '/seller/notifications'}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => window.location.href = `/loja/${storeName?.toLowerCase().replace(/\s+/g, '-') || 'minha-loja'}`}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <Eye className="h-4 w-4" />
                <span>Ver minha loja</span>
              </button>
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
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Produtos</p>
                <p className="text-2xl font-bold text-gray-900">{sellerStats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">{sellerStats.totalOrders}</p>
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
                  R$ {sellerStats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Visualizações</p>
                <p className="text-2xl font-bold text-gray-900">{sellerStats.storeViews.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Store Status Notifications */}
         <StoreStatusNotifications 
           userId={user?.id}
           showUnreadOnly={false}
           maxItems={5}
         />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Ações Rápidas</h3>
              </div>
              <div className="p-6 space-y-4">
                {getQuickActions(unreadCount).map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => window.location.href = action.href}
                      className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg ${action.color}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <p className="font-medium text-gray-900">{action.title}</p>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                      </div>
                      {action.badge && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          {action.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Store Performance */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Performance da Loja</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 mr-2" />
                    <span className="text-sm text-gray-600">Avaliação</span>
                  </div>
                  <span className="font-medium">{sellerStats.averageRating}/5.0</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageCircle className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">Avaliações</span>
                  </div>
                  <span className="font-medium">{sellerStats.totalReviews}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Visualizações</span>
                  </div>
                  <span className="font-medium">{sellerStats.storeViews}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Pedidos Recentes</h3>
                  <button 
                    onClick={() => window.location.href = '/seller/orders'}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Ver todos →
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900">{order.id}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                            {getOrderStatusText(order.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{order.customer}</p>
                        <p className="text-sm text-gray-500">{order.product}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="font-medium text-green-600">
                            R$ {order.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {order.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Produtos Mais Vendidos</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.sales} vendas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          R$ {product.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className={`text-sm ${
                          product.stock === 0 ? 'text-red-600' : 
                          product.stock < 10 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {product.stock === 0 ? 'Sem estoque' : `${product.stock} em estoque`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(sellerStats.pendingOrders > 0 || sellerStats.lowStockProducts > 0) && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {sellerStats.pendingOrders > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center">
                  <ShoppingCart className="h-6 w-6 text-yellow-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Pedidos Pendentes</h4>
                    <p className="text-sm text-yellow-700">
                      Você tem {sellerStats.pendingOrders} pedidos aguardando processamento
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => window.location.href = '/seller/orders?status=pending'}
                  className="mt-3 text-sm text-yellow-800 hover:text-yellow-900 font-medium"
                >
                  Ver pedidos →
                </button>
              </div>
            )}
            
            {sellerStats.lowStockProducts > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center">
                  <Package className="h-6 w-6 text-red-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-red-800">Estoque Baixo</h4>
                    <p className="text-sm text-red-700">
                      {sellerStats.lowStockProducts} produtos com estoque baixo ou zerado
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => window.location.href = '/seller/products?filter=low-stock'}
                  className="mt-3 text-sm text-red-800 hover:text-red-900 font-medium"
                >
                  Ver produtos →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}