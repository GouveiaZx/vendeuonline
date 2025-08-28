import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Store, 
  Clock,
  Eye,
  Trash2,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StoreStatusNotification {
  id: string;
  store_id: string;
  store_name: string;
  old_status: string;
  new_status: string;
  message: string;
  created_at: string;
  is_read: boolean;
  moderator_name?: string;
  rejection_reason?: string;
  verification_notes?: string;
}

interface StoreStatusNotificationsProps {
  userId?: string;
  isAdmin?: boolean;
  storeId?: string;
  showUnreadOnly?: boolean;
  maxItems?: number;
}

export default function StoreStatusNotifications({
  userId,
  isAdmin = false,
  storeId,
  showUnreadOnly = false,
  maxItems = 10
}: StoreStatusNotificationsProps) {
  const [notifications, setNotifications] = useState<StoreStatusNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (storeId) params.append('storeId', storeId);
      if (showUnreadOnly) params.append('unreadOnly', 'true');
      params.append('limit', maxItems.toString());
      
      const response = await fetch(`/api/stores/approval?action=notifications&${params.toString()}`);
      
      if (response.ok) {
        const { notifications: notificationsData, unread_count } = await response.json();
        setNotifications(notificationsData);
        setUnreadCount(unread_count || 0);
      } else {
        console.error('Erro ao carregar notificações');
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/stores/approval', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark-notification-read',
          notificationId
        })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(notif => !notif.is_read)
        .map(notif => notif.id);

      if (unreadIds.length === 0) return;

      const response = await fetch('/api/stores/approval', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark-notifications-read',
          notificationIds: unreadIds
        })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
        toast.success('Todas as notificações foram marcadas como lidas');
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao marcar notificações como lidas');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch('/api/stores/approval', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete-notification',
          notificationId
        })
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        toast.success('Notificação removida');
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      toast.error('Erro ao remover notificação');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'suspended': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-600" />;
      default: return <Store className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, label: 'Pendente' },
      approved: { variant: 'default' as const, label: 'Aprovada' },
      rejected: { variant: 'destructive' as const, label: 'Rejeitada' },
      suspended: { variant: 'outline' as const, label: 'Suspensa' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getNotificationMessage = (notification: StoreStatusNotification) => {
    const { old_status, new_status, store_name, moderator_name } = notification;
    
    if (new_status === 'approved') {
      return `Sua loja "${store_name}" foi aprovada e está ativa na plataforma!`;
    } else if (new_status === 'rejected') {
      return `Sua loja "${store_name}" foi rejeitada. Verifique os motivos e corrija os problemas.`;
    } else if (new_status === 'suspended') {
      return `Sua loja "${store_name}" foi suspensa. Entre em contato com o suporte.`;
    } else if (new_status === 'pending') {
      return `Sua loja "${store_name}" está sendo analisada.`;
    }
    
    return notification.message || `Status da loja "${store_name}" alterado de ${old_status} para ${new_status}`;
  };

  useEffect(() => {
    loadNotifications();
  }, [userId, storeId, showUnreadOnly]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <span>Notificações de Status</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={markAllAsRead}
            >
              <Check className="w-4 h-4 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {showUnreadOnly ? 'Nenhuma notificação não lida' : 'Nenhuma notificação encontrada'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg transition-colors ${
                  notification.is_read 
                    ? 'bg-white border-gray-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">
                      {getStatusIcon(notification.new_status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {notification.store_name}
                        </h4>
                        {getStatusBadge(notification.new_status)}
                        {!notification.is_read && (
                          <Badge variant="secondary" className="text-xs">
                            Nova
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">
                        {getNotificationMessage(notification)}
                      </p>
                      
                      {notification.rejection_reason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm text-red-800">
                            <strong>Motivo:</strong> {notification.rejection_reason}
                          </p>
                        </div>
                      )}
                      
                      {notification.verification_notes && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm text-blue-800">
                            <strong>Observações:</strong> {notification.verification_notes}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                          {notification.moderator_name && (
                            <span className="ml-2">• por {notification.moderator_name}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {!notification.is_read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}