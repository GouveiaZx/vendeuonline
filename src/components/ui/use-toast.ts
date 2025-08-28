import { useState, useCallback, useEffect } from 'react';
import { generateToastId } from '@/lib/ssrUtils';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

interface ToastState {
  toasts: Toast[];
}

let toasts: Toast[] = [];
let listeners: Array<(state: ToastState) => void> = [];

const dispatch = (action: { type: 'ADD_TOAST' | 'REMOVE_TOAST'; toast?: Toast; id?: string }) => {
  switch (action.type) {
    case 'ADD_TOAST':
      if (action.toast) {
        toasts = [...toasts, action.toast];
      }
      break;
    case 'REMOVE_TOAST':
      if (action.id) {
        toasts = toasts.filter((t) => t.id !== action.id);
      }
      break;
  }
  listeners.forEach((listener) => listener({ toasts }));
};

const genId = () => {
  return generateToastId();
};

export const toast = ({
  title,
  description,
  action,
  variant = 'default',
}: Omit<Toast, 'id'>) => {
  const id = genId();
  dispatch({
    type: 'ADD_TOAST',
    toast: {
      id,
      title,
      description,
      action,
      variant,
    },
  });

  setTimeout(() => {
    dispatch({ type: 'REMOVE_TOAST', id });
  }, 5000);
};

export const useToast = () => {
  const [state, setState] = useState<ToastState>({ toasts });

  const addListener = useCallback((listener: (state: ToastState) => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = addListener(setState);
    return unsubscribe;
  }, [addListener]);

  return {
    toasts: state.toasts,
    toast,
    dismiss: (id: string) => dispatch({ type: 'REMOVE_TOAST', id }),
  };
};