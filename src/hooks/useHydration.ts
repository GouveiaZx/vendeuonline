'use client';

import { useEffect, useState } from 'react';

/**
 * Hook para detectar se o componente foi hidratado no cliente
 * Útil para prevenir erros de hydration
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * Hook para gerenciar inicialização de stores após hydration
 */
export function useStoreHydration<T>(
  store: any,
  hydrateMethod?: string
) {
  const isHydrated = useHydration();

  useEffect(() => {
    if (isHydrated && store && hydrateMethod && typeof store[hydrateMethod] === 'function') {
      store[hydrateMethod]();
    }
  }, [isHydrated, store, hydrateMethod]);

  return isHydrated;
}

/**
 * Hook que retorna valor apenas após hydration
 * Previne inconsistências entre servidor e cliente
 */
export function useClientValue<T>(
  clientValue: T,
  serverValue: T | null = null
): T | null {
  const isHydrated = useHydration();
  return isHydrated ? clientValue : serverValue;
}