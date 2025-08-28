// Sistema de cache simples para otimizar performance
// Em produção, considere usar Redis ou similar

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutos padrão

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Limpar cache automaticamente após TTL
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Verificar se ainda está válido
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Invalidar cache por padrão (ex: "products:*")
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'));
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Estatísticas do cache
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instância global do cache
export const cache = new MemoryCache();

// Utilitários de cache específicos

export const CacheKeys = {
  PRODUCT: (id: string) => `product:${id}`,
  PRODUCTS_BY_SELLER: (sellerId: string, page: number = 1) => `products:seller:${sellerId}:page:${page}`,
  PRODUCTS_BY_CATEGORY: (categoryId: string, page: number = 1) => `products:category:${categoryId}:page:${page}`,
  STORE: (id: string) => `store:${id}`,
  STORE_BY_SELLER: (sellerId: string) => `store:seller:${sellerId}`,
  USER: (id: string) => `user:${id}`,
  CATEGORY: (id: string) => `category:${id}`,
  CATEGORIES_ALL: () => 'categories:all',
  ORDERS_BY_BUYER: (buyerId: string, page: number = 1) => `orders:buyer:${buyerId}:page:${page}`,
  ORDERS_BY_SELLER: (sellerId: string, page: number = 1) => `orders:seller:${sellerId}:page:${page}`,
  REVIEWS_BY_PRODUCT: (productId: string) => `reviews:product:${productId}`,
  ANALYTICS_SALES: (startDate: string, endDate: string) => `analytics:sales:${startDate}:${endDate}`,
} as const;

// Cache TTLs específicos (em milliseconds)
export const CacheTTL = {
  SHORT: 2 * 60 * 1000,    // 2 minutos
  MEDIUM: 15 * 60 * 1000,   // 15 minutos
  LONG: 60 * 60 * 1000,     // 1 hora
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 horas
} as const;

// Hook para invalidação automática de cache
export const invalidateCache = {
  // Quando produto é criado/atualizado/deletado
  onProductChange: (productId: string, sellerId?: string, categoryId?: string) => {
    cache.delete(CacheKeys.PRODUCT(productId));
    
    if (sellerId) {
      cache.invalidatePattern(`products:seller:${sellerId}:*`);
    }
    
    if (categoryId) {
      cache.invalidatePattern(`products:category:${categoryId}:*`);
    }
  },

  // Quando loja é atualizada
  onStoreChange: (storeId: string, sellerId: string) => {
    cache.delete(CacheKeys.STORE(storeId));
    cache.delete(CacheKeys.STORE_BY_SELLER(sellerId));
    cache.invalidatePattern(`products:seller:${sellerId}:*`);
  },

  // Quando pedido é criado/atualizado
  onOrderChange: (orderId: string, buyerId: string, sellerId?: string) => {
    cache.invalidatePattern(`orders:buyer:${buyerId}:*`);
    
    if (sellerId) {
      cache.invalidatePattern(`orders:seller:${sellerId}:*`);
    }
    
    // Invalidar analytics
    cache.invalidatePattern('analytics:*');
  },

  // Quando review é criada/atualizada
  onReviewChange: (productId: string, sellerId?: string) => {
    cache.delete(CacheKeys.REVIEWS_BY_PRODUCT(productId));
    cache.delete(CacheKeys.PRODUCT(productId));
    
    if (sellerId) {
      cache.invalidatePattern(`products:seller:${sellerId}:*`);
    }
  },

  // Limpar tudo (usar com cuidado)
  all: () => {
    cache.clear();
  }
};

// Decorator para cache automático em funções
export function cached<T extends any[], R>(
  keyFn: (...args: T) => string,
  ttl: number = CacheTTL.MEDIUM
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: T): Promise<R> {
      const key = keyFn(...args);
      const cached = cache.get<R>(key);
      
      if (cached !== null) {
        return cached;
      }

      const result = await method.apply(this, args);
      cache.set(key, result, ttl);
      
      return result;
    };
  };
}

// Utilitário para cache em API routes
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CacheTTL.MEDIUM
): Promise<T> {
  const cached = cache.get<T>(key);
  
  if (cached !== null) {
    return cached;
  }

  const result = await fetcher();
  cache.set(key, result, ttl);
  
  return result;
}

// Rate limiting simples baseado em cache
export class RateLimiter {
  private prefix = 'rate_limit:';

  async checkLimit(
    identifier: string, 
    windowMs: number = 60000, // 1 minuto
    maxRequests: number = 100
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `${this.prefix}${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const current = cache.get<{ requests: number[]; }>(key) || { requests: [] };
    
    // Filtrar requests dentro da janela
    current.requests = current.requests.filter(timestamp => timestamp > windowStart);
    
    const remaining = Math.max(0, maxRequests - current.requests.length);
    const allowed = current.requests.length < maxRequests;
    
    if (allowed) {
      current.requests.push(now);
      cache.set(key, current, windowMs);
    }
    
    return {
      allowed,
      remaining: remaining - (allowed ? 1 : 0),
      resetTime: windowStart + windowMs
    };
  }
}

export const rateLimiter = new RateLimiter();