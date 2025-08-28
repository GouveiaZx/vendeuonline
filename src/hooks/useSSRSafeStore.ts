/**
 * SSR-Safe Store Wrapper
 * Provides safe access to Zustand stores during SSR
 */

import { useEffect, useState } from 'react'

/**
 * Hook para usar stores de forma segura durante SSR
 * Evita erros de hidratação e getServerSnapshot
 */
export const useSSRSafeStore = <T>(
  useStore: () => T,
  fallback: T
): T => {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Sempre chama o hook, mas retorna o fallback se não estiver no cliente
  const storeValue = useStore()
  
  // Durante SSR ou antes da hidratação, retorna fallback
  if (!isClient) {
    return fallback
  }
  
  // Após hidratação, usa o store real
  return storeValue
}

/**
 * Hook para usar seletores de store de forma segura durante SSR
 */
export const useSSRSafeSelector = <TState, TSelected>(
  useStore: (selector: (state: TState) => TSelected) => TSelected,
  selector: (state: TState) => TSelected,
  fallback: TSelected
): TSelected => {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Sempre chama o hook, mas retorna o fallback se não estiver no cliente
  const storeValue = useStore(selector)
  
  if (!isClient) {
    return fallback
  }
  
  return storeValue
}

/**
 * Hook para verificar se está no lado cliente
 */
export const useIsClient = (): boolean => {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  return isClient
}