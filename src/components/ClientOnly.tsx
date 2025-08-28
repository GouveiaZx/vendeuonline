'use client';

import { useHydrated } from '@/hooks/useHydrated';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /**
   * Se true, renderiza o fallback durante o carregamento.
   * Se false, não renderiza nada durante o carregamento (padrão).
   */
  showFallback?: boolean;
}

/**
 * Componente que renderiza children apenas no lado cliente após hidratação completa
 * Evita erros de hidratação e melhora a experiência do usuário
 * Atualizado para usar o hook useHydrated otimizado
 */
export function ClientOnly({ children, fallback = null, showFallback = false }: ClientOnlyProps) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return showFallback ? (fallback as React.ReactElement) : null;
  }

  return children as React.ReactElement;
}