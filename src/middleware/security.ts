/**
 * MIDDLEWARE DE SEGURANÇA CONSOLIDADO
 * 
 * Aplica rate limiting, validação de entrada e CORS
 * Usa o sistema consolidado de rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { generalRateLimiter, apiRateLimiter, uploadRateLimiter, createRateLimitHeaders } from '@/lib/rateLimiting';

/**
 * Aplicar rate limiting baseado no tipo de rota
 */
export async function securityMiddleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  
  // Determinar qual rate limiter usar baseado na rota
  let rateLimiter = generalRateLimiter;
  let maxRequests = 100;
  
  if (pathname.startsWith('/api/upload')) {
    rateLimiter = uploadRateLimiter;
    maxRequests = 10;
  } else if (pathname.startsWith('/api')) {
    rateLimiter = apiRateLimiter;
    maxRequests = 1000;
  }
  
  // Aplicar rate limiting
  const rateLimitResult = await rateLimiter.isAllowed(request);
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { 
        error: 'Too many requests. Please try again later.',
        retryAfter: rateLimitResult.resetTime ? Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000) : 60
      },
      { 
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult, maxRequests)
      }
    );
  }
  
  // Se chegou até aqui, rate limiting passou
  return NextResponse.next();
}

/**
 * Validação básica de entrada
 */
export function validateInputMiddleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  
  // Verificar tamanho da URL
  if (pathname.length > 2048) {
    return NextResponse.json(
      { error: 'URL too long' },
      { status: 414 }
    );
  }
  
  // Verificar caracteres suspeitos na URL
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /onclick/i,
    /onerror/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(pathname))) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
  
  // Verificar User-Agent suspeito (bots conhecidos)
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousBots = [
    /sqlmap/i,
    /nikto/i,
    /wpscan/i,
    /nmap/i,
    /masscan/i,
    /curl.*bot/i
  ];
  
  if (suspiciousBots.some(pattern => pattern.test(userAgent))) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }
  
  return NextResponse.next();
}

/**
 * Middleware CORS
 */
export function corsMiddleware(request: NextRequest): NextResponse {
  // Lista de origens permitidas
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.NEXT_PUBLIC_APP_URL || '',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
  ].filter(Boolean);
  
  const origin = request.headers.get('origin');
  const response = NextResponse.next();
  
  // Verificar se a origem está na lista de permitidas
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    // Em desenvolvimento, permitir qualquer origem local
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
  }
  
  // Headers CORS padrão
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name'
  );
  
  // Preflight request
  if (request.method === 'OPTIONS') {
    return NextResponse.json(null, { status: 200, headers: response.headers });
  }
  
  // Headers de segurança adicionais
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );
  
  return response;
}