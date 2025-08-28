/**
 * TESTES DE INTEGRAÇÃO - AUTENTICAÇÃO
 * 
 * Testa os fluxos completos de autenticação, incluindo:
 * - Login e logout
 * - Registro de usuários
 * - Validação de tokens
 * - Middleware de autenticação
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'

// Helper para mock de NextRequest
const createMockNextRequest = (url: string, options: { method?: string, body?: any, headers?: Record<string, string> } = {}) => {
  const { method = 'GET', body, headers = {} } = options
  
  return {
    url,
    method,
    json: body ? async () => body : undefined,
    headers: {
      get: (name: string) => {
        const headerMap: Record<string, string> = {
          'content-type': 'application/json',
          'authorization': 'Bearer mock-token',
          'x-forwarded-for': '127.0.0.1',
          ...headers
        }
        return headerMap[name.toLowerCase()] || null
      }
    }
  } as any
}

// Mock do Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          type: 'BUYER',
          phone: '123456789',
          city: 'Test City',
          state: 'TS',
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          buyer: { id: 'buyer-id', user_id: 'test-user-id' }
        },
        error: null
      }))
    }))
  }))
}))

// Mock do bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(() => Promise.resolve(true)),
  hash: jest.fn(() => Promise.resolve('hashed-password'))
}))

// Mock do JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({
    userId: 'test-user-id',
    email: 'test@example.com',
    type: 'BUYER'
  }))
}))

describe('Integração de Autenticação', () => {
  let authModule: any
  
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const mockRequest = createMockNextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'validpassword'
        }
      })

      // Simula o handler da API
      const { POST } = await import('../../../src/app/api/auth/login/route')
      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('user')
      expect(result.user.email).toBe('test@example.com')
    })

    it('deve rejeitar credenciais inválidas', async () => {
      // Mock para simular senha incorreta
      const bcrypt = require('bcryptjs')
      bcrypt.compare.mockResolvedValueOnce(false)

      const mockRequest = createMockNextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      })

      const { POST } = await import('../../../src/app/api/auth/login/route')
      const response = await POST(mockRequest)
      
      expect(response.status).toBe(401)
    })
  })

  describe('Middleware de Autenticação', () => {
    it('deve validar token JWT corretamente', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token'
        }
      })

      const { authMiddleware } = await import('../../../src/lib/auth-middleware')
      const result = await authMiddleware(mockRequest)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.id).toBe('test-user-id')
    })

    it('deve rejeitar requisições sem token', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test')

      const { authMiddleware } = await import('../../../src/lib/auth-middleware')
      const result = await authMiddleware(mockRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Token de autenticação necessário')
    })
  })

  describe('Rate Limiting', () => {
    it('deve aplicar rate limiting para login', async () => {
      const { authMiddleware } = await import('../../../src/lib/auth-middleware')
      
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        headers: {
          'x-forwarded-for': '127.0.0.1',
          'user-agent': 'test-agent'
        }
      })

      // Simular múltiplas tentativas
      let result: any
      for (let i = 0; i < 6; i++) {
        result = await authMiddleware(mockRequest)
      }

      expect(result?.success).toBe(false)
      expect(result?.statusCode).toBe(429)
    })
  })
})

describe('Fluxo Completo de Autenticação', () => {
  it('deve completar ciclo login -> acesso a recurso -> logout', async () => {
    // 1. Login
    const loginRequest = createMockNextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'validpassword'
      }
    })

    const { POST: loginHandler } = await import('../../../src/app/api/auth/login/route')
    const loginResponse = await loginHandler(loginRequest)
    const loginResult = await loginResponse.json()

    expect(loginResponse.status).toBe(200)
    expect(loginResult.token).toBeDefined()

    // 2. Acesso a recurso protegido
    const protectedRequest = new NextRequest('http://localhost:3000/api/protected', {
      headers: {
        'Authorization': `Bearer ${loginResult.token}`
      }
    })

    const { authMiddleware } = await import('../../../src/lib/auth-middleware')
    const authResult = await authMiddleware(protectedRequest)

    expect(authResult.success).toBe(true)
    expect(authResult.user?.email).toBe('test@example.com')

    // 3. Logout (limpeza de cache)
    const { authUtils } = await import('../../../src/lib/auth-middleware')
    authUtils.clearCache()

    // Verificar que cache foi limpo
    expect(authUtils.getCacheSize()).toBe(0)
  })
})