import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from './auth'
import { UserType } from '@/types'

// Tipos estendidos para incluir relações
export interface AuthenticatedUser {
  id: string;
  email: string;
  type: UserType;
  name?: string;
  buyer?: any;
  seller?: any & { store?: any };
  admin?: any;
}

export interface AuthResult {
  success: boolean
  user?: AuthenticatedUser
  error?: string
}

/**
 * Middleware de autenticação que pode ser usado em qualquer API
 */
export async function authenticate(request: Request): Promise<AuthResult> {
  try {
    const authResult = await getUserFromToken(request)
    
    if (!authResult.success || !authResult.user) {
      return {
        success: false,
        error: 'Token de autenticação necessário'
      }
    }

    return {
      success: true,
      user: authResult.user as AuthenticatedUser
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error)
    return {
      success: false,
      error: 'Token inválido'
    }
  }
}

/**
 * Middleware que requer tipos específicos de usuário
 */
export async function authenticateWithRole(
  request: Request, 
  requiredTypes: UserType[]
): Promise<AuthResult> {
  const authResult = await authenticate(request)
  
  if (!authResult.success || !authResult.user) {
    return authResult
  }

  if (!requiredTypes.includes(authResult.user.type)) {
    return {
      success: false,
      error: 'Acesso negado - tipo de usuário não autorizado'
    }
  }

  return authResult
}

/**
 * HOC para proteger rotas API com autenticação
 */
export function withAuth(
  handler: (request: Request, user: AuthenticatedUser) => Promise<Response>
) {
  return async (request: Request) => {
    const authResult = await authenticate(request)
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Não autorizado' },
        { status: 401 }
      )
    }

    return handler(request, authResult.user)
  }
}

/**
 * HOC para proteger rotas API com autenticação e tipos específicos
 */
export function withAuthAndRole(
  handler: (request: Request, user: AuthenticatedUser) => Promise<Response>,
  requiredTypes: UserType[]
) {
  return async (request: Request) => {
    const authResult = await authenticateWithRole(request, requiredTypes)
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Acesso negado' },
        { status: authResult.error?.includes('autorizado') ? 403 : 401 }
      )
    }

    return handler(request, authResult.user)
  }
}

// Middlewares específicos para tipos comuns
export const withBuyerAuth = (handler: (request: Request, user: AuthenticatedUser) => Promise<Response>) =>
  withAuthAndRole(handler, ['BUYER'])

export const withSellerAuth = (handler: (request: Request, user: AuthenticatedUser) => Promise<Response>) =>
  withAuthAndRole(handler, ['SELLER'])

export const withAdminAuth = (handler: (request: Request, user: AuthenticatedUser) => Promise<Response>) =>
  withAuthAndRole(handler, ['ADMIN'])

export const withSellerOrAdminAuth = (handler: (request: Request, user: AuthenticatedUser) => Promise<Response>) =>
  withAuthAndRole(handler, ['SELLER', 'ADMIN'])

/**
 * Verifica se o usuário é dono do recurso (para vendedores)
 */
export function checkResourceOwnership(user: AuthenticatedUser, sellerId: string): boolean {
  if (user.type === 'ADMIN') {
    return true // Admin pode acessar qualquer recurso
  }
  
  if (user.type === 'SELLER' && user.seller?.id === sellerId) {
    return true // Vendedor pode acessar seus próprios recursos
  }
  
  return false
}

/**
 * Helper para validar se um usuário pode acessar uma loja
 */
export function checkStoreAccess(user: AuthenticatedUser, storeId: string): boolean {
  if (user.type === 'ADMIN') {
    return true
  }
  
  if (user.type === 'SELLER' && user.seller?.store?.id === storeId) {
    return true
  }
  
  return false
}