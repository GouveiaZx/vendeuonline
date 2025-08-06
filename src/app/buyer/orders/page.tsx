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
  XCircle
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

const BuyerOrdersPage: React.FC = () => {
  const { orders, fetchOrders, cancelOrder, isLoading } = useOrders();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          order.id.toLowerCase().includes(searchLower) ||
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
        default:
          return 0;
      }
    });
  
  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      toast.success('Pedido cancelado com sucesso!');
    } catch (error) {
      toast.error('Erro ao cancelar pedido. Tente novamente.');
    }
  };
  
  const handleExportOrders = () => {
    toast.info('Funcionalidade de exportação em desenvolvimento');
  };
  
  const getStatusCounts = () => {
    const counts = {
      all: orders.length,
      pending: 0,
      paid: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };
    
    orders.forEach(order => {
      counts[order.status]++;
    });
    
    return counts;
  };
  
  const statusCounts = getStatusCounts();
  
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
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Pedidos</h1>
          <p className="text-gray-600">
            Acompanhe o status dos seus pedidos e histórico de compras
          </p>
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
            Exportar
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
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
                  placeholder="Buscar por número do pedido ou produto..."
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
                : 'Você ainda não fez nenhum pedido'
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Tente ajustar os filtros para encontrar seus pedidos.'
                : 'Que tal começar explorando nossos produtos?'
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
                : 'Explorar Produtos'
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
              viewType="buyer"
              onCancel={handleCancelOrder}
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

export default BuyerOrdersPage;