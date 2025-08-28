'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface HydrationContextType {
  isHydrated: boolean;
  isStoresReady: boolean;
}

const HydrationContext = createContext<HydrationContextType>({
  isHydrated: false,
  isStoresReady: false,
});

export const useHydrationContext = () => useContext(HydrationContext);

interface HydrationProviderProps {
  children: React.ReactNode;
}

/**
 * Provider que gerencia o estado global de hidratação
 * Garante que todos os componentes tenham acesso ao estado correto
 */
export const HydrationProvider = ({ children }: HydrationProviderProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isStoresReady, setIsStoresReady] = useState(false);

  useEffect(() => {
    // Marcar como hidratado
    setIsHydrated(true);

    // Aguardar um pouco para garantir que as stores estejam prontas
    const timer = setTimeout(() => {
      setIsStoresReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <HydrationContext.Provider value={{ isHydrated, isStoresReady }}>
      {children}
    </HydrationContext.Provider>
  );
};