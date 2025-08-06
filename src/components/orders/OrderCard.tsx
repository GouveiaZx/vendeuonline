'use client';

import React from 'react';
import { 
  Eye, 
  Package, 
  Truck, 
  MessageCircle, 
  MoreVertical,
  Download,
  RefreshCw,
  X
} from 'lucide-react';
import { Order, OrderStatus } from '@/store/orderStore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge, StatusProgress } from './StatusBadge';
import { toast } from 'sonner';

interface OrderCardProps {
  order: Order;
  viewType: 'buyer' | 'seller';
  onStatusUpdate?: (orderId: string, status: OrderStatus) => void;
  onCancel?: (orderId: string) => void;
  className?: string;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  viewType,
  onStatusUpdate,
  onCancel,
  className = ''
}) => {

  
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const getStatusActions = (status: OrderStatus) => {
    if (viewType === 'seller') {
      switch (status) {
        case 'paid':
          return [{ label: 'Marcar como Em Preparação', action: 'processing' }];
        case 'processing':
          return [{ label: 'Marcar como Enviado', action: 'shipped' }];
        case 'shipped':
          return [{ label: 'Marcar como Entregue', action: 'delivered' }];
        default:
          return [];
      }
    } else {
      // Buyer actions
      switch (status) {
        case 'pending':
        case 'paid':
          return [{ label: 'Cancelar Pedido', action: 'cancelled', destructive: true }];
        case 'delivered':
          return [{ label: 'Avaliar Pedido', action: 'review' }];
        default:
          return [];
      }
    }
  };
  
  const handleAction = (action: string) => {
    switch (action) {
      case 'view':
        // TODO: Implement order details view
        console.log('View order:', order.id);
        break;
      case 'track':
        if (order.trackingCode) {
          window.open(`https://rastreamento.correios.com.br/app/index.php?codigo=${order.trackingCode}`, '_blank');
        } else {
          toast.info('Código de rastreamento ainda não disponível');
        }
        break;
      case 'contact':
        const phone = viewType === 'buyer' ? '5454999999999' : order.buyer.email;
        const message = `Olá! Gostaria de falar sobre o pedido #${order.id}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
        break;
      case 'download':
        toast.info('Funcionalidade de download em desenvolvimento');
        break;
      case 'cancelled':
        if (onCancel) {
          onCancel(order.id);
        }
        break;
      case 'review':
        // TODO: Implement order review
        console.log('Review order:', order.id);
        break;
      default:
        if (onStatusUpdate && ['processing', 'shipped', 'delivered'].includes(action)) {
          onStatusUpdate(order.id, action as OrderStatus);
        }
    }
  };
  
  const statusActions = getStatusActions(order.status);
  const canCancel = ['pending', 'paid'].includes(order.status);
  const canTrack = ['shipped', 'delivered'].includes(order.status);
  
  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="font-semibold text-lg">Pedido #{order.id.slice(-8)}</h3>
              <StatusBadge status={order.status} size="sm" />
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>📅 {formatDate(order.createdAt)}</span>
              <span>💰 R$ {order.total.toFixed(2)}</span>
              <span>📦 {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</span>
            </div>
            
            {viewType === 'seller' && (
              <div className="mt-2 text-sm text-gray-600">
                <span>👤 Cliente: {order.buyer.name}</span>
              </div>
            )}
          </div>
          
          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAction('view')}>
                <Eye className="w-4 h-4 mr-2" />
                Ver Detalhes
              </DropdownMenuItem>
              
              {canTrack && (
                <DropdownMenuItem onClick={() => handleAction('track')}>
                  <Truck className="w-4 h-4 mr-2" />
                  Rastrear Pedido
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => handleAction('contact')}>
                <MessageCircle className="w-4 h-4 mr-2" />
                {viewType === 'buyer' ? 'Contatar Vendedor' : 'Contatar Cliente'}
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => handleAction('download')}>
                <Download className="w-4 h-4 mr-2" />
                Baixar Comprovante
              </DropdownMenuItem>
              
              {statusActions.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  {statusActions.map((action, index) => (
                    <DropdownMenuItem 
                      key={index}
                      onClick={() => handleAction(action.action)}
                      className={action.destructive ? 'text-red-600' : ''}
                    >
                      {action.action === 'processing' && <Package className="w-4 h-4 mr-2" />}
                      {action.action === 'shipped' && <Truck className="w-4 h-4 mr-2" />}
                      {action.action === 'delivered' && <Package className="w-4 h-4 mr-2" />}
                      {action.action === 'cancelled' && <X className="w-4 h-4 mr-2" />}
                      {action.action === 'review' && <RefreshCw className="w-4 h-4 mr-2" />}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Order Items Preview */}
        <div className="mb-4">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Itens do Pedido</h4>
          <div className="space-y-2">
            {order.items.slice(0, 3).map((item, index) => (
              <div key={item.id} className="flex items-center space-x-3 text-sm">
                <div className="w-12 h-12 bg-gray-100 rounded border flex-shrink-0 overflow-hidden">
                  {item.product.image ? (
                    <img 
                      src={item.product.image} 
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-4 h-4" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.product.name}</p>
                  <p className="text-gray-500">
                    {item.quantity}x R$ {item.price.toFixed(2)}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="font-medium text-green-600">
                    R$ {item.subtotal.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
            
            {order.items.length > 3 && (
              <div className="text-sm text-gray-500 text-center py-2">
                +{order.items.length - 3} {order.items.length - 3 === 1 ? 'item' : 'itens'} adicional
              </div>
            )}
          </div>
        </div>
        
        <Separator className="my-4" />
        
        {/* Order Summary */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>R$ {order.subtotal.toFixed(2)}</span>
          </div>
          
          {order.shippingCost > 0 && (
            <div className="flex justify-between">
              <span>Frete:</span>
              <span>R$ {order.shippingCost.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between font-semibold text-base pt-2 border-t">
            <span>Total:</span>
            <span className="text-green-600">R$ {order.total.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Shipping Address */}
        {viewType === 'seller' && (
          <>
            <Separator className="my-4" />
            <div className="text-sm">
              <h4 className="font-medium text-gray-700 mb-2">Endereço de Entrega</h4>
              <div className="text-gray-600">
                <p>{order.shippingAddress.name}</p>
                <p>
                  {order.shippingAddress.street}, {order.shippingAddress.number}
                  {order.shippingAddress.complement && `, ${order.shippingAddress.complement}`}
                </p>
                <p>
                  {order.shippingAddress.neighborhood}, {order.shippingAddress.city} - {order.shippingAddress.state}
                </p>
                <p>CEP: {order.shippingAddress.zipCode}</p>
                <p>Tel: {order.shippingAddress.phone}</p>
              </div>
            </div>
          </>
        )}
        
        {/* Status Progress */}
        {order.status !== 'cancelled' && (
          <>
            <Separator className="my-4" />
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-3">Progresso do Pedido</h4>
              <StatusProgress currentStatus={order.status} />
            </div>
          </>
        )}
        
        {/* Tracking Code */}
        {order.trackingCode && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Código de Rastreamento:</span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{order.trackingCode}</Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleAction('track')}
                >
                  <Truck className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
        
        {/* Quick Actions */}
        <div className="flex space-x-2 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleAction('view')}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Detalhes
          </Button>
          
          {canTrack && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleAction('track')}
            >
              <Truck className="w-4 h-4 mr-2" />
              Rastrear
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleAction('contact')}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Contato
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;