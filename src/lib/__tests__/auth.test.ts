import { hashPassword, comparePassword, generateToken, verifyToken } from '../auth'

describe('Auth Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(10)
    })

    it('should generate different hashes for same password', async () => {
      const password = 'testpassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('comparePassword', () => {
    it('should verify correct password', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)
      
      const isValid = await comparePassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'testpassword123'
      const wrongPassword = 'wrongpassword'
      const hash = await hashPassword(password)
      
      const isValid = await comparePassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })
  })

  describe('generateToken', () => {
    beforeAll(() => {
      process.env.JWT_SECRET = 'test-secret-key'
    })

    it('should generate a valid JWT token', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'BUYER'
      }
      
      const token = generateToken(payload)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })
  })

  describe('verifyToken', () => {
    beforeAll(() => {
      process.env.JWT_SECRET = 'test-secret-key'
    })

    it('should verify valid token', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'BUYER'
      }
      
      const token = generateToken(payload)
      const verified = verifyToken(token)
      
      expect(verified).toBeDefined()
      expect(verified!.userId).toBe(payload.userId)
      expect(verified!.email).toBe(payload.email)
      expect(verified!.type).toBe(payload.type)
    })

    it('should reject invalid token', () => {
      const invalidToken = 'invalid.token.here'
      
      const verified = verifyToken(invalidToken)
      
      expect(verified).toBeNull()
    })

    it('should reject token with wrong secret', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'BUYER'
      }
      
      const token = generateToken(payload)
      
      // Change secret
      process.env.JWT_SECRET = 'different-secret'
      
      const verified = verifyToken(token)
      
      expect(verified).toBeNull()
      
      // Restore original secret
      process.env.JWT_SECRET = 'test-secret-key-with-at-least-32-characters-for-security'
    })
  })
})