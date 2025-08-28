'use client';

import { useCallback } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNotifications } from '@/hooks/useNotifications';

interface DemoNotification {
  title: string;
  body: string;
  type: 'order' | 'sale' | 'payment' | 'promotion' | 'warning' | 'general';
  url?: string;
}

export function usePushNotificationDemo() {
  const { isSubscribed, permission } = usePushNotifications();
  const { notifyInfo } = useNotifications();

  // Simular notificação push local
  const simulateLocalNotification = useCallback((notification: DemoNotification) => {
    if (permission !== 'granted') {
      notifyInfo('Permissão necessária', 'Ative as notificações push para ver este exemplo.');
      return;
    }

    // Criar notificação local usando a Notification API
    const notif = new Notification(notification.title, {
      body: notification.body,
      icon: '/icon-192.svg',
      badge: '/favicon.svg',
      tag: notification.type,
      data: {
        url: notification.url || '/',
        type: notification.type
      }
    });

    // Simular clique na notificação
    notif.onclick = () => {
      window.focus();
      if (notification.url) {
        window.location.href = notification.url;
      }
      notif.close();
    };

    // Auto-fechar após 5 segundos
    setTimeout(() => {
      notif.close();
    }, 5000);
  }, [permission, notifyInfo]);

  // Simular notificação via Service Worker
  const simulateServiceWorkerNotification = useCallback(async (notification: DemoNotification) => {
    if (!isSubscribed || permission !== 'granted') {
      notifyInfo('Subscription necessária', 'Ative as notificações push para ver este exemplo.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(notification.title, {
        body: notification.body,
        icon: '/icon-192.svg',
        badge: '/favicon.svg',
        data: {
          dateOfArrival: Date.now(),
          url: notification.url || '/',
          type: notification.type
        },
        tag: notification.type,
        requireInteraction: notification.type === 'order' || notification.type === 'payment'
      });
    } catch (error) {
      console.error('Erro ao simular notificação via Service Worker:', error);
      notifyInfo('Erro', 'Não foi possível simular a notificação.');
    }
  }, [isSubscribed, permission, notifyInfo]);

  // Notificações de exemplo
  const demoNotifications: DemoNotification[] = [
    {
      title: 'Novo Pedido Recebido! 🎉',
      body: 'Você recebeu um novo pedido de R$ 299,90. Clique para ver os detalhes.',
      type: 'order',
      url: '/seller/orders'
    },
    {
      title: 'Pagamento Confirmado ✅',
      body: 'O pagamento do pedido #12345 foi confirmado. Prepare o produto para envio.',
      type: 'payment',
      url: '/seller/orders'
    },
    {
      title: 'Venda Realizada! 💰',
      body: 'Parabéns! Você vendeu um Smartphone XYZ por R$ 1.299,00.',
      type: 'sale',
      url: '/seller/dashboard'
    },
    {
      title: 'Oferta Especial! 🔥',
      body: 'Produtos em eletrônicos com até 50% de desconto. Aproveite!',
      type: 'promotion',
      url: '/products?category=electronics'
    },
    {
      title: 'Estoque Baixo ⚠️',
      body: 'O produto "Fone Bluetooth" está com apenas 2 unidades em estoque.',
      type: 'warning',
      url: '/seller/products'
    },
    {
      title: 'Bem-vindo de volta! 👋',
      body: 'Confira as novidades e ofertas especiais para você.',
      type: 'general',
      url: '/'
    }
  ];

  // Simular notificação aleatória
  const simulateRandomNotification = useCallback(() => {
    const randomNotification = demoNotifications[Math.floor(Math.random() * demoNotifications.length)];
    simulateServiceWorkerNotification(randomNotification);
  }, [simulateServiceWorkerNotification]);

  // Simular sequência de notificações
  const simulateNotificationSequence = useCallback(() => {
    if (permission !== 'granted') {
      notifyInfo('Permissão necessária', 'Ative as notificações push primeiro.');
      return;
    }

    const notifications = [
      demoNotifications[0], // Novo pedido
      demoNotifications[1], // Pagamento confirmado
      demoNotifications[2]  // Venda realizada
    ];

    notifications.forEach((notification, index) => {
      setTimeout(() => {
        simulateServiceWorkerNotification(notification);
      }, index * 3000); // 3 segundos entre cada notificação
    });
  }, [permission, simulateServiceWorkerNotification, notifyInfo]);

  return {
    demoNotifications,
    simulateLocalNotification,
    simulateServiceWorkerNotification,
    simulateRandomNotification,
    simulateNotificationSequence,
    canSimulate: permission === 'granted'
  };
}

// Utilitários (duplicados do Service Worker para consistência)
function getVibrationPattern(type: string): number[] {
  switch (type) {
    case 'order':
      return [200, 100, 200, 100, 200];
    case 'payment':
      return [300, 200, 300];
    case 'sale':
      return [100, 50, 100, 50, 100, 50, 100];
    case 'warning':
      return [500, 200, 500];
    default:
      return [100, 50, 100];
  }
}

function getNotificationActions(type: string) {
  switch (type) {
    case 'order':
      return [
        {
          action: 'view-order',
          title: 'Ver Pedido',
          icon: '/favicon.svg'
        },
        {
          action: 'dismiss',
          title: 'Dispensar',
          icon: '/favicon.svg'
        }
      ];
    case 'sale':
      return [
        {
          action: 'view-sale',
          title: 'Ver Venda',
          icon: '/favicon.svg'
        },
        {
          action: 'manage-orders',
          title: 'Gerenciar',
          icon: '/favicon.svg'
        }
      ];
    case 'payment':
      return [
        {
          action: 'view-payment',
          title: 'Ver Pagamento',
          icon: '/favicon.svg'
        },
        {
          action: 'dismiss',
          title: 'OK',
          icon: '/favicon.svg'
        }
      ];
    case 'promotion':
      return [
        {
          action: 'view-offer',
          title: 'Ver Oferta',
          icon: '/favicon.svg'
        },
        {
          action: 'dismiss',
          title: 'Depois',
          icon: '/favicon.svg'
        }
      ];
    default:
      return [
        {
          action: 'explore',
          title: 'Ver detalhes',
          icon: '/favicon.svg'
        },
        {
          action: 'dismiss',
          title: 'Fechar',
          icon: '/favicon.svg'
        }
      ];
  }
}