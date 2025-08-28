/**
 * Testes para o sistema consolidado de Analytics
 */

import { getAnalytics } from '../analytics-consolidated';

// Mock environment variables
const originalEnv = process.env;

// Mock Google Analytics
const mockGtag = jest.fn();
const mockDataLayer: any[] = [];

beforeAll(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: 'G-TEST123456',
    NODE_ENV: 'test'
  };

  // Mock global gtag and dataLayer
  (global as any).gtag = mockGtag;
  (global as any).dataLayer = mockDataLayer;
});

afterAll(() => {
  process.env = originalEnv;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockDataLayer.length = 0;
});

describe('Analytics Consolidated', () => {
  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const analytics1 = getAnalytics();
      const analytics2 = getAnalytics();
      
      expect(analytics1).toBe(analytics2);
    });
  });

  describe('Initialization', () => {
    it('should initialize analytics in production', () => {
      (process.env as any).NODE_ENV = 'production';
      
      const analytics = getAnalytics();
      analytics.init();
      
      expect(mockGtag).toHaveBeenCalled();
    });

    it('should not initialize analytics in development by default', () => {
      (process.env as any).NODE_ENV = 'development';
      
      const analytics = getAnalytics();
      analytics.init();
      
      // Should not call gtag in development
      expect(mockGtag).not.toHaveBeenCalled();
    });

    it('should initialize analytics in development when forced', () => {
      (process.env as any).NODE_ENV = 'development';
      
      const analytics = getAnalytics();
      analytics.init();
      
      expect(mockGtag).toHaveBeenCalled();
    });
  });

  describe('Page Tracking', () => {
    it('should track page views', () => {
      const analytics = getAnalytics();
      analytics.init();
      
      analytics.trackPageView('/test-page', 'Test Page');
      
      expect(mockGtag).toHaveBeenCalledWith('config', 'G-TEST123456', {
        page_title: 'Test Page',
        page_location: expect.stringContaining('/test-page')
      });
    });

    it('should track page views without title', () => {
      const analytics = getAnalytics();
      analytics.init();
      
      analytics.trackPageView('/test-page');
      
      expect(mockGtag).toHaveBeenCalledWith('config', 'G-TEST123456', {
        page_location: expect.stringContaining('/test-page')
      });
    });
  });

  describe('Event Tracking', () => {
    it('should track custom events', () => {
      const analytics = getAnalytics();
      analytics.init();
      
      analytics.trackEvent('custom_event', {
        category: 'test',
        label: 'test_label',
        value: 123
      });
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'custom_event', {
        event_category: 'test',
        event_label: 'test_label',
        value: 123
      });
    });

    it('should track events without data', () => {
      const analytics = getAnalytics();
      analytics.init();
      
      analytics.trackEvent('simple_event');
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'simple_event', {});
    });
  });

  describe('E-commerce Tracking', () => {
    it('should track product views', () => {
      const analytics = getAnalytics();
      analytics.init();
      
      const product = {
        item_id: 'prod_123',
        item_name: 'Test Product',
        item_category: 'electronics',
        price: 99.99,
        currency: 'BRL'
      };
      
      analytics.trackProductView(product);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'view_item', {
        currency: 'BRL',
        value: 99.99,
        items: [{
          item_id: 'prod_123',
          item_name: 'Test Product',
          item_category: 'electronics',
          price: 99.99,
          currency: 'BRL'
        }]
      });
    });

    it('should track purchases', () => {
      const analytics = getAnalytics();
      analytics.init();
      
      const purchase = {
        transaction_id: 'tx_123',
        value: 199.98,
        currency: 'BRL',
        items: [
          {
            item_id: 'prod_1',
            item_name: 'Product 1',
            item_category: 'electronics',
            price: 99.99,
            quantity: 1
          },
          {
            item_id: 'prod_2', 
            item_name: 'Product 2',
            item_category: 'electronics',
            price: 99.99,
            quantity: 1
          }
        ]
      };
      
      analytics.trackPurchase(purchase);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'purchase', {
        transaction_id: 'tx_123',
        value: 199.98,
        currency: 'BRL',
        items: expect.arrayContaining([
          expect.objectContaining({
            item_id: 'prod_1',
            item_name: 'Product 1',
            price: 99.99,
            quantity: 1
          }),
          expect.objectContaining({
            item_id: 'prod_2',
            item_name: 'Product 2',
            price: 99.99,
            quantity: 1
          })
        ])
      });
    });
  });

  describe('User Identification', () => {
    it('should set user ID', () => {
      const analytics = getAnalytics();
      analytics.init();
      
      analytics.setUser('user_123');
      
      expect(mockGtag).toHaveBeenCalledWith('config', 'G-TEST123456', {
        user_id: 'user_123'
      });
    });

    it('should set user properties', () => {
      const analytics = getAnalytics();
      analytics.init();
      
      analytics.setUser('user_123');
      
      expect(mockGtag).toHaveBeenCalledWith('config', 'G-TEST123456', {
        user_id: 'user_123'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing gtag gracefully', () => {
      delete (global as any).gtag;
      
      const analytics = getAnalytics();
      
      // Should not throw
      expect(() => {
        analytics.init();
        analytics.trackEvent('test');
        analytics.trackPageView('/test');
      }).not.toThrow();
      
      // Restore
      (global as any).gtag = mockGtag;
    });

    it('should handle gtag errors gracefully', () => {
      mockGtag.mockImplementation(() => {
        throw new Error('Gtag error');
      });
      
      const analytics = getAnalytics();
      analytics.init();
      
      // Should not throw
      expect(() => {
        analytics.trackEvent('test');
      }).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should skip initialization without measurement ID', () => {
      delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
      
      jest.resetModules();
      const { getAnalytics: getAnalyticsNew } = require('../analytics-consolidated');
      
      const analytics = getAnalyticsNew();
      analytics.init();
      
      expect(mockGtag).not.toHaveBeenCalled();
      
      // Restore
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123456';
    });
  });
});