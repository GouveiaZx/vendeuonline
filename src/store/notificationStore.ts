import { create } from 'zustand';
import { toast } from 'sonner';
import { UserType } from '@/types';
import { getSSRSafeTimestamp } from '@/lib/ssrUtils';

export type NotificationCategory = 
  | 'order' 
  | 'payment' 
  | 'product' 
  | 'system' 
  | 'security' 
  | 'promotion' 
  | 'inventory'
  | 'user'
  | 'commission';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  userId?: string;
  userType?: UserType;
  targetUserTypes?: UserType[]; // Permite especificar para quais tipos de usuário mostrar
  category: NotificationCategory;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

export interface NotificationFilters {
  userType?: UserType;
  category?: NotificationCategory;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  onlyUnread?: boolean;
}

export type NotificationPreferences = {
  [key in UserType]: {
    enabledCategories: NotificationCategory[];
    enableToasts: boolean;
    enableEmail: boolean;
    enablePush: boolean;
    quietHours?: { start: string; end: string };
  };
};

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  preferences: NotificationPreferences;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (userType?: UserType) => void;
  removeNotification: (id: string) => void;
  clearAll: (userType?: UserType) => void;
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  
  // Real-time notifications
  showToast: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  
  // User type specific methods
  getNotificationsForUser: (userType: UserType) => Notification[];
  getUnreadCountForUser: (userType: UserType) => number;
  updatePreferences: (userType: UserType, preferences: Partial<NotificationPreferences[UserType]>) => void;
  
  // Category filtering
  getNotificationsByCategory: (category: NotificationCategory, userType?: UserType) => Notification[];
  getHighPriorityNotifications: (userType?: UserType) => Notification[];
}

