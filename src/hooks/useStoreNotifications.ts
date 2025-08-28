import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

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

interface UseStoreNotificationsOptions {
  userId?: string;
  storeId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showToasts?: boolean;
}

export function useStoreNotifications({
  userId,
  storeId,
  autoRefresh = true,
  refreshInterval = 30000, // 30 segundos
  showToasts = true
}: UseStoreNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<StoreStatusNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (storeId) params.append('storeId', storeId);
      
      const response = await fetch(`/api/stores/approval?action=notifications&${params.toString()}`);
      
      if (response.ok) {
        const { notifications: notificationsData, unread_count } = await response.json();
        
        // Verificar se há novas notificações para mostrar toast
        if (showToasts && notifications.length > 0) {
          const newNotifications = notificationsData.filter(
            (newNotif: StoreStatusNotification) => 
              !notifications.some(existingNotif => existingNotif.id === newNotif.id)
          );
          
          newNotifications.forEach((notification: StoreStatusNotification) => {
            if (notification.new_status === 'approved') {
              toast.success(
                `Loja "${notification.store_name}" foi aprovada!`,
                {
                  description: 'Sua loja está agora ativa na plataforma.',
                  duration: 5000
                }
              );
            } else if (notification.new_status === 'rejected') {
              toast.error(
                `Loja "${notification.store_name}" foi rejeitada`,
                {
                  description: 'Verifique os motivos e corrija os problemas.',
                  duration: 5000
                }
              );
            } else if (notification.new_status === 'suspended') {
              toast.warning(
                `Loja "${notification.store_name}" foi suspensa`,
                {
                  description: 'Entre em contato com o suporte.',
                  duration: 5000
                }
              );
            }
          });
        }
        
        setNotifications(notificationsData);
        setUnreadCount(unread_count || 0);
      } else {
        setError('Erro ao carregar notificações');
      }
    } catch (err) {
      setError('Erro de conexão ao carregar notificações');
      console.error('Erro ao carregar notificações:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, storeId, showToasts, notifications.length]);

  const markAsRead = useCallback(async (notificationId: string) => {
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
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications
        .filter(notif => !notif.is_read)
        .map(notif => notif.id);

      if (unreadIds.length === 0) return true;

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
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      return false;
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (notificationId: string) => {
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
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      return false;
    }
  }, []);

  const refreshNotifications = useCallback(() => {
    setLoading(true);
    fetchNotifications();
  }, [fetchNotifications]);

  // Carregar notificações inicialmente
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refresh das notificações
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  };
}

// Hook específico para notificações de uma loja
export function useStoreNotificationsForStore(storeId: string, options?: Omit<UseStoreNotificationsOptions, 'storeId'>) {
  return useStoreNotifications({ ...options, storeId });
}

// Hook específico para notificações de um usuário
export function useStoreNotificationsForUser(userId: string, options?: Omit<UseStoreNotificationsOptions, 'userId'>) {
  return useStoreNotifications({ ...options, userId });
}