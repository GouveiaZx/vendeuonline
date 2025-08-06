import { create } from 'zustand';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  userId?: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  fetchNotifications: () => Promise<void>;
  
  // Real-time notifications
  showToast: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  addNotification: (notificationData) => {
    const notification: Notification = {
      ...notificationData,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };

    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        read: true,
      })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      const wasUnread = notification && !notification.read;
      
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },

  clearAll: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },

  fetchNotifications: async () => {
    set({ isLoading: true });
    
    try {
      // Simular dados mockados por enquanto
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'success',
          title: 'Pedido Confirmado',
          message: 'Seu pedido #12345 foi confirmado e está sendo preparado.',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
          read: false,
          actionUrl: '/buyer/orders',
          actionText: 'Ver Pedido',
        },
        {
          id: '2',
          type: 'info',
          title: 'Nova Promoção',
          message: 'Confira os produtos em oferta na categoria Eletrônicos.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
          read: false,
          actionUrl: '/products?category=electronics',
          actionText: 'Ver Ofertas',
        },
        {
          id: '3',
          type: 'warning',
          title: 'Estoque Baixo',
          message: 'O produto "Smartphone XYZ" está com estoque baixo.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 horas atrás
          read: true,
          actionUrl: '/seller/products',
          actionText: 'Gerenciar Estoque',
        },
      ];

      const unreadCount = mockNotifications.filter(n => !n.read).length;
      
      set({
        notifications: mockNotifications,
        unreadCount,
        isLoading: false,
      });
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      set({ isLoading: false });
    }
  },

  showToast: (notificationData) => {
    const { type, title, message } = notificationData;
    
    // Adicionar à lista de notificações
    get().addNotification(notificationData);
    
    // Mostrar toast
    switch (type) {
      case 'success':
        toast.success(title, {
          description: message,
          duration: 4000,
        });
        break;
      case 'error':
        toast.error(title, {
          description: message,
          duration: 6000,
        });
        break;
      case 'warning':
        toast.warning(title, {
          description: message,
          duration: 5000,
        });
        break;
      case 'info':
      default:
        toast.info(title, {
          description: message,
          duration: 4000,
        });
        break;
    }
  },
}));

// Função utilitária para criar notificações comuns
export const createNotification = {
  orderConfirmed: (orderId: string) => ({
    type: 'success' as const,
    title: 'Pedido Confirmado',
    message: `Seu pedido #${orderId} foi confirmado e está sendo preparado.`,
    actionUrl: '/buyer/orders',
    actionText: 'Ver Pedido',
  }),
  
  orderShipped: (orderId: string) => ({
    type: 'info' as const,
    title: 'Pedido Enviado',
    message: `Seu pedido #${orderId} foi enviado e está a caminho.`,
    actionUrl: '/buyer/orders',
    actionText: 'Rastrear Pedido',
  }),
  
  orderDelivered: (orderId: string) => ({
    type: 'success' as const,
    title: 'Pedido Entregue',
    message: `Seu pedido #${orderId} foi entregue com sucesso.`,
    actionUrl: '/buyer/orders',
    actionText: 'Avaliar Pedido',
  }),
  
  lowStock: (productName: string, stock: number) => ({
    type: 'warning' as const,
    title: 'Estoque Baixo',
    message: `O produto "${productName}" está com apenas ${stock} unidades em estoque.`,
    actionUrl: '/seller/products',
    actionText: 'Gerenciar Estoque',
  }),
  
  newSale: (productName: string, amount: number) => ({
    type: 'success' as const,
    title: 'Nova Venda',
    message: `Você vendeu "${productName}" por R$ ${amount.toFixed(2)}.`,
    actionUrl: '/seller/orders',
    actionText: 'Ver Vendas',
  }),
  
  paymentReceived: (amount: number) => ({
    type: 'success' as const,
    title: 'Pagamento Recebido',
    message: `Você recebeu um pagamento de R$ ${amount.toFixed(2)}.`,
    actionUrl: '/seller/analytics',
    actionText: 'Ver Relatórios',
  }),
};