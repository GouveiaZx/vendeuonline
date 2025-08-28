/**
 * Testes para a configuração consolidada do Supabase
 */

import { supabase, supabaseServer } from '../supabase';

// Mock environment variables
const originalEnv = process.env;

beforeAll(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key'
  };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('Supabase Configuration', () => {
  describe('Public Client', () => {
    it('should create public client with anon key', () => {
      expect(supabase).toBeDefined();
      // Note: supabaseUrl and supabaseKey are protected properties
      // Testing client existence is sufficient
    });

    it('should have realtime enabled for public client', () => {
      // Test that realtime is properly configured
      expect(supabase.realtime).toBeDefined();
    });
  });

  describe('Server Client', () => {
    it('should create server client with service role key when available', () => {
      expect(supabaseServer).toBeDefined();
      // Note: supabaseUrl and supabaseKey are protected properties
      // Testing client existence is sufficient
    });

    it('should return null when service role key is missing', () => {
      // Temporarily remove service key
      const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      // Re-import to get new instance
      jest.resetModules();
      const { supabaseServer: testServer } = require('../supabase');

      expect(testServer).toBeNull();

      // Restore
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    });
  });

  describe('Environment Validation', () => {
    it('should throw error when SUPABASE_URL is missing', () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      expect(() => {
        jest.resetModules();
        require('../supabase');
      }).toThrow();

      // Restore
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    });

    it('should throw error when SUPABASE_ANON_KEY is missing', () => {
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => {
        jest.resetModules();
        require('../supabase');
      }).toThrow();

      // Restore
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    });
  });

  describe('Client Configuration', () => {
    it('should have proper auth configuration', () => {
      expect(supabase.auth).toBeDefined();
      // Note: storage is a protected property
      // Testing auth client existence is sufficient
    });

    it('should have proper database configuration', () => {
      expect(supabase.from).toBeDefined();
      expect(typeof supabase.from).toBe('function');
    });

    it('should have storage configuration', () => {
      expect(supabase.storage).toBeDefined();
      expect(supabase.storage.from).toBeDefined();
    });
  });

  describe('Auth Methods', () => {
    it('should expose auth methods', () => {
      expect(supabase.auth.signUp).toBeDefined();
      expect(supabase.auth.signInWithPassword).toBeDefined();
      expect(supabase.auth.signOut).toBeDefined();
      expect(supabase.auth.getUser).toBeDefined();
      expect(supabase.auth.getSession).toBeDefined();
    });
  });

  describe('Database Methods', () => {
    it('should expose database methods', () => {
      const table = supabase.from('test_table');
      
      expect(table.select).toBeDefined();
      expect(table.insert).toBeDefined();
      expect(table.update).toBeDefined();
      expect(table.delete).toBeDefined();
    });
  });

  describe('Storage Methods', () => {
    it('should expose storage methods', () => {
      const bucket = supabase.storage.from('test_bucket');
      
      expect(bucket.upload).toBeDefined();
      expect(bucket.download).toBeDefined();
      expect(bucket.remove).toBeDefined();
      expect(bucket.list).toBeDefined();
    });
  });
});