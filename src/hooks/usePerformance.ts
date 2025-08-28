import { useEffect, useRef, useCallback, useState } from 'react';
import { logWarn } from '@/lib/logger';

// Constante para nome do cache
const CACHE_NAME = 'marketplace-cache-v1';

// Hook para debounce
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook para throttle
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
};

// Hook para lazy loading de componentes
export const useLazyLoad = (threshold = 0.1, rootMargin = '0px') => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, hasLoaded]);

  return { elementRef, isVisible, hasLoaded };
};

// Hook para medir performance
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<{
    loadTime?: number;
    renderTime?: number;
    memoryUsage?: number;
  }>({});

  const measureRenderTime = useCallback((componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        renderTime
      }));
      
      // Log para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
      }
    };
  }, []);

  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
      }));
    }
  }, []);

  useEffect(() => {
    // Medir tempo de carregamento inicial
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    setMetrics(prev => ({ ...prev, loadTime }));

    // Medir uso de memória periodicamente
    const interval = setInterval(measureMemoryUsage, 5000);
    
    return () => clearInterval(interval);
  }, [measureMemoryUsage]);

  return { metrics, measureRenderTime, measureMemoryUsage };
};

// Hook para cache de dados
export const useCache = <T>(key: string, ttl = 5 * 60 * 1000) => { // 5 minutos padrão
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCachedData = useCallback((): T | null => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const { data: cachedData, timestamp } = JSON.parse(cached);
      const now = Date.now();

      if (now - timestamp > ttl) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return cachedData;
    } catch {
      return null;
    }
  }, [key, ttl]);

  const setCachedData = useCallback((newData: T) => {
    try {
      const cacheEntry = {
        data: newData,
        timestamp: Date.now()
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
      setData(newData);
    } catch (error) {
      console.warn('Erro ao salvar no cache:', error);
    }
  }, [key]);

  const fetchData = useCallback(async (fetcher: () => Promise<T>) => {
    // Verificar cache primeiro
    const cached = getCachedData();
    if (cached) {
      setData(cached);
      return cached;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setCachedData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getCachedData, setCachedData]);

  const clearCache = useCallback(() => {
    localStorage.removeItem(`cache_${key}`);
    setData(null);
  }, [key]);

  // Carregar dados do cache na inicialização
  useEffect(() => {
    const cached = getCachedData();
    if (cached) {
      setData(cached);
    }
  }, [getCachedData]);

  return {
    data,
    isLoading,
    error,
    fetchData,
    setCachedData,
    clearCache
  };
};

// Hook para otimizar re-renders
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  const callbackRef = useRef(callback);
  const depsRef = useRef(deps);

  // Atualizar callback apenas se as dependências mudaram
  if (!depsRef.current || deps.some((dep, index) => dep !== depsRef.current![index])) {
    callbackRef.current = callback;
    depsRef.current = deps;
  }

  return useCallback(callbackRef.current, deps);
};

// Hook para virtual scrolling (lista grande)
export const useVirtualScroll = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

  useEffect(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    setVisibleRange({ start: startIndex, end: endIndex });
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange
  };
};

// Hook para preload de imagens
export const useImagePreload = (urls: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const saveToCache = useCallback(async (key: string, data: any) => {
    try {
      if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(key, new Response(JSON.stringify(data)));
      }
    } catch (error) {
      logWarn('Erro ao salvar no cache:', error);
    }
  }, []);

  const preloadImages = useCallback(async (urls: string[]) => {
    const promises = urls.map(async (url) => {
      try {
        const img = new Image();
        img.src = url;
        await img.decode();
        return url;
      } catch (error) {
        logWarn('Erro ao precarregar imagens:', error);
        return null;
      }
    });

    const results = await Promise.allSettled(promises);
    return results
      .filter((result): result is PromiseFulfilledResult<string> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }, []);

  useEffect(() => {
    if (urls.length > 0) {
      preloadImages(urls);
    }
  }, [preloadImages, urls]);

  return { loadedImages, isLoading, preloadImages };
};

// Hook para detectar conexão lenta
export const useNetworkStatus = () => {
  // Inicializar com true para evitar problemas de hidratação
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    // Definir o estado real da conectividade após hidratação
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detectar tipo de conexão
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection.effectiveType || 'unknown');
      setIsSlowConnection(['slow-2g', '2g'].includes(connection.effectiveType));

      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown');
        setIsSlowConnection(['slow-2g', '2g'].includes(connection.effectiveType));
      };

      connection.addEventListener('change', handleConnectionChange);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType, isSlowConnection };
};

// Hook para cleanup automático
export const useCleanup = (cleanup: () => void, deps: React.DependencyList = []) => {
  useEffect(() => {
    return cleanup;
  }, deps);
};

// Utilitários de performance
export const performanceUtils = {
  // Medir tempo de execução de função
  measureTime: async <T>(fn: () => Promise<T> | T, label?: string): Promise<T> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    if (label && process.env.NODE_ENV === 'development') {
      console.log(`${label}: ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  },

  // Agrupar múltiplas operações DOM
  batchDOMUpdates: (updates: (() => void)[]): void => {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  },

  // Verificar se o dispositivo suporta WebP
  supportsWebP: (): Promise<boolean> => {
    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  },

  // Limpar cache antigo
  cleanupOldCache: (maxAge = 24 * 60 * 60 * 1000): void => { // 24 horas
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache_')) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            if (now - timestamp > maxAge) {
              keysToRemove.push(key);
            }
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
};