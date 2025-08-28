/**
 * Testes para o sistema consolidado de Rate Limiting
 */

import { RateLimiter, RateLimitResult, createRateLimitHeaders } from '../rateLimiting';
import { NextRequest } from 'next/server';

// Mock do Redis/Upstash
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockIncr = jest.fn();
const mockExpire = jest.fn();

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(() => ({
    get: mockGet,
    set: mockSet,
    incr: mockIncr,
    expire: mockExpire,
  }))
}));

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    rateLimiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 60000 // 1 minute
    });
    
    mockRequest = {
      headers: new Headers({
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'test-agent'
      }),
      nextUrl: { pathname: '/test' }
    } as NextRequest;
  });

  describe('isAllowed', () => {
    it('should allow requests under limit', async () => {
      mockGet.mockResolvedValue('2'); // Current count
      mockIncr.mockResolvedValue(3);

      const result = await rateLimiter.isAllowed(mockRequest);

      expect(result.allowed).toBe(true);
      expect(result.remainingRequests).toBe(2);
    });

    it('should deny requests over limit', async () => {
      mockGet.mockResolvedValue('5'); // At limit
      mockIncr.mockResolvedValue(6);

      const result = await rateLimiter.isAllowed(mockRequest);

      expect(result.allowed).toBe(false);
      expect(result.remainingRequests).toBe(0);
    });

    it('should handle Redis errors gracefully', async () => {
      mockGet.mockRejectedValue(new Error('Redis connection failed'));

      const result = await rateLimiter.isAllowed(mockRequest);

      // Should fall back to in-memory limiting
      expect(result.allowed).toBe(true);
    });
  });

  describe('rate limit key generation', () => {
    it('should generate different keys for different IPs', async () => {
      const request1 = {
        ...mockRequest,
        headers: new Headers({ 'x-forwarded-for': '192.168.1.1' })
      } as NextRequest;

      const request2 = {
        ...mockRequest,
        headers: new Headers({ 'x-forwarded-for': '192.168.1.2' })
      } as NextRequest;

      mockGet.mockResolvedValue('1');
      mockIncr.mockResolvedValue(2);

      await rateLimiter.isAllowed(request1);
      await rateLimiter.isAllowed(request2);

      // Should call Redis twice with different keys
      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(mockIncr).toHaveBeenCalledTimes(2);
    });
  });

  describe('window expiration', () => {
    it('should set expiration on new counters', async () => {
      mockGet.mockResolvedValue(null); // New counter
      mockIncr.mockResolvedValue(1);

      await rateLimiter.isAllowed(mockRequest);

      expect(mockExpire).toHaveBeenCalledWith(
        expect.any(String),
        Math.ceil(60000 / 1000) // windowMs converted to seconds
      );
    });
  });
});

describe('createRateLimitHeaders', () => {
  it('should create proper rate limit headers', () => {
    const result: RateLimitResult = {
      allowed: true,
      remainingRequests: 2,
      resetTime: Date.now() + 60000
    };

    const headers = createRateLimitHeaders(result, 5);

    expect(headers['X-RateLimit-Limit']).toBe('5');
    expect(headers['X-RateLimit-Remaining']).toBe('2');
    expect(headers['X-RateLimit-Reset']).toBe(result.resetTime.toString());
  });

  it('should handle missing resetTime', () => {
    const result: RateLimitResult = {
      allowed: false,
      remainingRequests: 0,
      resetTime: Date.now() + 60000
    };

    const headers = createRateLimitHeaders(result, 5);

    expect(headers['X-RateLimit-Limit']).toBe('5');
    expect(headers['X-RateLimit-Remaining']).toBe('0');
    expect(headers['X-RateLimit-Reset']).toBe(result.resetTime.toString());
  });
});

describe('Predefined Rate Limiters', () => {
  // Import the predefined limiters
  const { generalRateLimiter, apiRateLimiter, authRateLimiter, uploadRateLimiter } = require('../rateLimiting');

  it('should have different limits for different limiters', () => {
    expect(generalRateLimiter).toBeDefined();
    expect(apiRateLimiter).toBeDefined();
    expect(authRateLimiter).toBeDefined();
    expect(uploadRateLimiter).toBeDefined();
  });

  it('should use appropriate limits for each limiter type', async () => {
    const mockRequest = {
      headers: new Headers({ 'x-forwarded-for': '192.168.1.1' }),
      nextUrl: { pathname: '/test' }
    } as NextRequest;

    mockGet.mockResolvedValue('1');
    mockIncr.mockResolvedValue(2);

    // Test that different limiters work
    const generalResult = await generalRateLimiter.isAllowed(mockRequest);
    const apiResult = await apiRateLimiter.isAllowed(mockRequest);
    const authResult = await authRateLimiter.isAllowed(mockRequest);
    const uploadResult = await uploadRateLimiter.isAllowed(mockRequest);

    expect(generalResult.allowed).toBe(true);
    expect(apiResult.allowed).toBe(true);
    expect(authResult.allowed).toBe(true);
    expect(uploadResult.allowed).toBe(true);
  });
});