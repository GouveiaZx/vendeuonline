/**
 * Hook para usar localStorage de forma segura (SSR-safe)
 */

import { useState, useEffect } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State para armazenar o valor
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isClient, setIsClient] = useState(false)

  // Efeito para carregamento inicial (apenas no client)
  useEffect(() => {
    setIsClient(true)
    
    try {
      // Obter do localStorage do navegador
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      // Se erro, usar valor inicial
      console.warn(`Error reading localStorage key "${key}":`, error)
      setStoredValue(initialValue)
    }
  }, [key, initialValue])

  // Função para setar valor
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permite que value seja uma função para que possamos atualizar com base no valor anterior
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Salva no state
      setStoredValue(valueToStore)
      
      // Salva no localStorage apenas no client
      if (isClient && typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      // Mais resiliente a erros
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}

/**
 * Hook simples para verificar se uma chave existe no localStorage
 */
export function useLocalStorageItem(key: string): [boolean, () => void, () => void] {
  const [exists, setExists] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    if (typeof window !== 'undefined') {
      setExists(localStorage.getItem(key) !== null)
    }
  }, [key])

  const setItem = () => {
    if (isClient && typeof window !== 'undefined') {
      localStorage.setItem(key, 'true')
      setExists(true)
    }
  }

  const removeItem = () => {
    if (isClient && typeof window !== 'undefined') {
      localStorage.removeItem(key)
      setExists(false)
    }
  }

  return [exists, setItem, removeItem]
}