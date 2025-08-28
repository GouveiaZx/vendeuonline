'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { notifySuccess, notifyError, notifyWarning } = useNotifications();

  // Verificar suporte a notificações push
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
      }
    }
  }, []);

  // Verificar subscription existente
  useEffect(() => {
    if (isSupported && permission === 'granted') {
      checkExistingSubscription();
    }
  }, [isSupported, permission]);

  const checkExistingSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      setSubscription(existingSubscription);
    } catch (error) {
      console.error('Erro ao verificar subscription existente:', error);
    }
  }, []);

  // Solicitar permissão para notificações
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      notifyError('Notificações não suportadas', 'Seu navegador não suporta notificações push.');
      return false;
    }

    setIsLoading(true);
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        notifySuccess('Permissão concedida', 'Você receberá notificações importantes sobre seus pedidos e ofertas.');
        return true;
      } else if (result === 'denied') {
        notifyWarning('Permissão negada', 'Você pode ativar as notificações nas configurações do navegador.');
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      notifyError('Erro', 'Não foi possível solicitar permissão para notificações.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, notifySuccess, notifyError, notifyWarning]);

  // Registrar subscription para push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported || permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return null;
    }

    setIsLoading(true);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // VAPID public key (você deve gerar suas próprias chaves VAPID)
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f8HnKJuOmqmHzdSSW9Oh6S8ks4dMZYb3MNBpKqoTpEDr3bNJhqo';
      
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      
      setSubscription(pushSubscription);
      
      // Enviar subscription para o servidor
      await sendSubscriptionToServer(pushSubscription);
      
      notifySuccess('Notificações ativadas', 'Você receberá notificações sobre pedidos, ofertas e atualizações importantes.');
      
      return pushSubscription;
    } catch (error) {
      console.error('Erro ao registrar subscription:', error);
      notifyError('Erro ao ativar notificações', 'Não foi possível ativar as notificações push.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, requestPermission, notifySuccess, notifyError]);

  // Cancelar subscription
  const unsubscribe = useCallback(async () => {
    if (!subscription) return true;
    
    setIsLoading(true);
    
    try {
      const success = await subscription.unsubscribe();
      
      if (success) {
        setSubscription(null);
        
        // Remover subscription do servidor
        await removeSubscriptionFromServer(subscription);
        
        notifySuccess('Notificações desativadas', 'Você não receberá mais notificações push.');
      }
      
      return success;
    } catch (error) {
      console.error('Erro ao cancelar subscription:', error);
      notifyError('Erro', 'Não foi possível desativar as notificações.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [subscription, notifySuccess, notifyError]);

  // Enviar subscription para o servidor
  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    try {
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };
      
      // Aqui você enviaria para sua API
      console.log('Subscription data to send to server:', subscriptionData);
      
      // Exemplo de chamada para API:
      // await fetch('/api/push/subscribe', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(subscriptionData)
      // });
    } catch (error) {
      console.error('Erro ao enviar subscription para servidor:', error);
    }
  };

  // Remover subscription do servidor
  const removeSubscriptionFromServer = async (subscription: PushSubscription) => {
    try {
      // Aqui você removeria da sua API
      console.log('Removing subscription from server:', subscription.endpoint);
      
      // Exemplo de chamada para API:
      // await fetch('/api/push/unsubscribe', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ endpoint: subscription.endpoint })
      // });
    } catch (error) {
      console.error('Erro ao remover subscription do servidor:', error);
    }
  };

  // Testar notificação local
  const testNotification = useCallback(() => {
    if (permission !== 'granted') {
      notifyWarning('Permissão necessária', 'Ative as notificações primeiro.');
      return;
    }
    
    new Notification('Teste - Vendeu Online', {
      body: 'Esta é uma notificação de teste do seu marketplace!',
      icon: '/icon-192.svg',
      badge: '/favicon.svg',
      tag: 'test-notification'
    });
  }, [permission, notifyWarning]);

  return {
    isSupported,
    permission,
    subscription,
    isLoading,
    isSubscribed: !!subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification
  };
}

// Utilitários
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}