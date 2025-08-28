'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Download, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface ServiceWorkerManagerProps {
  className?: string;
}

interface ServiceWorkerUpdate {
  version: string;
  timestamp: number;
  registration?: ServiceWorkerRegistration;
}

export const ServiceWorkerManager: React.FC<ServiceWorkerManagerProps> = ({ 
  className = '' 
}) => {
  const [updateAvailable, setUpdateAvailable] = useState<ServiceWorkerUpdate | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { notifySuccess, notifyError, notifyInfo } = useNotifications();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
      setupServiceWorkerListeners();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Verificar se há uma atualização aguardando
      if (registration.waiting) {
        setUpdateAvailable({
          version: 'Nova versão',
          timestamp: Date.now(),
          registration
        });
      }

      // Listener para novas atualizações
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable({
                version: 'Nova versão',
                timestamp: Date.now(),
                registration
              });
            }
          });
        }
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const setupServiceWorkerListeners = () => {
    // Listener para mensagens do Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, version, timestamp } = event.data;
      
      switch (type) {
        case 'SW_UPDATED':
          notifyInfo(
            'App Atualizado',
            `Nova versão ${version} instalada com sucesso!`
          );
          break;
          
        case 'CACHE_UPDATED':
          // Cache atualizado - não é mais necessário mostrar informações
          break;
          
        case 'OFFLINE_READY':
          notifySuccess(
            'Modo Offline Ativo',
            'O app está pronto para funcionar offline!'
          );
          break;
      }
    });

    // Listener para mudanças de conectividade
    window.addEventListener('online', () => {
      notifySuccess('Conectado', 'Conexão com a internet restaurada!');
    });

    window.addEventListener('offline', () => {
      notifyInfo('Offline', 'Você está offline. Algumas funcionalidades podem estar limitadas.');
    });
  };



  const handleUpdate = async () => {
    if (!updateAvailable?.registration) return;
    
    setIsUpdating(true);
    
    try {
      // Ativar o novo Service Worker
      if (updateAvailable.registration.waiting) {
        updateAvailable.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      // Aguardar a ativação e recarregar
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
      
    } catch (error) {
      console.error('Update failed:', error);
      notifyError('Erro na Atualização', 'Falha ao atualizar o app. Tente novamente.');
      setIsUpdating(false);
    }
  };



  const dismissUpdate = () => {
    setUpdateAvailable(null);
  };

  return (
    <div className={`service-worker-manager ${className}`}>
      {/* Notificação de Atualização */}
      {updateAvailable && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center">
              <Download className="h-5 w-5 mr-2" />
              <h3 className="font-semibold">Atualização Disponível</h3>
            </div>
            <button
              onClick={dismissUpdate}
              className="text-blue-200 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <p className="text-sm text-blue-100 mb-3">
            Uma nova versão do app está disponível com melhorias e correções.
          </p>
          
          <div className="flex space-x-2">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1 bg-white text-blue-600 px-3 py-2 rounded text-sm font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Atualizando...
                </div>
              ) : (
                'Atualizar Agora'
              )}
            </button>
            
            <button
              onClick={dismissUpdate}
              className="px-3 py-2 text-blue-200 hover:text-white text-sm"
            >
              Depois
            </button>
          </div>
        </div>
      )}


    </div>
  );
};

export default ServiceWorkerManager;