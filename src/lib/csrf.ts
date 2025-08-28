/**
 * CSRF Protection Middleware
 * 
 * Implementa proteção contra ataques Cross-Site Request Forgery
 * usando tokens seguros e validação de origem.
 */

import { NextRequest, NextResponse } from 'next/server'

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET!
const CSRF_TOKEN_EXPIRY = 1000 * 60 * 60 // 1 hora

if (!CSRF_SECRET) {
  throw new Error('❌ CSRF_SECRET ou JWT_SECRET deve estar configurado')
}

// Função para gerar bytes aleatórios usando Web Crypto API
async function generateRandomBytes(length: number): Promise<Uint8Array> {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint8Array(length))
  }
  // Fallback para Node.js
  const { randomBytes } = await import('crypto')
  return new Uint8Array(randomBytes(length))
}

// Função para criar HMAC usando Web Crypto API
async function createHmacSignature(key: string, data: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(key)
    const messageData = encoder.encode(data)
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
    return Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('')
  }
  
  // Fallback para Node.js
  const { createHmac } = await import('crypto')
  return createHmac('sha256', key).update(data).digest('hex')
}

interface CSRFTokenPayload {
  timestamp: number
  random: string
}

/**
 * Gera um token CSRF seguro
 */
export async function generateCSRFToken(): Promise<string> {
  const randomBytes = await generateRandomBytes(16)
  const random = Array.from(randomBytes, b => b.toString(16).padStart(2, '0')).join('')
  
  const payload: CSRFTokenPayload = {
    timestamp: Date.now(),
    random
  }
  
  const data = JSON.stringify(payload)
  const signature = await createHmacSignature(CSRF_SECRET!, data)
  
  if (typeof btoa !== 'undefined') {
    return btoa(`${data}.${signature}`)
  } else {
    return Buffer.from(`${data}.${signature}`).toString('base64url')
  }
}

/**
 * Valida um token CSRF
 */
export async function validateCSRFToken(token: string): Promise<boolean> {
  try {
    let decoded: string
    if (typeof atob !== 'undefined') {
      decoded = atob(token)
    } else {
      decoded = Buffer.from(token, 'base64url').toString()
    }
    
    const [data, signature] = decoded.split('.')
    
    if (!data || !signature) {
      return false
    }
    
    // Verificar assinatura
    const expectedSignature = await createHmacSignature(CSRF_SECRET!, data)
    if (signature !== expectedSignature) {
      return false
    }
    
    // Verificar expiração
    const payload: CSRFTokenPayload = JSON.parse(data)
    const now = Date.now()
    
    if (now - payload.timestamp > CSRF_TOKEN_EXPIRY) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}

/**
 * Middleware de proteção CSRF
 */
export async function csrfProtection(request: NextRequest): Promise<NextResponse | null> {
  // Apenas aplicar CSRF em métodos que alteram estado
  const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
  if (!protectedMethods.includes(request.method)) {
    return null // Permitir GET, HEAD, OPTIONS
  }
  
  // Verificar origem para requisições CORS
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    `https://${host}`,
    `http://localhost:3000`, // Desenvolvimento
    `http://127.0.0.1:3000`, // Desenvolvimento
  ].filter(Boolean)
  
  // Para requisições AJAX, verificar origem
  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(`🔒 CSRF: Origem não permitida: ${origin}`)
    return NextResponse.json(
      { error: 'Origem não autorizada' },
      { status: 403 }
    )
  }
  
  // Verificar token CSRF
  const csrfToken = request.headers.get('x-csrf-token') 
    || request.headers.get('csrf-token')
    || request.cookies.get('csrf-token')?.value
  
  // Para FormData, tentar extrair do corpo (só para debugging, não recomendado em produção)
  if (!csrfToken && request.headers.get('content-type')?.includes('multipart/form-data')) {
    console.warn('🔒 CSRF: Token não encontrado em FormData - considere usar header')
  }
  
  if (!csrfToken) {
    console.warn('🔒 CSRF: Token não fornecido')
    return NextResponse.json(
      { 
        error: 'Token CSRF obrigatório',
        code: 'CSRF_TOKEN_MISSING'
      },
      { status: 403 }
    )
  }
  
  if (!(await validateCSRFToken(csrfToken))) {
    console.warn('🔒 CSRF: Token inválido ou expirado')
    return NextResponse.json(
      { 
        error: 'Token CSRF inválido ou expirado',
        code: 'CSRF_TOKEN_INVALID'
      },
      { status: 403 }
    )
  }
  
  return null // Permitir requisição
}

/**
 * Endpoint para obter token CSRF
 */
export async function createCSRFResponse(): Promise<NextResponse> {
  const token = await generateCSRFToken()
  
  const response = NextResponse.json({ 
    csrfToken: token 
  })
  
  // Definir cookie seguro
  response.cookies.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_EXPIRY / 1000,
    path: '/'
  })
  
  return response
}

/**
 * Hook para usar em componentes React
 */
export const CSRF_HEADER_NAME = 'X-CSRF-Token'