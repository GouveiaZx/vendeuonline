'use client';

import { useAfterHydration } from '@/hooks/useHydrated';
import { useSearchStore } from '@/store/searchStore';
import { useAuthStore } from '@/store/authStore';
import { useProductStore } from '@/store/productStore';
import { useStoreStore } from '@/store/storeStore';

/**
 * Componente para hidratar as stores Zustand de forma segura
 * Deve ser colocado no layout raiz para garantir hidratação adequada
 * Atualizado para usar padrão de hidratação otimizado
 */
export const StoreHydration = () => {
  // Hidratar stores apenas após hidratação completa do React
  useAfterHydration(() => {
    // Verificar se as stores têm o método persist antes de chamar
    if (useSearchStore.persist?.rehydrate) {
      useSearchStore.persist.rehydrate();
    }
    
    if (useAuthStore.persist?.rehydrate) {
      useAuthStore.persist.rehydrate();
    }
    
    if (useProductStore.persist?.rehydrate) {
      useProductStore.persist.rehydrate();
    }
    
    if (useStoreStore.persist?.rehydrate) {
      useStoreStore.persist.rehydrate();
    }
  });

  // Este componente não renderiza nada
  return null;
};

export default StoreHydration;