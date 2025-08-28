'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  Search, 
  Filter, 
  Package,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  Calendar,
  ExternalLink,
  RefreshCw,
  Download,
  Bell,
  MessageCircle,
  Map,
  AlertTriangle
} from 'lucide-react';
import { useOrders } from '@/store/orderStore';
import { Order, OrderStatus } from '@/types';
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
  const { notifySuccess, notifyInfo, notifyWarning } = useNotifications();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [trackingNotifications, setTrackingNotifications] = useState<Record<string, any[]>>({});
  const [showMap, setShowMap] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Subscribe to real-time tracking updates
  useEffect(() => {
    const subscribeToTrackingUpdates = () => {
      // Simulate real-time updates from carrier APIs
      const interval = setInterval(() => {
        orders.forEach(order => {
          if (order.status === 'SHIPPED' && order.trackingCode) {
            // Simulate tracking updates
            const newNotification = {
              id: Date.now(),
              orderId: order.id,
              message: `Atualização de rastreamento para pedido #${order.id.slice(-8)}`,
              timestamp: new Date().toISOString(),
              location: 'Centro de Distribuição',
              status: 'Em trânsito',
              type: 'tracking_update'
            };
            
            setTrackingNotifications(prev => ({
              ...prev,
              [order.id]: [...(prev[order.id] || []), newNotification]
            }));
          }
        });
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    };

    const unsubscribe = subscribeToTrackingUpdates();
    return unsubscribe;
  }, [orders]);
  
  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          order.id.toLowerCase().includes(searchLower) ||
          order.items.some(item => 
            item.productName.toLowerCase().includes(searchLower)
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
      
      // Notificar sobre o cancelamento
      notifyWarning(
        'Pedido Cancelado',
        `Seu pedido #${orderId.slice(-8)} foi cancelado. O reembolso será processado em até 5 dias úteis.`,
        {
          action: {
            label: 'Ver Detalhes',
            onClick: () => window.location.href = '/buyer/orders'
          }
        }
      );
    } catch (error) {
      toast.error('Erro ao cancelar pedido. Tente novamente.');
    }
  };
  
  const handleExportOrders = () => {
    toast.info('Funcionalidade de exportação em desenvolvimento');
  };

  const getCarrierTrackingUrl = (carrier: string, trackingCode: string): string => {
    const carriers: Record<string, string> = {
      'correios': `https://rastreamento.correios.com.br/app/index.php`,
      'fedex': `https://www.fedex.com/fedextrack/?trknbr=${trackingCode}`,
      'ups': `https://www.ups.com/track?tracknum=${trackingCode}`,
      'dhl': `https://www.dhl.com/br-pt/home/tracking/tracking-global-forwarding.html?AWB=${trackingCode}`,
      'jadlog': `https://www.jadlog.com.br/siteInstitucional/tracking_dev.jad`,
      'azul': `https://azulcargo.com.br/acompanhe-sua-encomenda/`,
    };
    
    return carriers[carrier.toLowerCase()] || '#';
  };

  const requestDeliveryLocation = async (orderId: string) => {
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        
        toast.success('Localização capturada com sucesso!');
        
        // Here you would send the location to the delivery service
        console.log('Delivery location:', {
          orderId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        toast.error('Erro ao obter localização. Por favor, permita o acesso à localização.');
      }
    } else {
      toast.error('Geolocalização não suportada pelo navegador.');
    }
  };

  const shareTrackingInfo = (order: Order) => {
    const shareText = `Acompanhe meu pedido #${order.id.slice(-8)} - Status: ${getStatusLabel(order.status)} ${order.trackingCode ? `- Código: ${order.trackingCode}` : ''}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Rastreamento de Pedido',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Informações de rastreamento copiadas!');
    }
  };
  
  const getStatusCounts = () => {
    const counts: Record<FilterStatus, number> = {
      all: orders.length,
      PENDING: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      REFUNDED: 0
    };
    
    orders.forEach(order => {
      if (order.status in counts) {
        counts[order.status as keyof typeof counts]++;
      }
    });
    
    return counts;
  };
  
  const statusCounts = getStatusCounts();
  
  const getStatusIcon = (status: FilterStatus): JSX.Element => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'CONFIRMED':
      case 'PROCESSING':
        return <Package className="w-4 h-4" />;
      case 'SHIPPED':
        return <Truck className="w-4 h-4" />;
      case 'DELIVERED':
        return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };
  
  const getStatusLabel = (status: FilterStatus): string => {
    switch (status) {
      case 'all':
        return 'Todos';
      case 'PENDING':
        return 'Pendentes';
      case 'CONFIRMED':
        return 'Confirmados';
      case 'PROCESSING':
        return 'Em Preparação';
      case 'SHIPPED':
        return 'Enviados';
      case 'DELIVERED':
        return 'Entregues';
      case 'CANCELLED':
        return 'Cancelados';
      case 'REFUNDED':
        return 'Reembolsados';
      default:
        return status;
    }
  };

  const TrackingTimeline = ({ order }: { order: Order }) => {
    const orderNotifications = trackingNotifications[order.id] || [];
    
    const trackingSteps = [
      {
        status: 'PENDING',
        label: 'Pedido Realizado',
        description: 'Seu pedido foi recebido',
        icon: <Clock className="w-5 h-5" />,
        timestamp: order.createdAt
      },
      {
        status: 'CONFIRMED',
        label: 'Pagamento Confirmado',
        description: 'Pagamento aprovado',
        icon: <CheckCircle className="w-5 h-5" />,
        timestamp: order.createdAt
      },
      {
        status: 'PROCESSING',
        label: 'Em Preparação',
        description: 'Pedido sendo preparado',
        icon: <Package className="w-5 h-5" />,
        timestamp: order.createdAt
      },
      {
        status: 'SHIPPED',
        label: 'Pedido Enviado',
        description: 'Saiu para entrega',
        icon: <Truck className="w-5 h-5" />,
        timestamp: order.createdAt
      },
      {
        status: 'DELIVERED',
        label: 'Entregue',
        description: 'Pedido entregue',
        icon: <MapPin className="w-5 h-5" />,
        timestamp: order.createdAt
      }
    ];

    const currentStepIndex = trackingSteps.findIndex(step => step.status === order.status);
    
    const formatDate = (date: string | Date): string => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Acompanhamento do Pedido</h3>
        
        <div className="space-y-4">
          {trackingSteps.map((step, index) => {
            const isActive = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            return (
              <div key={step.status} className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {step.icon}
                </div>
                
                <div className="flex-1">
                  <h4 className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </h4>
                  <p className={`text-sm ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                    {step.description}
                  </p>
                  
                  {isCurrent && order.trackingCode && (
                    <div className="mt-2 p-3 bg-white rounded-md border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Código de Rastreamento
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.trackingCode}
                          </p>
                        </div>
                        {order.trackingCode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => order.trackingCode && window.open(getCarrierTrackingUrl('correios', order.trackingCode), '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 space-y-4">
          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="p-4 bg-white rounded-md border">
              <h4 className="font-medium mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Endereço de Entrega
              </h4>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>Endereço: {order.shippingAddress.street}, {order.shippingAddress.number}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Previsão: {'A ser calculado'}</span>
                </div>
                {order.trackingCode && (
                  <div className="flex items-center text-sm text-gray-600">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    <a 
                      href={getCarrierTrackingUrl('correios', order.trackingCode)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Código: {order.trackingCode}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estimated Delivery */}
          {false && (
            <div className="p-4 bg-white rounded-md border">
              <h4 className="font-medium mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Previsão de Entrega
              </h4>
              <p className="text-sm text-gray-600">
                {new Date(new Date()).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .notification-item {
          animation: slideIn 0.3s ease-out;
        }
        
        .badge-pulse {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
      `}</style>
      {/* Global Notifications */}
      {Object.keys(trackingNotifications).length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-blue-900 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notificações de Rastreamento
              <Badge variant="destructive" className="ml-2">
                {Object.values(trackingNotifications).reduce((acc, notifs) => acc + notifs.length, 0)}
              </Badge>
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newNotifications = { ...trackingNotifications };
                Object.keys(newNotifications).forEach(orderId => {
                  newNotifications[orderId] = [];
                });
                setTrackingNotifications(newNotifications);
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Limpar Tudo
            </Button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {Object.entries(trackingNotifications).map(([orderId, notifications]) => 
              notifications.map(notification => (
                <div key={notification.id} className="text-sm text-blue-800 bg-white p-2 rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Pedido #{orderId.slice(-6)}:</span>
                    <span className="text-xs opacity-75">
                      {new Date(notification.timestamp).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                  <span>{notification.message}</span>
                  {notification.location && (
                    <div className="text-xs opacity-75 mt-1">
                      📍 {notification.location}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

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
        {(['all', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as FilterStatus[]).map((status) => (
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
          {filteredOrders.map((order) => {
            const hasNotifications = trackingNotifications[order.id]?.length > 0;
            
            return (
              <div key={order.id}>
                <div className="relative">
                  {hasNotifications && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge variant="destructive" className="animate-pulse">
                        <Bell className="w-3 h-3" />
                        {trackingNotifications[order.id].length}
                      </Badge>
                    </div>
                  )}
                  <OrderCard
                    order={order as any}
                    viewType="buyer"
                    onCancel={handleCancelOrder}
                  />
                </div>
                
                {selectedOrder === order.id && (
                  <div className="mt-4">
                    <TrackingTimeline order={order as any} />
                    
                    {/* Real-time notifications */}
                    {hasNotifications && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                          <Bell className="w-4 h-4 mr-2" />
                          Notificações de Rastreamento
                        </h4>
                        <div className="space-y-2">
                          {trackingNotifications[order.id].map(notification => (
                            <div key={notification.id} className="text-sm text-blue-800">
                              <div className="flex items-center justify-between">
                                <span>{notification.message}</span>
                                <span className="text-xs opacity-75">
                                  {new Date(notification.timestamp).toLocaleTimeString('pt-BR')}
                                </span>
                              </div>
                              {notification.location && (
                                <div className="text-xs opacity-75">
                                  Local: {notification.location}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(null)}
                      >
                        Fechar Detalhes
                      </Button>
                      
                      {order.trackingCode && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const url = getCarrierTrackingUrl(order.carrier || 'correios', order.trackingCode!);
                              window.open(url, '_blank');
                            }}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Rastrear Externo
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => shareTrackingInfo(order as any)}
                          >
                            Compartilhar
                          </Button>
                          
                          {order.status === 'SHIPPED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => requestDeliveryLocation(order.id)}
                            >
                              <Map className="w-4 h-4 mr-2" />
                              Solicitar Entrega
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
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