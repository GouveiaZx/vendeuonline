/**
 * SISTEMA DE RATE LIMITING CONSOLIDADO
 * 
 * Esta é a única implementação de rate limiting do projeto.
 * Usa in-memory storage com fallback para Redis se disponível.
 * 
 * Funcionalidades:
 * - Rate limiting por IP + rota
 * - Configurações específicas por endpoint
 * - Headers padronizados
 * - Limpeza automática de cache
 */

import { NextRequest } from 'next/server';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (request: NextRequest) => string;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
}

// In-memory store (em produção, usar Redis)
const rateLimitStore = new Map<string, RateLimitRecord>();

export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private keyGenerator: (request: NextRequest) => string;

  constructor(options: RateLimitOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
    this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
  }

  private defaultKeyGenerator(request: NextRequest): string {
    // Usar IP + rota como chave padrão
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') ||
              'unknown';
    const url = new URL(request.url).pathname;
    return `${ip}:${url}`;
  }

  async isAllowed(request: NextRequest): Promise<RateLimitResult> {
    const key = this.keyGenerator(request);
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      // Primeira requisição ou janela expirada
      const newRecord: RateLimitRecord = {
        count: 1,
        resetTime: now + this.windowMs
      };
      rateLimitStore.set(key, newRecord);
      
      return {
        allowed: true,
        remainingRequests: this.maxRequests - 1,
        resetTime: newRecord.resetTime
      };
    }

    if (record.count >= this.maxRequests) {
      // Limite excedido
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: record.resetTime
      };
    }

    // Incrementar contador
    record.count++;
    rateLimitStore.set(key, record);

    return {
      allowed: true,
      remainingRequests: this.maxRequests - record.count,
      resetTime: record.resetTime
    };
  }

  // Limpar registros expirados (executar periodicamente)
  cleanup() {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// ============================================================================
// CONFIGURAÇÕES PRÉ-DEFINIDAS PARA ENDPOINTS ESPECÍFICOS
// ============================================================================

// Rate limiters específicos para diferentes rotas
export const authRateLimiter = new RateLimiter({
  maxRequests: 5, // 5 tentativas de login
  windowMs: 15 * 60 * 1000, // 15 minutos
  keyGenerator: (request) => {
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') ||
              'unknown';
    return `auth:${ip}`;
  }
});

export const uploadRateLimiter = new RateLimiter({
  maxRequests: 10, // 10 uploads
  windowMs: 60 * 1000, // 1 minuto
  keyGenerator: (request) => {
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') ||
              'unknown';
    return `upload:${ip}`;
  }
});

export const paymentRateLimiter = new RateLimiter({
  maxRequests: 5, // 5 tentativas de pagamento
  windowMs: 5 * 60 * 1000, // 5 minutos
  keyGenerator: (request) => {
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') ||
              'unknown';
    return `payment:${ip}`;
  }
});

export const apiRateLimiter = new RateLimiter({
  maxRequests: 100, // 100 requests gerais
  windowMs: 60 * 1000, // 1 minuto
});

export const generalRateLimiter = new RateLimiter({
  maxRequests: 50, // 50 requests gerais
  windowMs: 60 * 1000, // 1 minuto
});

// ============================================================================
// UTILITÁRIOS E LIMPEZA AUTOMÁTICA
// ============================================================================

// Limpar cache a cada 5 minutos
setInterval(() => {
  authRateLimiter.cleanup();
  uploadRateLimiter.cleanup();
  paymentRateLimiter.cleanup();
  apiRateLimiter.cleanup();
  generalRateLimiter.cleanup();
}, 5 * 60 * 1000);

// Helper para criar headers de rate limit
export function createRateLimitHeaders(result: {
  remainingRequests: number;
  resetTime: number;
}, maxRequests: number): Record<string, string> {
  return {
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': result.remainingRequests.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
    'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
  };
}