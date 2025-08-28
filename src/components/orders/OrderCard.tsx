'use client';

import React, { useMemo, useCallback } from 'react';
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
import { formatters } from '@/utils/formatters';
import { Order, OrderStatus } from '@/types';
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
import { StatusBadge, StatusProgress } from '@/components/orders/StatusBadge';
import { toast } from 'sonner';
import { useState } from 'react';
import { OrderDetailsModal } from '@/components/orders/OrderDetailsModal';
import { OrderReviewModal } from '@/components/orders/OrderReviewModal';

interface OrderCardProps {
  order: Order;
  viewType: 'buyer' | 'seller';
  onStatusUpdate?: (orderId: string, status: OrderStatus) => void;
  onCancel?: (orderId: string) => void;
  className?: string;
}

const OrderCard = React.memo<OrderCardProps>(({
  order,
  viewType,
  onStatusUpdate,
  onCancel,
  className = ''
}) => {
  // Memoized computed values
  const computedValues = useMemo(() => {
    const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);
    const canTrack = ['SHIPPED', 'DELIVERED'].includes(order.status);
    
    return {
      canCancel,
      canTrack,
      subtotal: order.total - (order.shipping || 0) - (order.tax || 0) + (order.discount || 0)
    };
  }, [order.status, order.total, order.shipping, order.tax, order.discount]);

  const getStatusActions = useCallback((status: OrderStatus) => {
    const actions = [];
    
    if (status === 'CONFIRMED') {
      actions.push({ label: 'Marcar como Processando', action: 'PROCESSING' });
    }
    
    if (status === 'PROCESSING') {
      actions.push({ label: 'Marcar como Enviado', action: 'SHIPPED' });
    }
    
    if (status === 'SHIPPED') {
      actions.push({ label: 'Marcar como Entregue', action: 'DELIVERED' });
    }
    
    if (status === 'CONFIRMED') {
      actions.push({ label: 'Cancelar Pedido', action: 'CANCELLED', destructive: true });
    }
    
    return actions;
  }, []);
  
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const handleAction = useCallback((action: string) => {
    switch (action) {
      case 'view':
        setShowDetailsModal(true);
        break;
      case 'track':
        if (order.trackingCode) {
          window.open(`https://rastreamento.correios.com.br/app/index.php?codigo=${order.trackingCode}`, '_blank');
        } else {
          toast.info('Código de rastreamento ainda não disponível');
        }
        break;
      case 'contact':
        const phone = '5454999999999'; // Número padrão de contato
        const message = `Olá! Gostaria de falar sobre o pedido #${order.id}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
        break;
      case 'download':
        toast.info('Funcionalidade de download em desenvolvimento');
        break;
      case 'CANCELLED':
        if (onCancel) {
          onCancel(order.id);
        }
        break;
      case 'review':
        setShowReviewModal(true);
        break;
      default:
        if (onStatusUpdate && ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(action)) {
          onStatusUpdate(order.id, action as OrderStatus);
        }
    }
  }, [order, onCancel, onStatusUpdate]);
  
  const statusActions = getStatusActions(order.status as any);
  
  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="font-semibold text-lg">Pedido #{order.id.slice(-8)}</h3>
              <StatusBadge status={order.status as any} size="sm" />
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>📅 {formatters.formatDate(order.createdAt)}</span>
              <span>💰 R$ {order.total.toFixed(2)}</span>
              <span>📦 {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</span>
            </div>
            
            {viewType === 'seller' && (
              <div className="mt-2 text-sm text-gray-600">
                <span>👤 Cliente ID: {order.buyerId}</span>
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
              
              {computedValues.canTrack && (
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
                      className={(action as any).destructive ? 'text-red-600' : ''}
                    >
                      {action.action === 'PROCESSING' && <Package className="w-4 h-4 mr-2" />}
                      {action.action === 'SHIPPED' && <Truck className="w-4 h-4 mr-2" />}
                      {action.action === 'DELIVERED' && <Package className="w-4 h-4 mr-2" />}
                      {action.action === 'CANCELLED' && <X className="w-4 h-4 mr-2" />}
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
            {order.items.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center space-x-3 text-sm">
                <div className="w-12 h-12 bg-gray-100 rounded border flex-shrink-0 overflow-hidden">
                  {(item as any).productImage ? (
                    <img 
                      src={(item as any).productImage} 
                      alt={(item as any).productName || 'Produto'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-4 h-4" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{(item as any).productName || 'Produto'}</p>
                  <p className="text-gray-500">
                    {item.quantity}x R$ {item.price.toFixed(2)}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="font-medium text-green-600">
                    R$ {(item.quantity * item.price).toFixed(2)}
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
            <span>R$ {computedValues.subtotal.toFixed(2)}</span>
          </div>
          
          {(order.shipping || 0) > 0 && (
            <div className="flex justify-between">
              <span>Frete:</span>
              <span>R$ {(order.shipping || 0).toFixed(2)}</span>
            </div>
          )}
          
          {(order.tax || 0) > 0 && (
            <div className="flex justify-between">
              <span>Taxa:</span>
              <span>R$ {(order.tax || 0).toFixed(2)}</span>
            </div>
          )}
          
          {(order.discount || 0) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Desconto:</span>
              <span>-R$ {(order.discount || 0).toFixed(2)}</span>
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
              </div>
            </div>
          </>
        )}
        
        {/* Status Progress */}
        {order.status !== 'CANCELLED' && (
          <>
            <Separator className="my-4" />
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-3">Progresso do Pedido</h4>
              <StatusProgress currentStatus={order.status === 'CONFIRMED' ? 'CONFIRMED' as any : order.status as any} />
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
          
          {computedValues.canTrack && (
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

      <OrderDetailsModal
        order={{...order, shippingCost: order.shipping || 0, buyer: { id: order.buyerId, name: 'Cliente', email: 'cliente@email.com' }} as any}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />

      <OrderReviewModal
        order={{...order, shippingCost: order.shipping || 0, buyer: { id: order.buyerId, name: 'Cliente', email: 'cliente@email.com' }} as any}
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        onReviewSubmitted={() => {
          toast.success('Avaliação enviada com sucesso!');
        }}
      />
    </Card>
  );
});

// Display name for debugging
OrderCard.displayName = 'OrderCard';

export { OrderCard };
export default OrderCard;