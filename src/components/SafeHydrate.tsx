'use client';

import { useState, useEffect } from 'react';
import { useHydrated } from '@/hooks/useHydrated';
import LoadingSpinner from '@/components/ui/feedback/LoadingSpinner';

interface SafeHydrateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  /**
   * Atraso adicional em ms antes de mostrar o conteúdo
   * Útil para components que precisam de inicialização extra
   */
  delay?: number;
}

/**
 * Componente avançado para hidratação segura
 * Inclui estados de loading e delay opcional
 */
export const SafeHydrate = ({ 
  children, 
  fallback = null, 
  loading = <LoadingSpinner size="sm" />,
  delay = 0
}: SafeHydrateProps) => {
  const hydrated = useHydrated();

  if (!hydrated) {
    // Durante SSR, mostra o fallback
    return <>{fallback}</>;
  }

  if (delay > 0) {
    // Se há delay, mostra loading por um tempo adicional
    return (
      <DelayedRender delay={delay} loading={loading}>
        {children}
      </DelayedRender>
    );
  }

  return <>{children}</>;
};

/**
 * Componente helper para renderização com delay
 */
const DelayedRender = ({ 
  children, 
  delay, 
  loading 
}: { 
  children: React.ReactNode; 
  delay: number; 
  loading: React.ReactNode; 
}) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!ready) {
    return <>{loading}</>;
  }

  return <>{children}</>;
};