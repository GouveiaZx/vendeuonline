/**
 * AUTHENTICATION MIDDLEWARE UTILITIES
 * 
 * Funções específicas para uso em middleware Next.js
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { authRateLimiter, createRateLimitHeaders } from '@/lib/rateLimiting';
import { 
  extractToken, 
  getUserIP, 
  createRedirectUrl, 
  getDashboardPath, 
  isPublicRoute, 
  isProtectedRoute, 
  hasRouteAccess,
  createSecurityHeaders,
  logAuthEvent,
  isDevelopmentMode,
  isSupabaseConfigured
} from './helpers';
import type { UserType } from '@/types';

/**
 * Middleware principal de autenticação
 */
export async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  
  // Em desenvolvimento, permitir bypass se Supabase não estiver configurado
  if (isDevelopmentMode() && !isSupabaseConfigured()) {
    console.log(`[DEV MODE] Auth middleware bypassed for: ${pathname}`);
    return null; // Continue para próximo middleware
  }
  
  // Verificar rate limiting para rotas de autenticação
  if (pathname.startsWith('/api/auth/')) {
    const rateLimitResult = await authRateLimiter.isAllowed(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Try again later.' },
        { 
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult, 5)
        }
      );
    }
  }
  
  // Rotas públicas não precisam de autenticação
  if (isPublicRoute(pathname)) {
    return null;
  }
  
  // Verificar se rota precisa de autenticação
  if (!isProtectedRoute(pathname)) {
    return null;
  }
  
  // Obter token de autenticação
  const token = extractToken(request);
  const ip = getUserIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  
  if (!token) {
    logAuthEvent('access_denied', undefined, ip, userAgent);
    
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const loginUrl = createRedirectUrl('/login', pathname);
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }
  
  // Validar token com Supabase
  try {
    if (!supabaseServer) {
      throw new Error('Supabase server not initialized');
    }
    
    const { data, error } = await supabaseServer.auth.getUser(token);
    
    if (error || !data?.user) {
      logAuthEvent('access_denied', undefined, ip, userAgent);
      
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { error: 'Invalid token' }, 
          { status: 401 }
        );
      }
      
      const loginUrl = createRedirectUrl('/login', pathname);
      return NextResponse.redirect(new URL(loginUrl, request.url));
    }
    
    // Obter tipo de usuário
    const user = data.user;
    const userType = (user.user_metadata?.type || 'BUYER') as UserType;
    const userId = user.id;
    
    // Verificar acesso baseado em role
    if (!hasRouteAccess(pathname, userType)) {
      logAuthEvent('access_denied', userId, ip, userAgent);
      
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { error: 'Forbidden: Access denied for your user type' }, 
          { status: 403 }
        );
      }
      
      // Redirecionar para dashboard apropriado
      const redirectPath = getDashboardPath(userType);
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
    
    // Adicionar informações do usuário ao request para uso posterior
    const response = NextResponse.next();
    response.headers.set('x-user-id', userId);
    response.headers.set('x-user-type', userType);
    
    // Adicionar headers de segurança
    const securityHeaders = createSecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    logAuthEvent('access_denied', undefined, ip, userAgent);
    
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Internal server error' }, 
        { status: 500 }
      );
    }
    
    const loginUrl = createRedirectUrl('/login', pathname);
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }
}

/**
 * Middleware específico para rotas de API
 */
export async function apiAuthMiddleware(
  request: NextRequest,
  requiredRole?: UserType | UserType[]
): Promise<NextResponse | { user: any; userId: string; userType: UserType }> {
  const token = extractToken(request);
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const { data, error } = await supabaseServer.auth.getUser(token);
    
    if (error || !data?.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const user = data.user;
    const userType = (user.user_metadata?.type || 'BUYER') as UserType;
    
    // Verificar role se especificado
    if (requiredRole) {
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      
      if (!allowedRoles.includes(userType) && userType !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' }, 
          { status: 403 }
        );
      }
    }
    
    return { user, userId: user.id, userType };
    
  } catch (error) {
    console.error('API auth middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

/**
 * Middleware para verificar se usuário já está autenticado (redirect para dashboard)
 */
export async function redirectIfAuthenticated(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  
  // Apenas aplicar em rotas de auth
  if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
    return null;
  }
  
  const token = extractToken(request);
  
  if (!token) {
    return null; // Não está autenticado, continuar
  }
  
  try {
    if (!supabaseServer) {
      return null; // Erro de configuração, continuar
    }
    
    const { data, error } = await supabaseServer.auth.getUser(token);
    
    if (!error && data?.user) {
      // Usuário já está autenticado, redirecionar para dashboard
      const userType = (data.user.user_metadata?.type || 'BUYER') as UserType;
      const dashboardPath = getDashboardPath(userType);
      
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
  } catch (error) {
    // Se houver erro, continuar normalmente para página de login
  }
  
  return null;
}

/**
 * Criar middleware personalizado para uma rota específica
 */
export function createRouteMiddleware(
  options: {
    requireAuth?: boolean;
    requiredRole?: UserType | UserType[];
    allowOwnerAccess?: boolean;
  } = {}
) {
  return async (request: NextRequest) => {
    if (!options.requireAuth) {
      return null;
    }
    
    const authResult = await apiAuthMiddleware(request, options.requiredRole);
    
    if (authResult instanceof NextResponse) {
      return authResult; // É um erro response
    }
    
    // Sucesso - adicionar dados do usuário aos headers
    const response = NextResponse.next();
    response.headers.set('x-user-id', authResult.userId);
    response.headers.set('x-user-type', authResult.userType);
    
    return response;
  };
}