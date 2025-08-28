import { authenticate, authenticateWithRole, checkResourceOwnership, checkStoreAccess } from '../api-auth'
import { UserType } from '@/types'

// Mock the auth module
jest.mock('../auth', () => ({
  getUserFromToken: jest.fn()
}))

// Mock getUserFromToken
import { getUserFromToken } from '../auth'
const mockGetUserFromToken = getUserFromToken as jest.MockedFunction<typeof getUserFromToken>

describe('API Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('authenticate', () => {
    it('should return success when valid token provided', async () => {
      const mockUser = {
        id: 'user-123',
        type: 'BUYER' as UserType,
        name: 'Test User',
        email: 'test@example.com'
      }

      mockGetUserFromToken.mockResolvedValue({ success: true, user: mockUser as any, error: null })

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer valid-token')
        }
      } as any

      const result = await authenticate(mockRequest)

      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
      expect(result.error).toBeUndefined()
    })

    it('should return error when no user found', async () => {
      mockGetUserFromToken.mockResolvedValue({ success: false, user: null, error: 'Invalid token' })

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer invalid-token')
        }
      } as any

      const result = await authenticate(mockRequest)

      expect(result.success).toBe(false)
      expect(result.user).toBeUndefined()
      expect(result.error).toBe('Token de autenticação necessário')
    })

    it('should handle authentication errors', async () => {
      mockGetUserFromToken.mockRejectedValue(new Error('Database error'))

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer valid-token')
        }
      } as any

      const result = await authenticate(mockRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Token inválido')
    })
  })

  describe('authenticateWithRole', () => {
    it('should allow access for correct user type', async () => {
      const mockUser = {
        id: 'user-123',
        type: 'SELLER' as UserType,
        name: 'Test Seller',
        email: 'seller@example.com'
      }

      mockGetUserFromToken.mockResolvedValue({ success: true, user: mockUser as any, error: null })

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer valid-token')
        }
      } as any

      const result = await authenticateWithRole(mockRequest, ['SELLER'])

      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
    })

    it('should deny access for incorrect user type', async () => {
      const mockUser = {
        id: 'user-123',
        type: 'BUYER' as UserType,
        name: 'Test Buyer',
        email: 'buyer@example.com'
      }

      mockGetUserFromToken.mockResolvedValue({ success: true, user: mockUser as any, error: null })

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer valid-token')
        }
      } as any

      const result = await authenticateWithRole(mockRequest, ['SELLER'])

      expect(result.success).toBe(false)
      expect(result.error).toBe('Acesso negado - tipo de usuário não autorizado')
    })
  })

  describe('checkResourceOwnership', () => {
    it('should allow admin access to any resource', () => {
      const adminUser = {
        id: 'admin-123',
        type: 'ADMIN' as UserType,
        seller: null
      } as any

      const result = checkResourceOwnership(adminUser, 'any-seller-id')

      expect(result).toBe(true)
    })

    it('should allow seller access to own resources', () => {
      const sellerUser = {
        id: 'user-123',
        type: 'SELLER' as UserType,
        seller: { id: 'seller-123' }
      } as any

      const result = checkResourceOwnership(sellerUser, 'seller-123')

      expect(result).toBe(true)
    })

    it('should deny seller access to other resources', () => {
      const sellerUser = {
        id: 'user-123',
        type: 'SELLER' as UserType,
        seller: { id: 'seller-123' }
      } as any

      const result = checkResourceOwnership(sellerUser, 'other-seller-id')

      expect(result).toBe(false)
    })

    it('should deny buyer access to seller resources', () => {
      const buyerUser = {
        id: 'user-123',
        type: 'BUYER' as UserType,
        seller: null
      } as any

      const result = checkResourceOwnership(buyerUser, 'seller-123')

      expect(result).toBe(false)
    })
  })

  describe('checkStoreAccess', () => {
    it('should allow admin access to any store', () => {
      const adminUser = {
        id: 'admin-123',
        type: 'ADMIN' as UserType
      } as any

      const result = checkStoreAccess(adminUser, 'any-store-id')

      expect(result).toBe(true)
    })

    it('should allow seller access to own store', () => {
      const sellerUser = {
        id: 'user-123',
        type: 'SELLER' as UserType,
        seller: {
          store: { id: 'store-123' }
        }
      } as any

      const result = checkStoreAccess(sellerUser, 'store-123')

      expect(result).toBe(true)
    })

    it('should deny seller access to other stores', () => {
      const sellerUser = {
        id: 'user-123',
        type: 'SELLER' as UserType,
        seller: {
          store: { id: 'store-123' }
        }
      } as any

      const result = checkStoreAccess(sellerUser, 'other-store-id')

      expect(result).toBe(false)
    })
  })
})