// Preferências padrão por tipo de usuário
const defaultPreferences: NotificationPreferences = {
  ADMIN: {
    enabledCategories: ['system', 'security', 'user', 'order', 'payment', 'commission'],
    enableToasts: true,
    enableEmail: true,
    enablePush: true,
  },
  SELLER: {
    enabledCategories: ['order', 'payment', 'product', 'inventory', 'commission', 'system'],
    enableToasts: true,
    enableEmail: true,
    enablePush: true,
    quietHours: { start: '22:00', end: '08:00' },
  },
  BUYER: {
    enabledCategories: ['order', 'payment', 'promotion', 'product', 'system'],
    enableToasts: true,
    enableEmail: false,
    enablePush: true,
  },
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  preferences: defaultPreferences,

  addNotification: (notificationData) => {
    const notification: Notification = {
      ...notificationData,
      id: crypto.randomUUID(),
      timestamp: new Date(getSSRSafeTimestamp()),
      read: false,
      category: notificationData.category || 'system',
      priority: notificationData.priority || 'medium',
    };

    // Verificar se a notificação deve expirar
    if (notification.expiresAt && notification.expiresAt <= new Date(getSSRSafeTimestamp())) {
      return;
    }

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

  markAllAsRead: (userType) => {
    set((state) => {
      if (userType) {
        const userNotifications = state.notifications.filter(n => 
          !n.targetUserTypes || n.targetUserTypes.includes(userType)
        );
        const unreadUserNotifications = userNotifications.filter(n => !n.read).length;
        
        return {
          notifications: state.notifications.map((notification) => {
            if (!notification.targetUserTypes || notification.targetUserTypes.includes(userType)) {
              return { ...notification, read: true };
            }
            return notification;
          }),
          unreadCount: Math.max(0, state.unreadCount - unreadUserNotifications),
        };
      }
      
      return {
        notifications: state.notifications.map((notification) => ({
          ...notification,
          read: true,
        })),
        unreadCount: 0,
      };
    });
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

  clearAll: (userType) => {
    if (userType) {
      set((state) => {
        const userNotifications = state.notifications.filter(n => 
          !n.targetUserTypes || n.targetUserTypes.includes(userType)
        );
        const unreadUserNotifications = userNotifications.filter(n => !n.read).length;
        
        return {
          notifications: state.notifications.filter(n => 
            n.targetUserTypes && !n.targetUserTypes.includes(userType)
          ),
          unreadCount: Math.max(0, state.unreadCount - unreadUserNotifications),
        };
      });
    } else {
      set({
        notifications: [],
        unreadCount: 0,
      });
    }
  },

  fetchNotifications: async (filters) => {
    set({ isLoading: true });
    
    try {
      // Simular dados mockados com diferentes tipos de usuário
      const mockNotifications: Notification[] = [
        // Notificações para BUYER
        {
          id: '1',
          type: 'success',
          title: 'Pedido Confirmado',
          message: 'Seu pedido #12345 foi confirmado e está sendo preparado.',
          timestamp: new Date(getSSRSafeTimestamp() - 1000 * 60 * 30),
          read: false,
          category: 'order',
          priority: 'medium',
          targetUserTypes: ['BUYER'],
          actionUrl: '/buyer/orders',
          actionText: 'Ver Pedido',
        },
        {
          id: '2',
          type: 'info',
          title: 'Nova Promoção',
          message: 'Confira os produtos em oferta na categoria Eletrônicos.',
          timestamp: new Date(getSSRSafeTimestamp() - 1000 * 60 * 60 * 2),
          read: false,
          category: 'promotion',
          priority: 'low',
          targetUserTypes: ['BUYER'],
          actionUrl: '/products?category=electronics',
          actionText: 'Ver Ofertas',
        },
        // Notificações para SELLER
        {
          id: '3',
          type: 'warning',
          title: 'Estoque Baixo',
          message: 'O produto "Smartphone XYZ" está com estoque baixo.',
          timestamp: new Date(getSSRSafeTimestamp() - 1000 * 60 * 60 * 4),
          read: true,
          category: 'inventory',
          priority: 'high',
          targetUserTypes: ['SELLER'],
          actionUrl: '/seller/products',
          actionText: 'Gerenciar Estoque',
        },
        {
          id: '4',
          type: 'success',
          title: 'Nova Venda Realizada',
          message: 'Você vendeu 1x "Produto ABC" por R$ 199,90.',
          timestamp: new Date(getSSRSafeTimestamp() - 1000 * 60 * 60 * 6),
          read: false,
          category: 'order',
          priority: 'medium',
          targetUserTypes: ['SELLER'],
          actionUrl: '/seller/orders',
          actionText: 'Ver Vendas',
        },
        // Notificações para ADMIN
        {
          id: '5',
          type: 'error',
          title: 'Falha de Segurança',
          message: 'Tentativa de acesso não autorizado detectada.',
          timestamp: new Date(getSSRSafeTimestamp() - 1000 * 60 * 60),
          read: false,
          category: 'security',
          priority: 'urgent',
          targetUserTypes: ['ADMIN'],
          actionUrl: '/admin/security',
          actionText: 'Investigar',
        },
        {
          id: '6',
          type: 'info',
          title: 'Novo Usuário Registrado',
          message: 'Um novo seller se registrou na plataforma.',
          timestamp: new Date(getSSRSafeTimestamp() - 1000 * 60 * 60 * 3),
          read: false,
          category: 'user',
          priority: 'low',
          targetUserTypes: ['ADMIN'],
          actionUrl: '/admin/users',
          actionText: 'Ver Usuários',
        },
        // Notificação geral para todos
        {
          id: '7',
          type: 'info',
          title: 'Manutenção Programada',
          message: 'Sistema passará por manutenção hoje às 23h.',
          timestamp: new Date(getSSRSafeTimestamp() - 1000 * 60 * 30),
          read: false,
          category: 'system',
          priority: 'medium',
          targetUserTypes: ['ADMIN', 'SELLER', 'BUYER'],
          actionUrl: '/maintenance',
          actionText: 'Mais Informações',
        },
      ];

      let filteredNotifications = mockNotifications;

      // Aplicar filtros se fornecidos
      if (filters) {
        if (filters.userType) {
          filteredNotifications = filteredNotifications.filter(n => 
            !n.targetUserTypes || n.targetUserTypes.includes(filters.userType!)
          );
        }
        if (filters.category) {
          filteredNotifications = filteredNotifications.filter(n => n.category === filters.category);
        }
        if (filters.priority) {
          filteredNotifications = filteredNotifications.filter(n => n.priority === filters.priority);
        }
        if (filters.onlyUnread) {
          filteredNotifications = filteredNotifications.filter(n => !n.read);
        }
      }

      const unreadCount = filteredNotifications.filter(n => !n.read).length;
      
      set({
        notifications: filteredNotifications,
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
    
    // Verificar se toasts estão habilitados para o tipo de usuário
    const userType = notificationData.userType;
    if (userType && !get().preferences[userType]?.enableToasts) {
      return;
    }

    // Verificar horário silencioso
    if (userType) {
      const quietHours = get().preferences[userType]?.quietHours;
      if (quietHours) {
        const now = new Date(getSSRSafeTimestamp());
        const currentTime = now.toTimeString().slice(0, 5);
        if (currentTime >= quietHours.start || currentTime <= quietHours.end) {
          return; // Não mostrar toast durante horário silencioso
        }
      }
    }
    
    // Mostrar toast com prioridade visual
    const duration = notificationData.priority === 'urgent' ? 8000 :
                    notificationData.priority === 'high' ? 6000 :
                    notificationData.priority === 'medium' ? 4000 : 3000;

    switch (type) {
      case 'success':
        toast.success(title, {
          description: message,
          duration,
        });
        break;
      case 'error':
        toast.error(title, {
          description: message,
          duration: duration + 2000, // Erros ficam mais tempo
        });
        break;
      case 'warning':
        toast.warning(title, {
          description: message,
          duration: duration + 1000,
        });
        break;
      case 'info':
      default:
        toast.info(title, {
          description: message,
          duration,
        });
        break;
    }
  },

  // Novos métodos específicos por tipo de usuário
  getNotificationsForUser: (userType) => {
    const { notifications } = get();
    return notifications.filter(n => 
      !n.targetUserTypes || n.targetUserTypes.includes(userType)
    );
  },

  getUnreadCountForUser: (userType) => {
    const userNotifications = get().getNotificationsForUser(userType);
    return userNotifications.filter(n => !n.read).length;
  },

  updatePreferences: (userType, newPreferences) => {
    set((state) => ({
      preferences: {
        ...state.preferences,
        [userType]: {
          ...state.preferences[userType],
          ...newPreferences,
        },
      },
    }));
  },

  getNotificationsByCategory: (category, userType) => {
    const notifications = userType 
      ? get().getNotificationsForUser(userType)
      : get().notifications;
    
    return notifications.filter(n => n.category === category);
  },

  getHighPriorityNotifications: (userType) => {
    const notifications = userType 
      ? get().getNotificationsForUser(userType)
      : get().notifications;
    
    return notifications.filter(n => 
      n.priority === 'high' || n.priority === 'urgent'
    );
  },
}));

// Funções utilitárias para criar notificações específicas por tipo de usuário
export const createNotification = {
  // Notificações para BUYER
  orderConfirmed: (orderId: string) => ({
    type: 'success' as const,
    title: 'Pedido Confirmado',
    message: `Seu pedido #${orderId} foi confirmado e está sendo preparado.`,
    category: 'order' as NotificationCategory,
    priority: 'medium' as const,
    targetUserTypes: ['BUYER' as UserType],
    actionUrl: '/buyer/orders',
    actionText: 'Ver Pedido',
  }),
  
  orderShipped: (orderId: string) => ({
    type: 'info' as const,
    title: 'Pedido Enviado',
    message: `Seu pedido #${orderId} foi enviado e está a caminho.`,
    category: 'order' as NotificationCategory,
    priority: 'medium' as const,
    targetUserTypes: ['BUYER' as UserType],
    actionUrl: '/buyer/orders',
    actionText: 'Rastrear Pedido',
  }),
  
  orderDelivered: (orderId: string) => ({
    type: 'success' as const,
    title: 'Pedido Entregue',
    message: `Seu pedido #${orderId} foi entregue com sucesso.`,
    category: 'order' as NotificationCategory,
    priority: 'high' as const,
    targetUserTypes: ['BUYER' as UserType],
    actionUrl: '/buyer/orders',
    actionText: 'Avaliar Pedido',
  }),

  promotion: (title: string, description: string, category?: string) => ({
    type: 'info' as const,
    title,
    message: description,
    category: 'promotion' as NotificationCategory,
    priority: 'low' as const,
    targetUserTypes: ['BUYER' as UserType],
    actionUrl: category ? `/products?category=${category}` : '/products',
    actionText: 'Ver Produtos',
    expiresAt: new Date(getSSRSafeTimestamp() + 7 * 24 * 60 * 60 * 1000), // Expira em 7 dias
  }),
  
  // Notificações para SELLER
  lowStock: (productName: string, stock: number) => ({
    type: 'warning' as const,
    title: 'Estoque Baixo',
    message: `O produto "${productName}" está com apenas ${stock} unidades em estoque.`,
    category: 'inventory' as NotificationCategory,
    priority: stock === 0 ? 'urgent' as const : 'high' as const,
    targetUserTypes: ['SELLER' as UserType],
    actionUrl: '/seller/products',
    actionText: 'Gerenciar Estoque',
  }),
  
  newSale: (productName: string, amount: number, orderId: string) => ({
    type: 'success' as const,
    title: 'Nova Venda Realizada',
    message: `Você vendeu "${productName}" por R$ ${amount.toFixed(2)}.`,
    category: 'order' as NotificationCategory,
    priority: 'medium' as const,
    targetUserTypes: ['SELLER' as UserType],
    actionUrl: `/seller/orders/${orderId}`,
    actionText: 'Ver Pedido',
  }),
  
  paymentReceived: (amount: number, orderId: string) => ({
    type: 'success' as const,
    title: 'Pagamento Recebido',
    message: `Você recebeu um pagamento de R$ ${amount.toFixed(2)}.`,
    category: 'payment' as NotificationCategory,
    priority: 'medium' as const,
    targetUserTypes: ['SELLER' as UserType],
    actionUrl: `/seller/orders/${orderId}`,
    actionText: 'Ver Detalhes',
  }),

  commissionUpdate: (amount: number, period: string) => ({
    type: 'info' as const,
    title: 'Atualização de Comissão',
    message: `Sua comissão de ${period} foi processada: R$ ${amount.toFixed(2)}.`,
    category: 'commission' as NotificationCategory,
    priority: 'medium' as const,
    targetUserTypes: ['SELLER' as UserType],
    actionUrl: '/seller/analytics',
    actionText: 'Ver Relatórios',
  }),

  productApproval: (productName: string, approved: boolean) => ({
    type: approved ? 'success' as const : 'warning' as const,
    title: approved ? 'Produto Aprovado' : 'Produto Rejeitado',
    message: approved 
      ? `Seu produto "${productName}" foi aprovado e está disponível na loja.`
      : `Seu produto "${productName}" foi rejeitado. Verifique as informações.`,
    category: 'product' as NotificationCategory,
    priority: 'medium' as const,
    targetUserTypes: ['SELLER' as UserType],
    actionUrl: '/seller/products',
    actionText: 'Ver Produtos',
  }),
  
  // Notificações para ADMIN
  securityAlert: (message: string, severity: 'low' | 'medium' | 'high' | 'urgent' = 'high') => ({
    type: severity === 'urgent' ? 'error' as const : 'warning' as const,
    title: 'Alerta de Segurança',
    message,
    category: 'security' as NotificationCategory,
    priority: severity,
    targetUserTypes: ['ADMIN' as UserType],
    actionUrl: '/admin/security',
    actionText: 'Investigar',
  }),

  newUserRegistration: (userName: string, userType: UserType) => ({
    type: 'info' as const,
    title: 'Novo Usuário Registrado',
    message: `${userName} se registrou como ${userType}.`,
    category: 'user' as NotificationCategory,
    priority: 'low' as const,
    targetUserTypes: ['ADMIN' as UserType],
    actionUrl: '/admin/users',
    actionText: 'Ver Usuários',
  }),

  systemError: (error: string) => ({
    type: 'error' as const,
    title: 'Erro do Sistema',
    message: `Erro detectado: ${error}`,
    category: 'system' as NotificationCategory,
    priority: 'urgent' as const,
    targetUserTypes: ['ADMIN' as UserType],
    actionUrl: '/admin/logs',
    actionText: 'Ver Logs',
  }),

  // Notificações gerais (todos os tipos de usuário)
  systemMaintenance: (date: string, duration: string) => ({
    type: 'info' as const,
    title: 'Manutenção Programada',
    message: `Sistema passará por manutenção em ${date} por ${duration}.`,
    category: 'system' as NotificationCategory,
    priority: 'medium' as const,
    targetUserTypes: ['ADMIN', 'SELLER', 'BUYER'] as UserType[],
    actionUrl: '/maintenance',
    actionText: 'Mais Informações',
  }),

  systemUpdate: (version: string, features: string) => ({
    type: 'success' as const,
    title: 'Atualização do Sistema',
    message: `Sistema atualizado para v${version}. ${features}`,
    category: 'system' as NotificationCategory,
    priority: 'low' as const,
    targetUserTypes: ['ADMIN', 'SELLER', 'BUYER'] as UserType[],
    actionUrl: '/changelog',
    actionText: 'Ver Mudanças',
  }),
};

// Hooks específicos para cada tipo de usuário
export const useAdminNotifications = () => {
  const store = useNotificationStore();
  return {
    notifications: store.getNotificationsForUser('ADMIN'),
    unreadCount: store.getUnreadCountForUser('ADMIN'),
    highPriorityNotifications: store.getHighPriorityNotifications('ADMIN'),
    securityNotifications: store.getNotificationsByCategory('security', 'ADMIN'),
    markAllAsRead: () => store.markAllAsRead('ADMIN'),
    clearAll: () => store.clearAll('ADMIN'),
  };
};

export const useSellerNotifications = () => {
  const store = useNotificationStore();
  return {
    notifications: store.getNotificationsForUser('SELLER'),
    unreadCount: store.getUnreadCountForUser('SELLER'),
    orderNotifications: store.getNotificationsByCategory('order', 'SELLER'),
    inventoryNotifications: store.getNotificationsByCategory('inventory', 'SELLER'),
    paymentNotifications: store.getNotificationsByCategory('payment', 'SELLER'),
    markAllAsRead: () => store.markAllAsRead('SELLER'),
    clearAll: () => store.clearAll('SELLER'),
  };
};

export const useBuyerNotifications = () => {
  const store = useNotificationStore();
  return {
    notifications: store.getNotificationsForUser('BUYER'),
    unreadCount: store.getUnreadCountForUser('BUYER'),
    orderNotifications: store.getNotificationsByCategory('order', 'BUYER'),
    promotionNotifications: store.getNotificationsByCategory('promotion', 'BUYER'),
    markAllAsRead: () => store.markAllAsRead('BUYER'),
    clearAll: () => store.clearAll('BUYER'),
  };
};