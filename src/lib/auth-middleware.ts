/**
 * MIDDLEWARE UNIFICADO DE AUTENTICAÇÃO
 * 
 * Este arquivo centraliza toda a lógica de autenticação e autorização
 * do projeto, substituindo os múltiplos middlewares anteriores.
 * 
 * Features:
 * - Verificação de JWT tokens
 * - Rate limiting inteligente  
 * - Validação de tipos de usuário
 * - Headers de segurança
 * - Logging estruturado
 * - Cache de autenticação
 * - Tratamento de erros padronizado
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getUserFromToken } from '@/lib/auth'
import { User, UserType, AuthTokenPayload } from '@/types'

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

export interface AuthenticatedRequest extends NextRequest {
  user?: User
  userId?: string
  userType?: UserType
}

export interface AuthMiddlewareOptions {
  requiredUserTypes?: UserType[]
  requireAuth?: boolean
  skipRateLimit?: boolean
  skipSecurityHeaders?: boolean
  skipCache?: boolean
  adminOnly?: boolean
  sellerOnly?: boolean
  buyerOnly?: boolean
}

export interface AuthMiddlewareResult {
  success: boolean
  user?: User
  error?: string
  statusCode?: number
}

// ============================================================================
// CACHE DE AUTENTICAÇÃO
// ============================================================================

interface CacheEntry {
  user: User
  timestamp: number
  ttl: number
}

class AuthCache {
  private cache = new Map<string, CacheEntry>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutos

  get(key: string): User | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.user
  }

  set(key: string, user: User, ttl?: number): void {
    this.cache.set(key, {
      user,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }
}

const authCache = new AuthCache()

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  count: number
  resetTime: number
  isBlocked?: boolean
}

class AuthRateLimiter {
  private limits = new Map<string, RateLimitEntry>()
  
  // Diferentes limites baseados no endpoint
  private readonly limits_config = {
    login: { max: 5, window: 15 * 60 * 1000 }, // 5 tentativas por 15min
    register: { max: 3, window: 60 * 60 * 1000 }, // 3 tentativas por hora
    api: { max: 100, window: 15 * 60 * 1000 }, // 100 reqs por 15min
    admin: { max: 200, window: 15 * 60 * 1000 } // 200 reqs por 15min para admin
  }
  
  check(key: string, type: 'login' | 'register' | 'api' | 'admin' = 'api'): {
    allowed: boolean
    remaining: number
    resetTime: number
  } {
    const config = this.limits_config[type]
    const now = Date.now()
    const entry = this.limits.get(key)
    
    if (!entry || now >= entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.window
      })
      return { 
        allowed: true, 
        remaining: config.max - 1, 
        resetTime: now + config.window 
      }
    }
    
    if (entry.count >= config.max || entry.isBlocked) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: entry.resetTime 
      }
    }
    
    entry.count++
    return { 
      allowed: true, 
      remaining: config.max - entry.count, 
      resetTime: entry.resetTime 
    }
  }
  
  block(key: string, duration: number = 60 * 60 * 1000): void {
    const entry = this.limits.get(key) || { count: 0, resetTime: Date.now() }
    entry.isBlocked = true
    entry.resetTime = Date.now() + duration
    this.limits.set(key, entry)
  }
}

const rateLimiter = new AuthRateLimiter()

// ============================================================================
// UTILIDADES
// ============================================================================

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 'unknown'
  
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return `${ip}_${userAgent.substring(0, 50)}`
}

function extractToken(request: NextRequest): string | null {
  // Prioridade: Authorization header > Cookie
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Fallback para cookie (para casos de SSR)
  const cookieToken = request.cookies.get('auth-token')?.value
  return cookieToken || null
}

function createErrorResponse(
  message: string, 
  statusCode: number = 401,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      statusCode,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    },
    { 
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Error-Type': 'AuthError'
      }
    }
  )
}

// ============================================================================
// MIDDLEWARE PRINCIPAL
// ============================================================================

export async function authMiddleware(
  request: NextRequest,
  options: AuthMiddlewareOptions = {}
): Promise<AuthMiddlewareResult> {
  const startTime = Date.now()
  const clientId = getClientIdentifier(request)
  
  try {
    // 1. RATE LIMITING
    if (!options.skipRateLimit) {
      const endpoint = request.nextUrl.pathname
      let limitType: 'login' | 'register' | 'api' | 'admin' = 'api'
      
      if (endpoint.includes('/auth/login')) limitType = 'login'
      else if (endpoint.includes('/auth/register')) limitType = 'register'
      else if (endpoint.includes('/admin/')) limitType = 'admin'
      
      const rateLimitResult = rateLimiter.check(clientId, limitType)
      
      if (!rateLimitResult.allowed) {
        console.warn(`Rate limit exceeded for ${clientId} on ${endpoint}`)
        return {
          success: false,
          error: 'Rate limit exceeded',
          statusCode: 429
        }
      }
    }
    
    // 2. EXTRAÇÃO DO TOKEN
    const token = extractToken(request)
    
    if (!token) {
      if (options.requireAuth !== false) {
        return {
          success: false,
          error: 'Token de autenticação necessário',
          statusCode: 401
        }
      }
      return { success: true } // Permitir acesso sem auth se não requerido
    }
    
    // 3. VERIFICAÇÃO EM CACHE
    const cacheKey = `auth_${token.substring(0, 16)}`
    let user: User | null = null
    
    if (!options.skipCache) {
      user = authCache.get(cacheKey)
    }
    
    // 4. VERIFICAÇÃO DO TOKEN E BUSCA DO USUÁRIO
    if (!user) {
      try {
        const payload = verifyToken(token) as AuthTokenPayload
        
        if (!payload?.userId) {
          return {
            success: false,
            error: 'Token inválido',
            statusCode: 401
          }
        }
        
        // Usar getUserFromToken que já foi migrado para Supabase
        const authResult = await getUserFromToken({ headers: { get: () => `Bearer ${token}` } } as any);
        
        if (!authResult.success || !authResult.user) {
          return {
            success: false,
            error: 'Usuário não encontrado',
            statusCode: 401
          }
        }
        
        user = authResult.user! as any;
        
        // Cache do usuário autenticado
        if (!options.skipCache) {
          authCache.set(cacheKey, user!)
        }
        
      } catch (tokenError) {
        console.error('Erro na verificação do token:', tokenError)
        return {
          success: false,
          error: 'Token inválido ou expirado',
          statusCode: 401
        }
      }
    }
    
    // 5. VERIFICAÇÃO DE AUTORIZAÇÃO
    if (options.requiredUserTypes && options.requiredUserTypes.length > 0) {
      if (!options.requiredUserTypes.includes(user!.type)) {
        return {
          success: false,
          error: 'Acesso negado: tipo de usuário inválido',
          statusCode: 403
        }
      }
    }
    
    // Shortcuts para verificações comuns
    if (options.adminOnly && user!.type !== 'ADMIN') {
      return {
        success: false,
        error: 'Acesso negado: apenas administradores',
        statusCode: 403
      }
    }
    
    if (options.sellerOnly && user!.type !== 'SELLER') {
      return {
        success: false,
        error: 'Acesso negado: apenas vendedores',
        statusCode: 403
      }
    }
    
    if (options.buyerOnly && user!.type !== 'BUYER') {
      return {
        success: false,
        error: 'Acesso negado: apenas compradores',
        statusCode: 403
      }
    }
    
    // 6. LOG DA OPERAÇÃO
    const duration = Date.now() - startTime
    console.log(`Auth middleware: ${user!.type} user ${user!.id} authenticated in ${duration}ms`)
    
    return {
      success: true,
      user: user!
    }
    
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error)
    return {
      success: false,
      error: 'Erro interno do servidor',
      statusCode: 500
    }
  }
}

// ============================================================================
// WRAPPERS PARA ROTAS
// ============================================================================

export function withAuth(
  handler: (request: AuthenticatedRequest, context?: any) => Promise<Response>,
  options: AuthMiddlewareOptions = {}
) {
  return async (request: NextRequest, context?: any) => {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }
    
    const authResult = await authMiddleware(request, options)
    
    if (!authResult.success) {
      return createErrorResponse(
        authResult.error || 'Erro de autenticação',
        authResult.statusCode || 401
      )
    }
    
    // Extend request with user data
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = authResult.user
    authenticatedRequest.userId = authResult.user?.id
    authenticatedRequest.userType = authResult.user?.type
    
    // Add security headers
    const response = await handler(authenticatedRequest, context)
    
    if (!options.skipSecurityHeaders) {
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    }
    
    return response
  }
}

// ============================================================================
// HELPERS ESPECÍFICOS
// ============================================================================

export const requireAdmin = (
  handler: (request: AuthenticatedRequest, context?: any) => Promise<Response>
) => withAuth(handler, { adminOnly: true })

export const requireSeller = (
  handler: (request: AuthenticatedRequest, context?: any) => Promise<Response>
) => withAuth(handler, { sellerOnly: true })

export const requireBuyer = (
  handler: (request: AuthenticatedRequest, context?: any) => Promise<Response>
) => withAuth(handler, { buyerOnly: true })

export const requireSellerOrAdmin = (
  handler: (request: AuthenticatedRequest, context?: any) => Promise<Response>
) => withAuth(handler, { requiredUserTypes: ['SELLER', 'ADMIN'] })

// Para uso direto (sem wrapper)
export const requireAuthMiddleware = (options?: AuthMiddlewareOptions) => 
  (request: NextRequest) => authMiddleware(request, options)

// ============================================================================
// UTILITÁRIOS DE CACHE E DEBUG
// ============================================================================

export const authUtils = {
  clearCache: () => authCache.clear(),
  getCacheSize: () => authCache['cache'].size,
  blockClient: (clientId: string, duration?: number) => 
    rateLimiter.block(clientId, duration),
  getRateLimitInfo: (clientId: string, type: 'login' | 'register' | 'api' | 'admin' = 'api') =>
    rateLimiter.check(clientId, type)
}

// Export para compatibilidade com código existente
export { authMiddleware as authMiddlewareCompat }
export type { AuthMiddlewareOptions as MiddlewareOptions }