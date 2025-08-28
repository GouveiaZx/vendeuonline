import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware, validateInputMiddleware, corsMiddleware } from '@/middleware/security';
import { authMiddleware, redirectIfAuthenticated } from '@/lib/auth/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Por enquanto, apenas permitir todas as requisições para diagnosticar problemas
  // TODO: Re-ativar middlewares quando configurações estiverem corretas
  console.log(`[MIDDLEWARE] Processing: ${pathname}`);
  
  // Se chegou até aqui, continuar com a requisição
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};