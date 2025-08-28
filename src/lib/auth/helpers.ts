/**
 * AUTHENTICATION HELPERS
 * 
 * Funções utilitárias para autenticação e gestão de tokens
 */

import { NextRequest } from 'next/server';
import type { User, UserType } from '@/types';

/**
 * Extrair token de diferentes fontes (Authorization header, cookies)
 */
export function extractToken(request: NextRequest): string | null {
  // 1. Authorization header: Bearer <token>
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 2. Cookie personalizado da app
  const cookieToken = request.cookies.get('auth-token')?.value;
  if (cookieToken) return cookieToken;
  
  // 3. Cookies padrão do Supabase Auth Helpers
  const sbToken = request.cookies.get('sb-access-token')?.value;
  if (sbToken) return sbToken;
  
  return null;
}

/**
 * Obter IP do usuário considerando proxies
 */
export function getUserIP(request: NextRequest): string {
  // Verificar headers de proxy primeiro
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  
  // NextRequest não tem propriedade ip, usar unknown
  return 'unknown';
}

/**
 * Criar URL de redirecionamento com query parameters
 */
export function createRedirectUrl(baseUrl: string, pathname: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('redirect', pathname);
  return url.toString();
}

/**
 * Determinar dashboard apropriado baseado no tipo de usuário
 */
export function getDashboardPath(userType: UserType): string {
  switch (userType) {
    case 'ADMIN':
      return '/admin';
    case 'SELLER':
      return '/seller';
    case 'BUYER':
      return '/buyer';
    default:
      return '/';
  }
}

/**
 * Verificar se rota é pública
 */
export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/public',
    '/',
    '/products',
    '/stores',
    '/search',
    '/about',
    '/contact',
    '/terms',
    '/privacy'
  ];
  
  return publicRoutes.some(route => {
    if (route === '/') return pathname === '/';
    return pathname === route || pathname.startsWith(route + '/');
  });
}

/**
 * Verificar se rota é protegida
 */
export function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/admin',
    '/seller',
    '/buyer',
    '/profile',
    '/settings',
    '/checkout',
    '/payment',
    '/api/admin',
    '/api/seller',
    '/api/buyer',
    '/api/user'
  ];
  
  return protectedRoutes.some(route => pathname.startsWith(route));
}

/**
 * Verificar se usuário tem acesso à rota baseado no role
 */
export function hasRouteAccess(pathname: string, userType: UserType): boolean {
  // Admin pode acessar todas as rotas
  if (userType === 'ADMIN') {
    return true;
  }
  
  // Verificar rotas específicas do role
  if (pathname.startsWith('/admin')) {
    return (userType as string) === 'ADMIN';
  } else if (pathname.startsWith('/seller')) {
    return (userType as string) === 'SELLER' || (userType as string) === 'ADMIN';
  } else if (pathname.startsWith('/buyer')) {
    return (userType as string) === 'BUYER' || (userType as string) === 'ADMIN';
  }
  
  // Rotas autenticadas que qualquer usuário logado pode acessar
  const authenticatedRoutes = ['/profile', '/settings', '/checkout', '/payment'];
  return authenticatedRoutes.some(route => pathname.startsWith(route));
}

/**
 * Sanitizar dados do usuário removendo informações sensíveis
 */
export function sanitizeUser(user: any): User {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

/**
 * Verificar se token está próximo do vencimento
 */
export function isTokenNearExpiry(exp: number, bufferMinutes: number = 15): boolean {
  const now = Math.floor(Date.now() / 1000);
  const buffer = bufferMinutes * 60; // converter para segundos
  return (exp - now) <= buffer;
}

/**
 * Formatar resposta de erro de autenticação
 */
export function formatAuthError(error: string, statusCode: number = 401) {
  return {
    error,
    statusCode,
    timestamp: new Date().toISOString()
  };
}

/**
 * Verificar se ambiente está em desenvolvimento
 */
export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Verificar se Supabase está configurado corretamente
 */
export function isSupabaseConfigured(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return !!(supabaseUrl && 
            supabaseKey && 
            !supabaseUrl.includes('seu-projeto') &&
            !supabaseKey.includes('sua-chave'));
}

/**
 * Criar headers de cache para rotas autenticadas
 */
export function createSecurityHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-store, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  };
}

/**
 * Log de eventos de autenticação para auditoria
 */
export function logAuthEvent(
  event: 'login' | 'logout' | 'token_refresh' | 'access_denied',
  userId?: string,
  ip?: string,
  userAgent?: string
) {
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify({
      type: 'auth_event',
      event,
      userId,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    }));
  }
}