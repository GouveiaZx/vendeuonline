/**
 * SISTEMA DE AUTENTICAÇÃO CONSOLIDADO
 * 
 * Sistema principal de autenticação que unifica:
 * - JWT tokens
 * - Supabase Auth
 * - Validação de usuários
 * - Controle de acesso baseado em roles
 */

// Re-export all authentication functions from the main auth library
export {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  getUserFromToken,
  getAuthenticatedUser,
  requireAdmin,
  createAuthResponse,
  type JWTPayload
} from '../auth';

// Re-export types from the central types
export type {
  User,
  UserType,
  UserStatus,
  AuthState,
  AuthActions,
  AuthStore,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  AuthTokenPayload
} from '@/types';

// Authentication utilities
export { authRateLimiter } from '@/lib/rateLimiting';

// Authentication guards and helpers
export * from './guards';
export * from './helpers';
export * from './middleware';