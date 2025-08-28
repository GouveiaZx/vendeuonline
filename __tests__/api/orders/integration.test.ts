/**
 * TESTES DE INTEGRAÇÃO - PEDIDOS
 * 
 * Testa os fluxos completos de pedidos, incluindo:
 * - Criação de pedidos
 * - Listagem de pedidos
 * - Atualização de status
 * - Validação de estoque
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
    from: jest.fn((table) => {
      const mockMethods = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
      }

      // Mock responses baseado na tabela
      if (table === 'orders') {
        mockMethods.single.mockResolvedValue({
          data: {
            id: 'order-123',
            buyer_id: 'buyer-123',
            seller_id: 'seller-123',
            store_id: 'store-123',
            status: 'PENDING',
            total: 100.00,
            created_at: new Date().toISOString(),
            order_items: [
              {
                id: 'item-123',
                product_id: 'product-123',
                quantity: 2,
                price: 50.00,
                total: 100.00
              }
            ]
          },
          error: null
        })

        mockMethods.range.mockResolvedValue({
          data: [{
            id: 'order-123',
            buyer_id: 'buyer-123',
            status: 'PENDING',
            total: 100.00,
            created_at: new Date().toISOString(),
          }],
          error: null,
          count: 1
        })
      }

      if (table === 'addresses') {
        mockMethods.single.mockResolvedValue({
          data: {
            id: 'address-123',
            buyer_id: 'buyer-123',
            street: 'Test Street',
            city: 'Test City'
          },
          error: null
        })
      }

      if (table === 'products') {
        mockMethods.eq.mockResolvedValue({
          data: [{
            id: 'product-123',
            name: 'Test Product',
            price: 50.00,
            stock: 10,
            is_active: true,
            store_id: 'store-123',
            product_images: [{ url: 'test.jpg', order: 1 }],
            stores: { id: 'store-123', name: 'Test Store' }
          }],
          error: null
        })
      }

      return mockMethods
    })
  }))
}))

describe('Integração de Pedidos', () => {
  beforeAll(async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/orders', () => {
    it('deve listar pedidos para comprador autenticado', async () => {
      // Mock do middleware de autenticação
      jest.doMock('../../../src/lib/auth-middleware', () => ({
        authMiddleware: jest.fn().mockResolvedValue({
          success: true,
          user: {
            id: 'buyer-123',
            type: 'BUYER',
            email: 'buyer@example.com',
            buyer: { id: 'buyer-123' }
          }
        })
      }))

      const mockRequest = createMockNextRequest('http://localhost:3000/api/orders?page=1&limit=10')

      const { GET } = await import('../../../src/app/api/orders/route')
      const response = await GET(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toHaveProperty('orders')
      expect(result).toHaveProperty('pagination')
      expect(Array.isArray(result.orders)).toBe(true)
    })

    it('deve rejeitar acesso não autorizado', async () => {
      jest.doMock('../../../src/lib/auth-middleware', () => ({
        authMiddleware: jest.fn().mockResolvedValue({
          success: false,
          error: 'Token inválido'
        })
      }))

      const mockRequest = createMockNextRequest('http://localhost:3000/api/orders')

      const { GET } = await import('../../../src/app/api/orders/route')
      const response = await GET(mockRequest)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/orders', () => {
    it('deve criar pedido válido', async () => {
      jest.doMock('../../../src/lib/auth-middleware', () => ({
        authMiddleware: jest.fn().mockResolvedValue({
          success: true,
          user: {
            id: 'buyer-123',
            type: 'BUYER',
            email: 'buyer@example.com',
            buyer: { id: 'buyer-123' }
          }
        })
      }))

      const orderData = {
        items: [
          {
            productId: 'product-123',
            quantity: 2,
            price: 50.00
          }
        ],
        shippingAddressId: 'address-123',
        paymentMethod: 'PIX'
      }

      const mockRequest = createMockNextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: orderData
      })

      const { POST } = await import('../../../src/app/api/orders/route')
      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result).toHaveProperty('orders')
      expect(result.message).toContain('pedido(s) criado(s) com sucesso')
    })

    it('deve validar endereço de entrega', async () => {
      // Mock para endereço inválido
      const supabase = require('@supabase/supabase-js')
      supabase.createClient().from.mockImplementation((table: string) => {
        if (table === 'addresses') {
          return {
            select: () => ({ 
              eq: () => ({ 
                single: () => Promise.resolve({ data: null, error: 'Not found' })
              })
            })
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
        }
      })

      jest.doMock('../../../src/lib/auth-middleware', () => ({
        authMiddleware: jest.fn().mockResolvedValue({
          success: true,
          user: {
            id: 'buyer-123',
            type: 'BUYER',
            buyer: { id: 'buyer-123' }
          }
        })
      }))

      const orderData = {
        items: [{ productId: 'product-123', quantity: 1, price: 50.00 }],
        shippingAddressId: 'invalid-address',
        paymentMethod: 'PIX'
      }

      const mockRequest = createMockNextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: orderData
      })

      const { POST } = await import('../../../src/app/api/orders/route')
      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('Endereço de entrega inválido')
    })
  })

  describe('Validação de Estoque', () => {
    it('deve verificar disponibilidade de produtos', async () => {
      // Mock para produto fora de estoque
      const supabase = require('@supabase/supabase-js')
      supabase.createClient().from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: () => ({
              in: () => ({
                eq: () => Promise.resolve({
                  data: [{
                    id: 'product-123',
                    name: 'Test Product',
                    price: 50.00,
                    stock: 0, // Sem estoque
                    is_active: true,
                    store_id: 'store-123'
                  }],
                  error: null
                })
              })
            })
          }
        }
        return { select: jest.fn().mockReturnThis() }
      })

      jest.doMock('../../../src/lib/auth-middleware', () => ({
        authMiddleware: jest.fn().mockResolvedValue({
          success: true,
          user: {
            id: 'buyer-123',
            type: 'BUYER',
            buyer: { id: 'buyer-123' }
          }
        })
      }))

      const orderData = {
        items: [{ productId: 'product-123', quantity: 1, price: 50.00 }],
        shippingAddressId: 'address-123',
        paymentMethod: 'PIX'
      }

      const mockRequest = createMockNextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: orderData
      })

      const { POST } = await import('../../../src/app/api/orders/route')
      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('Estoque insuficiente')
    })
  })
})

describe('Fluxo Completo de Pedido', () => {
  it('deve completar ciclo de criação e atualização de pedido', async () => {
    // Mock para todas as operações necessárias
    jest.doMock('../../../src/lib/auth-middleware', () => ({
      authMiddleware: jest.fn().mockResolvedValue({
        success: true,
        user: {
          id: 'buyer-123',
          type: 'BUYER',
          buyer: { id: 'buyer-123' }
        }
      })
    }))

    // 1. Criar pedido
    const orderData = {
      items: [{ productId: 'product-123', quantity: 1, price: 50.00 }],
      shippingAddressId: 'address-123',
      paymentMethod: 'PIX'
    }

    const createRequest = createMockNextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: orderData
    })

    const { POST } = await import('../../../src/app/api/orders/route')
    const createResponse = await POST(createRequest)
    const createResult = await createResponse.json()

    expect(createResponse.status).toBe(201)
    expect(createResult.orders).toBeDefined()

    // 2. Listar pedidos
    const listRequest = createMockNextRequest('http://localhost:3000/api/orders')
    const { GET } = await import('../../../src/app/api/orders/route')
    const listResponse = await GET(listRequest)
    const listResult = await listResponse.json()

    expect(listResponse.status).toBe(200)
    expect(listResult.orders).toBeDefined()
    expect(Array.isArray(listResult.orders)).toBe(true)
  })
})