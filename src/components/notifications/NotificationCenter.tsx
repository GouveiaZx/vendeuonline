'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, ExternalLink, Clock, AlertCircle, CheckCircle, Info, AlertTriangle, Settings, Filter } from 'lucide-react';
import { 
  useNotificationStore, 
  useAdminNotifications, 
  useSellerNotifications, 
  useBuyerNotifications, 
  Notification, 
  NotificationCategory 
} from '@/store/notificationStore';
import { useAuthStoreSafe } from '@/hooks/useAuthStoreSafe';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryLabels: Record<NotificationCategory, string> = {
  order: 'Pedidos',
  payment: 'Pagamentos', 
  product: 'Produtos',
  system: 'Sistema',
  security: 'Segurança',
  promotion: 'Promoções',
  inventory: 'Estoque',
  user: 'Usuários',
  commission: 'Comissões',
};

const priorityColors = {
  low: 'border-l-gray-300',
  medium: 'border-l-blue-500',
  high: 'border-l-yellow-500', 
  urgent: 'border-l-red-500',
};

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [filter, setFilter] = useState<NotificationCategory | 'all'>('all');
  
  const { user } = useAuthStoreSafe();
  const userType = user?.type;
  const { fetchNotifications, markAsRead, removeNotification } = useNotificationStore();
  
  // Usar hooks específicos baseado no tipo de usuário
  const adminNotifications = useAdminNotifications();
  const sellerNotifications = useSellerNotifications();
  const buyerNotifications = useBuyerNotifications();

  // Selecionar dados baseado no tipo de usuário
  const currentUserData = userType === 'ADMIN' ? adminNotifications :
                         userType === 'SELLER' ? sellerNotifications :
                         userType === 'BUYER' ? buyerNotifications :
                         { notifications: [], unreadCount: 0, markAllAsRead: () => {}, clearAll: () => {} };

  const { notifications: allNotifications, unreadCount, markAllAsRead, clearAll } = currentUserData;
  
  const router = useRouter();

  // Filtrar notificações por categoria
  const notifications = filter === 'all' 
    ? allNotifications 
    : allNotifications.filter(n => n.category === filter);

  useEffect(() => {
    if (isOpen && userType && allNotifications.length === 0) {
      fetchNotifications({ userType });
    }
  }, [isOpen, userType, allNotifications.length, fetchNotifications]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return timestamp.toLocaleDateString('pt-BR');
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'order': return <CheckCircle className="h-3 w-3" />;
      case 'payment': return <CheckCircle className="h-3 w-3" />;
      case 'security': return <AlertTriangle className="h-3 w-3" />;
      case 'inventory': return <AlertTriangle className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  };

  const getAvailableCategories = () => {
    if (!userType) return [];
    
    switch (userType) {
      case 'ADMIN':
        return ['security', 'user', 'system', 'order'] as NotificationCategory[];
      case 'SELLER':
        return ['order', 'inventory', 'payment', 'commission', 'product'] as NotificationCategory[];
      case 'BUYER':
        return ['order', 'promotion', 'product'] as NotificationCategory[];
      default:
        return [];
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />
      
      {/* Notification Panel */}
      <div className="fixed top-16 right-4 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Notificações</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                router.push('/settings/notifications');
              }}
              className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center space-x-1"
              title="Configurações de notificação"
            >
              <Settings className="h-4 w-4" />
              <span>Configurar</span>
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Marcar todas</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as NotificationCategory | 'all')}
              className="text-sm border-none bg-transparent focus:ring-0 text-gray-700"
            >
              <option value="all">Todas as categorias</option>
              {getAvailableCategories().map((category) => (
                <option key={category} value={category}>
                  {categoryLabels[category]}
                </option>
              ))}
            </select>
            {filter !== 'all' && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {notifications.length}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mb-4" />
              <h4 className="font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'Nenhuma notificação' : `Nenhuma notificação de ${categoryLabels[filter as NotificationCategory]}`}
              </h4>
              <p className="text-gray-500 text-sm">
                {filter === 'all' 
                  ? 'Você está em dia! Não há notificações pendentes.' 
                  : 'Não há notificações nesta categoria.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                    !notification.read ? 'bg-blue-50' : ''
                  } ${priorityColors[notification.priority]}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimestamp(notification.timestamp)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {getCategoryIcon(notification.category)}
                                <span>{categoryLabels[notification.category]}</span>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs ${
                                notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                notification.priority === 'high' ? 'bg-yellow-100 text-yellow-800' :
                                notification.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {notification.priority}
                              </span>
                            </div>
                            
                            {notification.actionUrl && (
                              <Link
                                href={notification.actionUrl}
                                onClick={() => handleNotificationClick(notification)}
                                className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center space-x-1"
                              >
                                <span>{notification.actionText || 'Ver mais'}</span>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-700 p-1"
                              title="Marcar como lida"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Remover notificação"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {allNotifications.length > 0 && (
          <div className="border-t border-gray-200 p-3">
            <button
              onClick={clearAll}
              className="w-full text-center text-sm text-gray-600 hover:text-red-600 font-medium"
            >
              Limpar todas as notificações
            </button>
          </div>
        )}
      </div>
    </>
  );
}
