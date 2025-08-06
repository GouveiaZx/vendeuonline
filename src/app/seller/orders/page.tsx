'use client';

import React, { useState, useEffect } from 'react';

import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Package,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';
import { useOrders } from '@/store/orderStore';
import { OrderStatus } from '@/store/orderStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderCard } from '@/components/orders/OrderCard';
import { toast } from 'sonner';

type FilterStatus = 'all' | OrderStatus;

const SellerOrdersPage: React.FC = () => {
  const { orders, fetchOrders, updateOrderStatus, isLoading } = useOrders();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  // Filter orders for current seller (mock - in real app, filter by seller ID)
  const sellerOrders = orders; // TODO: Filter by current seller ID
  
  // Filter and sort orders
  const filteredOrders = sellerOrders
    .filter(order => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          order.id.toLowerCase().includes(searchLower) ||
          order.buyer.name.toLowerCase().includes(searchLower) ||
          order.buyer.email.toLowerCase().includes(searchLower) ||
          order.items.some(item => 
            item.product.name.toLowerCase().includes(searchLower)
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
          const urgencyScore = (order: any) => {
            if (order.status === 'paid') return 3;
            if (order.status === 'processing') return 2;
            if (order.status === 'pending') return 1;
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
    } catch (error) {
      toast.error('Erro ao atualizar status. Tente novamente.');
    }
  };
  
  const handleExportOrders = () => {
    toast.info('Funcionalidade de exportação em desenvolvimento');
  };
  
  const getStatusCounts = () => {
    const counts = {
      all: sellerOrders.length,
      pending: 0,
      paid: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };
    
    sellerOrders.forEach(order => {
      counts[order.status]++;
    });
    
    return counts;
  };
  
  const getRevenueStats = () => {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    const thisMonthOrders = sellerOrders.filter(order => 
      new Date(order.createdAt) >= thisMonth && 
      ['paid', 'processing', 'shipped', 'delivered'].includes(order.status)
    );
    
    const lastMonthOrders = sellerOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= lastMonth && orderDate < thisMonth &&
        ['paid', 'processing', 'shipped', 'delivered'].includes(order.status);
    });
    
    const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + order.total, 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.total, 0);
    
    const growth = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;
    
    return {
      thisMonth: thisMonthRevenue,
      lastMonth: lastMonthRevenue,
      growth,
      totalOrders: thisMonthOrders.length,
      uniqueCustomers: new Set(thisMonthOrders.map(order => order.buyer.email)).size
    };
  };
  
  const statusCounts = getStatusCounts();
  const revenueStats = getRevenueStats();
  
  const getStatusIcon = (status: FilterStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'paid':
      case 'processing':
        return <Package className="w-4 h-4" />;
      case 'shipped':
        return <ShoppingBag className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };
  
  const getStatusLabel = (status: FilterStatus) => {
    switch (status) {
      case 'all':
        return 'Todos';
      case 'pending':
        return 'Pendentes';
      case 'paid':
        return 'Pagos';
      case 'processing':
        return 'Em Preparação';
      case 'shipped':
        return 'Enviados';
      case 'delivered':
        return 'Entregues';
      case 'cancelled':
        return 'Cancelados';
      default:
        return status;
    }
  };
  
  const urgentOrders = sellerOrders.filter(order => 
    ['paid', 'processing'].includes(order.status)
  ).length;
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Pedidos</h1>
          <p className="text-gray-600">
            Gerencie seus pedidos, atualize status e acompanhe vendas
          </p>
          {urgentOrders > 0 && (
            <Badge variant="destructive" className="mt-2">
              {urgentOrders} pedido{urgentOrders > 1 ? 's' : ''} precisam de atenção
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button 
            variant="outline" 
            onClick={() => fetchOrders()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleExportOrders}
          >
            <Download className="w-4 h-4 mr-2" />
            Relatório
          </Button>
        </div>
      </div>
      
      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita do Mês</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {revenueStats.thisMonth.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className={`w-4 h-4 mr-1 ${
                revenueStats.growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`} />
              <span className={revenueStats.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {revenueStats.growth >= 0 ? '+' : ''}{revenueStats.growth.toFixed(1)}%
              </span>
              <span className="text-gray-600 ml-1">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pedidos do Mês</p>
                <p className="text-2xl font-bold text-gray-900">
                  {revenueStats.totalOrders}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Ticket médio: R$ {revenueStats.totalOrders > 0 
                ? (revenueStats.thisMonth / revenueStats.totalOrders).toFixed(2) 
                : '0.00'
              }
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes Únicos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {revenueStats.uniqueCustomers}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Este mês
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ações Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {urgentOrders}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Precisam de atenção
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {(['all', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'] as FilterStatus[]).map((status) => (
          <Card 
            key={status}
            className={`cursor-pointer transition-all hover:shadow-md ${
              statusFilter === status ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
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
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="quarter">Últimos 3 meses</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Ordenar por" />
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
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                ? 'Nenhum pedido encontrado' 
                : 'Nenhum pedido ainda'
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Tente ajustar os filtros para encontrar os pedidos.'
                : 'Quando você receber pedidos, eles aparecerão aqui.'
              }
            </p>
            <Button 
              onClick={() => {
                if (searchTerm || statusFilter !== 'all' || dateFilter !== 'all') {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateFilter('all');
                } else {
                  // TODO: Implement navigation to products
                  console.log('Navigate to products');
                }
              }}
            >
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Limpar Filtros'
                : 'Gerenciar Produtos'
              }
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              viewType="seller"
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
          
          {/* Load More Button (for pagination in the future) */}
          {filteredOrders.length >= 10 && (
            <div className="text-center pt-6">
              <Button variant="outline" disabled>
                Carregar mais pedidos
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SellerOrdersPage;