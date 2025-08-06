import { useCallback } from 'react';
import { useNotificationStore, createNotification } from '@/store/notificationStore';

/**
 * Hook personalizado para gerenciar notificações em tempo real
 * Fornece métodos convenientes para criar e exibir diferentes tipos de notificações
 */
export const useNotifications = () => {
  const { showToast, addNotification } = useNotificationStore();

  // Notificações de sucesso
  const notifySuccess = useCallback((title: string, message: string, options?: {
    actionUrl?: string;
    actionText?: string;
    showToast?: boolean;
  }) => {
    const notification = {
      type: 'success' as const,
      title,
      message,
      actionUrl: options?.actionUrl,
      actionText: options?.actionText,
    };

    if (options?.showToast !== false) {
      showToast(notification);
    } else {
      addNotification(notification);
    }
  }, [showToast, addNotification]);

  // Notificações de erro
  const notifyError = useCallback((title: string, message: string, options?: {
    actionUrl?: string;
    actionText?: string;
    showToast?: boolean;
  }) => {
    const notification = {
      type: 'error' as const,
      title,
      message,
      actionUrl: options?.actionUrl,
      actionText: options?.actionText,
    };

    if (options?.showToast !== false) {
      showToast(notification);
    } else {
      addNotification(notification);
    }
  }, [showToast, addNotification]);

  // Notificações de aviso
  const notifyWarning = useCallback((title: string, message: string, options?: {
    actionUrl?: string;
    actionText?: string;
    showToast?: boolean;
  }) => {
    const notification = {
      type: 'warning' as const,
      title,
      message,
      actionUrl: options?.actionUrl,
      actionText: options?.actionText,
    };

    if (options?.showToast !== false) {
      showToast(notification);
    } else {
      addNotification(notification);
    }
  }, [showToast, addNotification]);

  // Notificações informativas
  const notifyInfo = useCallback((title: string, message: string, options?: {
    actionUrl?: string;
    actionText?: string;
    showToast?: boolean;
  }) => {
    const notification = {
      type: 'info' as const,
      title,
      message,
      actionUrl: options?.actionUrl,
      actionText: options?.actionText,
    };

    if (options?.showToast !== false) {
      showToast(notification);
    } else {
      addNotification(notification);
    }
  }, [showToast, addNotification]);

  // Notificações específicas do e-commerce
  const notifyOrderConfirmed = useCallback((orderId: string) => {
    showToast(createNotification.orderConfirmed(orderId));
  }, [showToast]);

  const notifyOrderShipped = useCallback((orderId: string) => {
    showToast(createNotification.orderShipped(orderId));
  }, [showToast]);

  const notifyOrderDelivered = useCallback((orderId: string) => {
    showToast(createNotification.orderDelivered(orderId));
  }, [showToast]);

  const notifyLowStock = useCallback((productName: string, stock: number) => {
    showToast(createNotification.lowStock(productName, stock));
  }, [showToast]);

  const notifyNewSale = useCallback((productName: string, amount: number) => {
    showToast(createNotification.newSale(productName, amount));
  }, [showToast]);

  const notifyPaymentReceived = useCallback((amount: number) => {
    showToast(createNotification.paymentReceived(amount));
  }, [showToast]);

  // Simulador de notificações em tempo real (para demonstração)
  const simulateRealTimeNotifications = useCallback(() => {
    const notifications = [
      () => notifyOrderConfirmed('12345'),
      () => notifyNewSale('Smartphone XYZ', 899.99),
      () => notifyPaymentReceived(1299.50),
      () => notifyLowStock('Notebook ABC', 3),
      () => notifyInfo('Nova Promoção', 'Confira os produtos em oferta na categoria Eletrônicos.', {
        actionUrl: '/products?category=electronics',
        actionText: 'Ver Ofertas'
      }),
    ];

    // Simular notificações aleatórias a cada 10-30 segundos
    const scheduleRandomNotification = () => {
      const randomDelay = Math.random() * 20000 + 10000; // 10-30 segundos
      const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
      
      setTimeout(() => {
        randomNotification();
        scheduleRandomNotification(); // Agendar próxima notificação
      }, randomDelay);
    };

    scheduleRandomNotification();
  }, [notifyOrderConfirmed, notifyNewSale, notifyPaymentReceived, notifyLowStock, notifyInfo]);

  return {
    // Métodos básicos
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    
    // Métodos específicos do e-commerce
    notifyOrderConfirmed,
    notifyOrderShipped,
    notifyOrderDelivered,
    notifyLowStock,
    notifyNewSale,
    notifyPaymentReceived,
    
    // Utilitários
    simulateRealTimeNotifications,
  };
};

// Hook para casos específicos de uso
export const useOrderNotifications = () => {
  const { notifyOrderConfirmed, notifyOrderShipped, notifyOrderDelivered } = useNotifications();
  
  return {
    notifyOrderConfirmed,
    notifyOrderShipped,
    notifyOrderDelivered,
  };
};

export const useSellerNotifications = () => {
  const { notifyNewSale, notifyPaymentReceived, notifyLowStock } = useNotifications();
  
  return {
    notifyNewSale,
    notifyPaymentReceived,
    notifyLowStock,
  };
};