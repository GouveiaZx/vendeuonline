import { useCallback } from 'react';
import { toast } from 'sonner';

export interface NotificationOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface UseNotificationsReturn {
  notifySuccess: (title: string, message?: string, options?: NotificationOptions) => void;
  notifyError: (title: string, message?: string, options?: NotificationOptions) => void;
  notifyInfo: (title: string, message?: string, options?: NotificationOptions) => void;
  notifyWarning: (title: string, message?: string, options?: NotificationOptions) => void;
  notifyLoading: (title: string, message?: string) => string | number;
  dismissNotification: (id: string | number) => void;
  dismissAll: () => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const notifySuccess = useCallback(
    (title: string, message?: string, options?: NotificationOptions) => {
      toast.success(title, {
        description: message,
        duration: options?.duration || 4000,
        position: options?.position || 'bottom-right',
        dismissible: options?.dismissible !== false,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick,
        } : undefined,
      });
    },
    []
  );

  const notifyError = useCallback(
    (title: string, message?: string, options?: NotificationOptions) => {
      toast.error(title, {
        description: message,
        duration: options?.duration || 6000,
        position: options?.position || 'bottom-right',
        dismissible: options?.dismissible !== false,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick,
        } : undefined,
      });
    },
    []
  );

  const notifyInfo = useCallback(
    (title: string, message?: string, options?: NotificationOptions) => {
      toast.info(title, {
        description: message,
        duration: options?.duration || 4000,
        position: options?.position || 'bottom-right',
        dismissible: options?.dismissible !== false,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick,
        } : undefined,
      });
    },
    []
  );

  const notifyWarning = useCallback(
    (title: string, message?: string, options?: NotificationOptions) => {
      toast.warning(title, {
        description: message,
        duration: options?.duration || 5000,
        position: options?.position || 'bottom-right',
        dismissible: options?.dismissible !== false,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick,
        } : undefined,
      });
    },
    []
  );

  const notifyLoading = useCallback(
    (title: string, message?: string) => {
      return toast.loading(title, {
        description: message,
        position: 'bottom-right',
      });
    },
    []
  );

  const dismissNotification = useCallback((id: string | number) => {
    toast.dismiss(id);
  }, []);

  const dismissAll = useCallback(() => {
    toast.dismiss();
  }, []);

  return {
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyWarning,
    notifyLoading,
    dismissNotification,
    dismissAll,
  };
};

export default useNotifications;