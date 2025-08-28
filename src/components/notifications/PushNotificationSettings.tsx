'use client';

import { useState } from 'react';
import { Bell, BellOff, TestTube, Loader2, Check, X, AlertCircle, Play, Shuffle, Zap } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { usePushNotificationDemo } from '@/hooks/usePushNotificationDemo';

interface PushNotificationSettingsProps {
  className?: string;
}

export default function PushNotificationSettings({ className = '' }: PushNotificationSettingsProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    testNotification
  } = usePushNotifications();
  
  const {
    demoNotifications,
    simulateServiceWorkerNotification,
    simulateRandomNotification,
    simulateNotificationSequence,
    canSimulate
  } = usePushNotificationDemo();

  const [showDetails, setShowDetails] = useState(false);

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return {
          icon: Check,
          text: 'Permitidas',
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        };
      case 'denied':
        return {
          icon: X,
          text: 'Bloqueadas',
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        };
      default:
        return {
          icon: AlertCircle,
          text: 'Não solicitadas',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50'
        };
    }
  };

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  if (!isSupported) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <BellOff className="h-5 w-5 text-gray-400" />
          <div>
            <h3 className="font-medium text-gray-900">Notificações Push</h3>
            <p className="text-sm text-gray-600">Não suportadas neste navegador</p>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getPermissionStatus();
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
              <Bell className={`h-5 w-5 ${statusInfo.color}`} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Notificações Push</h3>
              <div className="flex items-center gap-2 mt-1">
                <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                <span className={`text-sm ${statusInfo.color}`}>
                  {statusInfo.text}
                </span>
                {isSubscribed && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Ativas
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showDetails ? 'Ocultar' : 'Configurar'}
          </button>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                Receba notificações importantes sobre:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Confirmação e status de pedidos</li>
                <li>Novas vendas (para vendedores)</li>
                <li>Ofertas especiais e promoções</li>
                <li>Estoque baixo (para vendedores)</li>
                <li>Mensagens importantes do sistema</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleToggleNotifications}
                disabled={isLoading || permission === 'denied'}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSubscribed
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSubscribed ? (
                  <>
                    <BellOff className="h-4 w-4" />
                    Desativar
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4" />
                    Ativar
                  </>
                )}
              </button>

              {permission === 'granted' && (
                <button
                  onClick={testNotification}
                  className="flex items-center gap-2 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <TestTube className="h-4 w-4" />
                  Testar
                </button>
              )}
            </div>

            {permission === 'denied' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <X className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-red-800">Notificações bloqueadas</p>
                    <p className="text-red-700 mt-1">
                      Para ativar, clique no ícone de cadeado na barra de endereços e permita notificações.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {permission === 'granted' && isSubscribed && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                  <TestTube className="h-4 w-4" />
                  Demonstração de Notificações
                </h4>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={testNotification}
                      className="flex items-center gap-2 py-2 px-3 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm"
                    >
                      <Bell className="h-4 w-4" />
                      Teste Simples
                    </button>
                    
                    <button
                      onClick={simulateRandomNotification}
                      className="flex items-center gap-2 py-2 px-3 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm"
                    >
                      <Shuffle className="h-4 w-4" />
                      Aleatória
                    </button>
                    
                    <button
                      onClick={simulateNotificationSequence}
                      className="flex items-center gap-2 py-2 px-3 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm"
                    >
                      <Zap className="h-4 w-4" />
                      Sequência
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {demoNotifications.slice(0, 4).map((notification, index) => (
                      <button
                        key={index}
                        onClick={() => simulateServiceWorkerNotification(notification)}
                        className="flex items-start gap-2 py-2 px-3 bg-white border border-green-300 text-left rounded-lg hover:bg-green-50 transition-colors text-xs"
                      >
                        <Play className="h-3 w-3 mt-0.5 text-green-600" />
                        <div>
                          <div className="font-medium text-green-800">{notification.title}</div>
                          <div className="text-green-600 truncate">{notification.body}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <p className="text-xs text-green-700">
                    💡 Teste diferentes tipos de notificação para ver como funcionam!
                  </p>
                </div>
              </div>
            )}
            
            {permission === 'default' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">Permissão necessária</p>
                    <p className="text-blue-700 mt-1">
                      Clique em "Ativar" para solicitar permissão para notificações.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}