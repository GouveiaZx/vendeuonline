'use client';

import { useEffect, useState } from 'react';

/**
 * Hook universal para detectar quando a hidratação foi completada
 * Resolve problemas de SSR e melhora a performance inicial
 */
export const useHydrated = (): boolean => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Garantir que a hidratação foi completada
    const timer = setTimeout(() => {
      setHydrated(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return hydrated;
};

/**
 * Hook para executar código apenas após hidratação completa
 */
export const useAfterHydration = (callback: () => void, deps: any[] = []) => {
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated) {
      callback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, ...deps]);
};

/**
 * Hook para valores que devem ser diferentes no servidor vs cliente
 */
export const useSSRSafeValue = <T>(serverValue: T, clientValue: T): T => {
  const hydrated = useHydrated();
  return hydrated ? clientValue : serverValue;
};