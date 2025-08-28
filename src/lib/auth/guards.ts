/**
 * AUTHENTICATION GUARDS
 * 
 * Funções para controle de acesso e validação de permissões
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '../auth';
import type { UserType, User } from '@/types';

/**
 * Guard para verificar se o usuário está autenticado
 */
export async function requireAuthenticated(request: NextRequest) {
  const result = await getUserFromToken(request);
  
  if (!result.success || !result.user) {
    throw new Error('Authentication required');
  }
  
  return result.user;
}

/**
 * Guard para verificar se o usuário é admin
 */
export async function requireAdmin(request: NextRequest) {
  const user = await requireAuthenticated(request);
  
  if (user.type !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  
  return user;
}

/**
 * Guard para verificar se o usuário é seller
 */
export async function requireSeller(request: NextRequest) {
  const user = await requireAuthenticated(request);
  
  if (user.type !== 'SELLER') {
    throw new Error('Seller access required');
  }
  
  return user;
}

/**
 * Guard para verificar se o usuário é buyer
 */
export async function requireBuyer(request: NextRequest) {
  const user = await requireAuthenticated(request);
  
  if (user.type !== 'BUYER') {
    throw new Error('Buyer access required');
  }
  
  return user;
}

/**
 * Guard flexível para verificar múltiples roles
 */
export async function requireRole(request: NextRequest, allowedRoles: UserType[]) {
  const user = await requireAuthenticated(request);
  
  if (!allowedRoles.includes(user.type)) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
  }
  
  return user;
}

/**
 * Guard para verificar se o usuário pode acessar um recurso específico
 */
export async function requireOwnershipOrAdmin(
  request: NextRequest, 
  resourceOwnerId: string
) {
  const user = await requireAuthenticated(request);
  
  // Admin pode acessar qualquer recurso
  if (user.type === 'ADMIN') {
    return user;
  }
  
  // Usuário deve ser o dono do recurso
  if (user.id !== resourceOwnerId) {
    throw new Error('Access denied. You can only access your own resources');
  }
  
  return user;
}

/**
 * Guard para verificar se o usuário pode acessar uma loja
 */
export async function requireStoreAccess(
  request: NextRequest, 
  storeId: string
) {
  const user = await requireAuthenticated(request);
  
  // Admin pode acessar qualquer loja
  if (user.type === 'ADMIN') {
    return user;
  }
  
  // Seller deve ser o dono da loja
  if (user.type === 'SELLER') {
    // Verificar se o usuário é dono da loja (precisa acessar dados da loja)
    const sellerProfile = user.sellers?.[0];
    if (sellerProfile?.stores?.[0]?.id === storeId) {
      return user;
    }
  }
  
  throw new Error('Access denied. You do not have access to this store');
}

/**
 * Guard para API routes com response automático
 */
export function createApiGuard(guardFunction: (request: NextRequest) => Promise<User>) {
  return async (request: NextRequest) => {
    try {
      return await guardFunction(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Access denied';
      
      if (message.includes('Authentication required')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      } else if (message.includes('Access denied') || message.includes('required')) {
        return NextResponse.json({ error: message }, { status: 403 });
      } else {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }
  };
}

/**
 * Helper para obter usuário sem lançar erro
 */
export async function getOptionalUser(request: NextRequest): Promise<User | null> {
  try {
    const result = await getUserFromToken(request);
    if (!result.success || !result.user) return null;
    
    // Converter para formato User correto
    const rawUser = result.user;
    const user: User = {
      id: rawUser.id,
      email: rawUser.email,
      type: rawUser.type,
      status: rawUser.status,
      name: rawUser.name,
      phone: rawUser.buyers?.[0]?.phone || '',
      city: rawUser.buyers?.[0]?.addresses?.[0]?.city || '',
      state: rawUser.buyers?.[0]?.addresses?.[0]?.state || '',
      avatar: rawUser.avatar,
      isVerified: false,
      createdAt: rawUser.created_at || new Date().toISOString(),
      updatedAt: rawUser.updated_at || new Date().toISOString(),
      buyer: rawUser.buyers?.[0] ? {
        ...rawUser.buyers[0],
        userId: rawUser.id
      } : undefined,
      seller: rawUser.sellers?.[0] ? {
        id: rawUser.sellers[0].id,
        userId: rawUser.id,
        storeName: rawUser.sellers[0].stores?.[0]?.name || '',
        storeDescription: '',
        storeSlug: '',
        address: '',
        zipCode: '',
        category: rawUser.sellers[0].stores?.[0]?.category || '',
        plan: rawUser.sellers[0].current_plan || 'GRATUITO',
        commission: 0,
        totalSales: 0,
        isActive: rawUser.sellers[0].stores?.[0]?.is_active || false,
        rating: 0
      } : undefined,
      admin: rawUser.admins?.[0] ? {
        ...rawUser.admins[0],
        userId: rawUser.id
      } : undefined
    };
    
    return user;
  } catch {
    return null;
  }
}

/**
 * Verificar se usuário tem permissões específicas
 */
export function hasPermission(user: User, permission: string): boolean {
  // Admin tem todas as permissões
  if (user.type === 'ADMIN') {
    return true;
  }
  
  // Verificar permissões específicas do perfil admin
  if (user.admin?.permissions) {
    return user.admin.permissions.includes(permission);
  }
  
  return false;
}

/**
 * Verificar se usuário pode gerenciar outros usuários
 */
export function canManageUsers(user: User): boolean {
  return user.type === 'ADMIN' && hasPermission(user, 'manage_users');
}

/**
 * Verificar se usuário pode gerenciar lojas
 */
export function canManageStores(user: User): boolean {
  return user.type === 'ADMIN' && hasPermission(user, 'manage_stores');
}

/**
 * Verificar se usuário pode gerenciar pedidos
 */
export function canManageOrders(user: User): boolean {
  return user.type === 'ADMIN' && hasPermission(user, 'manage_orders');
}