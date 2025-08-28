'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatters } from '@/lib/utils';
import { Order } from '@/types';
import { Package, Truck, MapPin, CreditCard, User } from 'lucide-react';

interface OrderDetailsModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsModal({ order, open, onOpenChange }: OrderDetailsModalProps) {
  if (!order) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING': return 'bg-purple-100 text-purple-800';
      case 'SHIPPED': return 'bg-indigo-100 text-indigo-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Detalhes do Pedido #{order.id.slice(-8)}
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre o pedido realizado em {formatters.formatDate(order.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status e Informações Gerais */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold">Status do Pedido</h3>
              <Badge className={getStatusColor(order.status)}>
                {formatters.formatOrderStatus(order.status)}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total do Pedido</p>
              <p className="text-2xl font-bold text-green-600">R$ {order.total.toFixed(2)}</p>
            </div>
          </div>

          {/* Itens do Pedido */}
          <div>
            <h3 className="font-semibold mb-3">Itens do Pedido</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-16 h-16 bg-gray-100 rounded border flex-shrink-0 overflow-hidden">
                    {(item as any).product?.image ? (
                      <img
                        src={(item as any).product.image}
                        alt={(item as any).product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{(item as any).productName || item.product?.name || 'Produto'}</h4>
                    <p className="text-sm text-gray-600">
                      Quantidade: {item.quantity} × R$ {item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">R$ {((item as any).subtotal || (item as any).total || (item.price * item.quantity)).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo de Valores */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Resumo de Valores</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal dos produtos:</span>
                <span>R$ {order.subtotal.toFixed(2)}</span>
              </div>
              {((order as any).shippingCost || order.shipping) > 0 && (
                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span>R$ {(((order as any).shippingCost || order.shipping) || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                <span>Total:</span>
                <span className="text-green-600">R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Endereço de Entrega */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Endereço de Entrega
            </h3>
            <div className="p-4 border rounded-lg">
              <p className="font-medium">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.street}, {order.shippingAddress.number}</p>
              {order.shippingAddress.complement && (
                <p>{order.shippingAddress.complement}</p>
              )}
              <p>
                {order.shippingAddress.neighborhood}, {order.shippingAddress.city} - {order.shippingAddress.state}
              </p>
              <p>CEP: {order.shippingAddress.zipCode}</p>
            </div>
          </div>

          {/* Informações do Cliente */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Informações do Cliente
            </h3>
            <div className="p-4 border rounded-lg">
              <p className="font-medium">Cliente ID: {(order as any).buyer?.id || order.buyerId}</p>
              <p className="text-gray-600">Informações do cliente disponíveis no sistema</p>
            </div>
          </div>

          {/* Informações de Pagamento */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Informações de Pagamento
            </h3>
            <div className="p-4 border rounded-lg">
              <p>Forma de pagamento: {order.paymentMethod}</p>
              {(order as any).paymentId && (
                <p className="text-sm text-gray-600">ID do pagamento: {(order as any).paymentId}</p>
              )}
            </div>
          </div>

          {/* Código de Rastreamento */}
          {order.trackingCode && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Rastreamento
              </h3>
              <div className="p-4 border rounded-lg">
                <p>Código de rastreamento: {order.trackingCode}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    window.open(`https://rastreamento.correios.com.br/app/index.php?codigo=${order.trackingCode}`, '_blank');
                  }}
                >
                  Rastrear no Correios
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}