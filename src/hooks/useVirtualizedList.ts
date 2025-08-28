import { useState, useMemo, useCallback, useRef } from 'react';

interface VirtualizedListOptions<T> {
  items: T[];
  searchQuery?: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
}

interface VirtualizedListReturn<T> {
  visibleItems: T[];
  totalHeight: number;
  scrollTop: number;
  containerRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  updateList: () => void;
}

export function useVirtualizedList<T>({
  items = [],
  searchQuery = '',
  filters = {},
  sortBy = 'createdAt',
  sortOrder = 'desc',
  itemHeight = 100,
  containerHeight = 400,
  overscan = 5,
}: VirtualizedListOptions<T>): VirtualizedListReturn<T> {

  // Filtrar itens baseado no termo de busca
  const filteredItems = useMemo(() => {
    let result = items;

    // Aplicar filtro de busca
    if (searchQuery) {
      result = result.filter(item => {
        const searchableFields = Object.values(item as any)
          .filter(value => typeof value === 'string')
          .join(' ')
          .toLowerCase();
        return searchableFields.includes(searchQuery.toLowerCase());
      });
    }

    // Aplicar outros filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        result = result.filter(item => {
          const itemValue = (item as any)[key];
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }
          return itemValue === value;
        });
      }
    });

    return result;
  }, [items, searchQuery, filters]);

  // Ordenar items
  const sortedItems = useMemo(() => {
    const filtered = [...filteredItems];

    // Ordenar
    filtered.sort((a: T, b: T) => {
      const aValue = (a as Record<string, unknown>)[sortBy as string];
      const bValue = (b as Record<string, unknown>)[sortBy as string];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' 
          ? (aValue > bValue ? 1 : -1)
          : (bValue > aValue ? 1 : -1);
      }
      
      return 0;
    });

    return filtered;
  }, [filteredItems, sortBy, sortOrder]);

  // Virtualização
  const [scrollTop, setScrollTop] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      sortedItems.length
    );
    return sortedItems.slice(Math.max(0, startIndex - overscan), endIndex);
  }, [sortedItems, scrollTop, itemHeight, containerHeight, overscan]);

  const totalHeight = sortedItems.length * itemHeight;
  const hasMore = false; // Para compatibilidade

  // Função para carregar mais itens
  const loadMore = useCallback(() => {
    // Implementação vazia para compatibilidade
  }, []);

  // Função para atualizar a lista
  const updateList = useCallback(() => {
    setScrollTop(0);
  }, []);

  return {
    visibleItems,
    totalHeight,
    scrollTop,
    containerRef,
    isLoading,
    hasMore,
    loadMore,
    updateList
  };
}

// Hooks específicos removidos temporariamente devido a problemas de tipagem nos stores

// Hook para infinite scroll
export function useInfiniteScroll<T>(
  loadMore: () => void,
  hasMore: boolean,
  loading: boolean,
  threshold = 100
) {
  const [lastScrollTop, setLastScrollTop] = useState(0);

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
      
      // Verificar se está rolando para baixo
      if (scrollTop > lastScrollTop) {
        const bottomOffset = scrollHeight - scrollTop - clientHeight;
        
        if (bottomOffset <= threshold && hasMore && !loading) {
          loadMore();
        }
      }
      
      setLastScrollTop(scrollTop);
    },
    [loadMore, hasMore, loading, threshold, lastScrollTop]
  );

  return handleScroll;
}