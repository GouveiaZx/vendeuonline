'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { OrderCard } from '@/components/orders/OrderCard';

import { useOrders } from '@/store/orderStore';
import { Order as GlobalOrder, OrderStatus as GlobalOrderStatus, OrderItem as GlobalOrderItem, PaymentMethod, Address } from '@/types';
import { Order, OrderStatus, OrderItem } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';
import { Search, Package, Clock, CheckCircle, XCircle, Truck, DollarSign } from 'lucide-react';

type FilterStatus = 'all' | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface AdvancedFilters {
  paymentMethod?: string;
  state?: string;
  productId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

const SellerOrdersPage: React.FC = () => {
  const { orders, fetchOrders, updateOrderStatus, isLoading } = useOrders();
  const { notifySuccess, notifyInfo } = useNotifications();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const { user } = useAuthStore();
  const sellerId = user?.id;
  const sellerOrders = sellerId ? orders.filter((order) =>
    order.items.some(item => item.sellerId === sellerId)
  ) : [];
  
  // Filter and sort orders
  const filteredOrders = sellerOrders
    .filter(order => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          order.id.toLowerCase().includes(searchLower) ||
          order.items.some((item) => 
            item.product?.name.toLowerCase().includes(searchLower)
          );
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }
      
      // Date filter
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        const diffTime = now.getTime() - orderDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case 'week':
            if (diffDays > 7) return false;
            break;
          case 'month':
            if (diffDays > 30) return false;
            break;
          case 'quarter':
            if (diffDays > 90) return false;
            break;
        }
      }
      
      // Value filters
      if (minValue && order.total < parseFloat(minValue)) {
        return false;
      }
      
      if (maxValue && order.total > parseFloat(maxValue)) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'value-high':
          return b.total - a.total;
        case 'value-low':
          return a.total - b.total;
        case 'urgent':
          // Prioritize paid orders that need processing
          const urgencyScore = (order: Order) => {
            if (order.status === 'CONFIRMED') return 3;
            if (order.status === 'PROCESSING') return 2;
            if (order.status === 'PENDING') return 1;
            return 0;
          };
          return urgencyScore(b) - urgencyScore(a);
        default:
          return 0;
      }
    });
  
  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success('Status do pedido atualizado com sucesso!');
      
      // Notificar cliente sobre mudanças importantes de status
      switch (status) {
        case 'PROCESSING':
          notifyInfo(
            'Pedido em Preparação',
            `O pedido #${orderId.slice(-8)} está sendo preparado para envio.`,
            {
              action: {
                label: 'Acompanhar Pedido',
                onClick: () => window.location.href = '/buyer/orders'
              }
            }
          );
          break;
        case 'SHIPPED':
          notifySuccess(
            'Pedido Enviado!',
            `O pedido #${orderId.slice(-8)} foi enviado e está a caminho.`,
            {
              action: {
                label: 'Rastrear Pedido',
                onClick: () => window.location.href = '/buyer/orders'
              }
            }
          );
          break;
        case 'DELIVERED':
          notifySuccess(
            'Pedido Entregue!',
            `O pedido #${orderId.slice(-8)} foi entregue com sucesso.`,
            {
              action: {
                label: 'Avaliar Compra',
                onClick: () => window.location.href = '/buyer/orders'
              }
            }
          );
          break;
      }
    } catch (error) {
      toast.error('Erro ao atualizar status do pedido');
    }
  };

  const handleExportOrders = () => {
    const csvContent = [
      ['ID', 'Vendedor ID', 'Status', 'Total', 'Data'].join(','),
      ...filteredOrders.map((order) => [
          order.id,
          order.items[0]?.sellerId || '',
          order.status,
          order.total.toFixed(2),
          new Date(order.createdAt).toLocaleDateString('pt-BR')
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pedidos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setMinValue('');
    setMaxValue('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const removeFilter = (filterType: string) => {
    switch (filterType) {
      case 'search':
        setSearchTerm('');
        break;
      case 'status':
        setStatusFilter('all');
        break;
      case 'date':
        setDateFilter('all');
        break;
      case 'minValue':
        setMinValue('');
        break;
      case 'maxValue':
        setMaxValue('');
        break;
    }
  };

  // Status counts
  const statusCounts = {
    all: sellerOrders.length,
    PENDING: sellerOrders.filter((o: Order) => o.status === 'PENDING').length,
    CONFIRMED: sellerOrders.filter((o: Order) => o.status === 'CONFIRMED').length,
    PROCESSING: sellerOrders.filter((o: Order) => o.status === 'PROCESSING').length,
    SHIPPED: sellerOrders.filter((o: Order) => o.status === 'SHIPPED').length,
    DELIVERED: sellerOrders.filter((o: Order) => o.status === 'DELIVERED').length,
    CANCELLED: sellerOrders.filter((o: Order) => o.status === 'CANCELLED').length,
  };

  const getStatusIcon = (status: FilterStatus) => {
    switch (status) {
      case 'all': return <Package className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'CONFIRMED': return <DollarSign className="w-4 h-4" />;
      case 'PROCESSING': return <Package className="w-4 h-4" />;
      case 'SHIPPED': return <Truck className="w-4 h-4" />;
      case 'DELIVERED': return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: FilterStatus) => {
    switch (status) {
      case 'all': return 'Todos';
      case 'PENDING': return 'Pendentes';
      case 'CONFIRMED': return 'Confirmados';
      case 'PROCESSING': return 'Processando';
      case 'SHIPPED': return 'Enviados';
      case 'DELIVERED': return 'Entregues';
      case 'CANCELLED': return 'Cancelados';
      default: return status;
    }
  };

  const getStatusColor = (status: FilterStatus) => {
    switch (status) {
      case 'all': return 'bg-gray-50 border-gray-200';
      case 'PENDING': return 'bg-yellow-50 border-yellow-200';
      case 'CONFIRMED': return 'bg-green-50 border-green-200';
      case 'PROCESSING': return 'bg-blue-50 border-blue-200';
      case 'SHIPPED': return 'bg-purple-50 border-purple-200';
      case 'DELIVERED': return 'bg-emerald-50 border-emerald-200';
      case 'CANCELLED': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Pedidos</h1>
          <p className="text-gray-600 mt-2">
            Gerencie todos os pedidos da sua loja
          </p>
        </div>
        <Button onClick={handleExportOrders} variant="outline">
          Exportar Pedidos
        </Button>
      </div>
      
      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {(['all', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const).map((status) => (
          <Card
            key={status}
            className={`cursor-pointer transition-all hover:shadow-md ${
              statusFilter === status ? 'ring-2 ring-blue-500' : ''
            } ${getStatusColor(status)}`}
            onClick={() => setStatusFilter(status)}
          >
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2 text-gray-600">
                {getStatusIcon(status)}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {statusCounts[status]}
              </div>
              <div className="text-xs text-gray-600">
                {getStatusLabel(status)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por pedido, cliente ou produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="quarter">Últimos 3 meses</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Min Value */}
            <div className="w-full md:w-32">
              <Input
                type="number"
                placeholder="Valor mín."
                value={minValue}
                onChange={(e) => setMinValue(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            
            {/* Max Value */}
            <div className="w-full md:w-32">
              <Input
                type="number"
                placeholder="Valor máx."
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Mais urgentes</SelectItem>
                <SelectItem value="newest">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigos</SelectItem>
                <SelectItem value="value-high">Maior valor</SelectItem>
                <SelectItem value="value-low">Menor valor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Orders List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        </div>
      ) : paginatedOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 text-gray-300 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              Tente ajustar os filtros para encontrar os pedidos.
            </p>
            <Button onClick={clearAllFilters}>
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {paginatedOrders.map((order: Order) => {
            const globalOrder: GlobalOrder = {
              id: order.id,
              buyerId: order.buyerId,
              sellerId: order.items[0]?.sellerId || '',
              items: order.items.map(item => ({
                id: item.id,
                orderId: order.id,
                productId: item.productId,
                productName: item.product?.name || 'Produto',
                productImage: item.product?.image || '',
                price: item.price,
                quantity: item.quantity,
                total: item.subtotal || (item.price * item.quantity),
                specifications: []
              })),
              subtotal: order.subtotal,
              shipping: order.shippingCost || order.shipping,
              tax: 0,
              discount: 0,
              total: order.total,
              status: order.status as GlobalOrderStatus,
              paymentMethod: (order.paymentMethod || 'credit_card') as PaymentMethod,
              paymentStatus: order.status === 'CONFIRMED' ? 'PAID' : 'PENDING',
              shippingAddress: {
                id: order.shippingAddress.id || `addr_${order.id}_shipping`,
                buyerId: order.buyerId,
                name: order.shippingAddress.name,
                street: order.shippingAddress.street,
                number: order.shippingAddress.number,
                complement: order.shippingAddress.complement,
                neighborhood: order.shippingAddress.neighborhood,
                city: order.shippingAddress.city,
                state: order.shippingAddress.state,
                zipCode: order.shippingAddress.zipCode,
                isDefault: false,
                createdAt: new Date().toISOString()
              },
              billingAddress: {
                id: order.shippingAddress.id || `addr_${order.id}_billing`,
                buyerId: order.buyerId,
                name: order.shippingAddress.name,
                street: order.shippingAddress.street,
                number: order.shippingAddress.number,
                complement: order.shippingAddress.complement,
                neighborhood: order.shippingAddress.neighborhood,
                city: order.shippingAddress.city,
                state: order.shippingAddress.state,
                zipCode: order.shippingAddress.zipCode,
                isDefault: false,
                createdAt: new Date().toISOString()
              },
              trackingCode: order.trackingCode,
              notes: order.notes,
              createdAt: typeof order.createdAt === 'string' ? order.createdAt : new Date(order.createdAt).toISOString(),
              updatedAt: typeof order.updatedAt === 'string' ? order.updatedAt : new Date(order.updatedAt).toISOString()
            };
            
            return (
              <OrderCard
                key={order.id}
                order={globalOrder}
                viewType="seller"
                onStatusUpdate={(orderId: string, status: GlobalOrderStatus) => {
                   // Mapear GlobalOrderStatus para OrderStatus de orderStore
                   const statusMapping: Record<GlobalOrderStatus, OrderStatus> = {
                     'PENDING': 'PENDING',
                     'CONFIRMED': 'CONFIRMED',
                     'PROCESSING': 'PROCESSING', 
                     'SHIPPED': 'SHIPPED',
                     'DELIVERED': 'DELIVERED',
                     'CANCELLED': 'CANCELLED',
                     'REFUNDED': 'CANCELLED'
                   };
                   const mappedStatus = statusMapping[status];
                   handleStatusUpdate(orderId, mappedStatus);
                 }}
              />
            );
          })}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SellerOrdersPage;