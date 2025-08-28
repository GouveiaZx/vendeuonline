'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '@/types';
import { 
  Clock, 
  CreditCard, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle,
  AlertCircle
} from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<OrderStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive';
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  PENDING: {
    label: 'Aguardando Pagamento',
    variant: 'secondary' as const,
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  CONFIRMED: {
    label: 'Pagamento Confirmado',
    variant: 'default' as const,
    icon: CreditCard,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  PROCESSING: {
    label: 'Em Preparação',
    variant: 'secondary' as const,
    icon: Package,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  SHIPPED: {
    label: 'Enviado',
    variant: 'default' as const,
    icon: Truck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  DELIVERED: {
    label: 'Entregue',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  CANCELLED: {
    label: 'Cancelado',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  REFUNDED: {
    label: 'Reembolsado',
    variant: 'secondary' as const,
    icon: AlertCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md', 
  showIcon = true,
  className = ''
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  return (
    <Badge 
      variant={config.variant}
      className={`
        inline-flex items-center space-x-1 font-medium
        ${sizeClasses[size]}
        ${config.color}
        ${config.bgColor}
        border ${config.borderColor}
        ${className}
      `}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{config.label}</span>
    </Badge>
  );
};

// Component for status with description
interface StatusWithDescriptionProps {
  status: OrderStatus;
  description?: string;
  timestamp?: Date;
  showTimestamp?: boolean;
}

export const StatusWithDescription: React.FC<StatusWithDescriptionProps> = ({
  status,
  description,
  timestamp,
  showTimestamp = true
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  const getStatusDescription = (status: OrderStatus): string => {
    switch (status) {
      case 'PENDING':
        return 'Aguardando confirmação do pagamento';
      case 'CONFIRMED':
        return 'Pagamento aprovado, pedido será processado';
      case 'PROCESSING':
        return 'Pedido sendo preparado para envio';
      case 'SHIPPED':
        return 'Pedido enviado, acompanhe o rastreamento';
      case 'DELIVERED':
        return 'Pedido entregue com sucesso';
      case 'CANCELLED':
        return 'Pedido cancelado';
      case 'REFUNDED':
        return 'Pedido reembolsado';
      default:
        return '';
    }
  };
  
  const formatTimestamp = (date: Date): string => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <div className="flex items-start space-x-3">
      <div className={`
        p-2 rounded-full
        ${config.bgColor}
        ${config.borderColor}
        border
      `}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className={`font-semibold ${config.color}`}>
            {config.label}
          </span>
          {showTimestamp && timestamp && (
            <span className="text-xs text-gray-500">
              {formatTimestamp(timestamp)}
            </span>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mt-1">
          {description || getStatusDescription(status)}
        </p>
      </div>
    </div>
  );
};

// Progress indicator component
interface StatusProgressProps {
  currentStatus: OrderStatus;
  className?: string;
}

const statusOrder: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export const StatusProgress: React.FC<StatusProgressProps> = ({ 
  currentStatus, 
  className = '' 
}) => {
  const currentIndex = statusOrder.indexOf(currentStatus);
  const isCancelled = currentStatus === 'CANCELLED';
  
  if (isCancelled) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <StatusWithDescription status="CANCELLED" />
      </div>
    );
  }
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {statusOrder.map((status, index) => {
        const config = statusConfig[status];
        const Icon = config.icon;
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        
        return (
          <React.Fragment key={status}>
            <div className="flex flex-col items-center">
              <div className={`
                p-2 rounded-full border-2 transition-colors
                ${isCompleted 
                  ? `${config.bgColor} ${config.borderColor} ${config.color}` 
                  : 'bg-gray-100 border-gray-300 text-gray-400'
                }
                ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
              `}>
                <Icon className="w-4 h-4" />
              </div>
              
              <span className={`
                text-xs mt-1 text-center max-w-20
                ${isCompleted ? config.color : 'text-gray-400'}
                ${isCurrent ? 'font-semibold' : ''}
              `}>
                {config.label}
              </span>
            </div>
            
            {index < statusOrder.length - 1 && (
              <div className={`
                flex-1 h-0.5 mx-2
                ${index < currentIndex ? 'bg-green-500' : 'bg-gray-300'}
              `} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StatusBadge;