import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor, Tablet } from 'lucide-react';
import { useLocalStorageItem } from '@/hooks/useLocalStorage';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPromptProps {
  onClose?: () => void;
  className?: string;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ onClose, className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<string>('');
  const [isInstalling, setIsInstalling] = useState(false);
  
  // Usar hooks seguros para localStorage
  const [isInstallDismissed, setInstallDismissed, removeInstallDismissed] = useLocalStorageItem('pwa-install-dismissed');
  const [isAppInstalled, setAppInstalled, removeAppInstalled] = useLocalStorageItem('pwa-installed');

  useEffect(() => {
    // Detectar plataforma apenas no client
    if (typeof window !== 'undefined' && navigator) {
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('android')) {
        setPlatform('Android');
      } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      setPlatform('iOS');
    } else if (userAgent.includes('windows')) {
      setPlatform('Windows');
    } else if (userAgent.includes('mac')) {
      setPlatform('macOS');
    } else {
      setPlatform('Desktop');
    }

      // Verificar se já está instalado
      const checkIfInstalled = () => {
        if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
          setAppInstalled();
          return;
        }
        
        if ((navigator as any).standalone === true) {
          setAppInstalled();
          return;
        }
        
        if (document.referrer.includes('android-app://')) {
          setAppInstalled();
          return;
        }
      };

      checkIfInstalled();

      // Listener para o evento beforeinstallprompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        const beforeInstallPromptEvent = e as BeforeInstallPromptEvent;
        setDeferredPrompt(beforeInstallPromptEvent);
        
        // Mostrar prompt após um delay para não ser intrusivo
        setTimeout(() => {
          if (!isAppInstalled && !isInstallDismissed) {
            setShowPrompt(true);
          }
        }, 3000);
      };

      // Listener para quando o app é instalado
      const handleAppInstalled = () => {
        setAppInstalled(); // Usar hook seguro
        setShowPrompt(false);
        setDeferredPrompt(null);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, [isAppInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted');
      } else {
        console.log('PWA installation dismissed');
      }
    } catch (error) {
      console.error('Error during PWA installation:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setInstallDismissed(); // Usar hook seguro
    onClose?.();
  };

  const getDeviceIcon = () => {
    if (platform.includes('Android') || platform.includes('iOS')) {
      return <Smartphone className="w-6 h-6" />;
    } else if (platform.includes('iPad')) {
      return <Tablet className="w-6 h-6" />;
    } else {
      return <Monitor className="w-6 h-6" />;
    }
  };

  const getInstallInstructions = () => {
    if (platform === 'iOS') {
      return (
        <div className="text-sm text-gray-600 mt-2">
          <p>Para instalar no iOS:</p>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Toque no ícone de compartilhar</li>
            <li>Selecione "Adicionar à Tela de Início"</li>
            <li>Toque em "Adicionar"</li>
          </ol>
        </div>
      );
    }
    return null;
  };

  // Não mostrar se já está instalado ou se não há prompt disponível
  if (isAppInstalled || (!showPrompt && !deferredPrompt)) {
    return null;
  }

  // Para iOS, mostrar instruções manuais
  if (platform === 'iOS' && !deferredPrompt) {
    return (
      <div className={`fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 ${className}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {getDeviceIcon()}
            <div>
              <h3 className="font-semibold text-gray-900">Instalar Vendeu Online</h3>
              <p className="text-sm text-gray-600">Acesse rapidamente nossa plataforma</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {getInstallInstructions()}
      </div>
    );
  }

  // Para outros navegadores com suporte nativo
  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getDeviceIcon()}
          <div>
            <h3 className="font-semibold text-gray-900">Instalar Vendeu Online</h3>
            <p className="text-sm text-gray-600">Acesse rapidamente nossa plataforma</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex space-x-2 mt-3">
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>{isInstalling ? 'Instalando...' : 'Instalar'}</span>
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Agora não
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;