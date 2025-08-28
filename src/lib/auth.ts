import jwt, { SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// Validação crítica de segurança
if (!JWT_SECRET) {
  throw new Error('❌ JWT_SECRET é obrigatório. Configure a variável de ambiente JWT_SECRET com pelo menos 32 caracteres.')
}

if (JWT_SECRET.length < 32) {
  throw new Error('❌ JWT_SECRET deve ter pelo menos 32 caracteres para garantir segurança adequada.')
}

export interface JWTPayload {
  userId: string
  email: string
  type: string
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: JWT_EXPIRES_IN } as SignOptions)
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as JWTPayload
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getUserFromToken(request: Request | NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, user: null, error: 'No authorization header' }
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      return { success: false, user: null, error: 'Invalid token' }
    }

    // Usar Supabase para buscar usuário
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        type,
        status,
        name,
        avatar,
        created_at,
        updated_at,
        buyers (
          id,
          name,
          phone,
          birth_date,
          addresses,
          wishlist
        ),
        sellers (
          id,
          name,
          phone,
          document,
          current_plan,
          plan_expires_at,
          store_id,
          stores (
            id,
            name,
            logo,
            banner,
            category,
            is_active
          )
        ),
        admins (
          id,
          permissions,
          access_level
        )
      `)
      .eq('id', payload.userId)
      .single();

    if (error || !user) {
      return { success: false, user: null, error: 'User not found' }
    }

    return { success: true, user, error: null }
  } catch (error) {
    console.error('Erro ao buscar usuário por token:', error)
    return { success: false, user: null, error: 'Internal error' }
  }
}

export function createAuthResponse(user: any, token: string) {
  const { password, ...userWithoutPassword } = user
  return {
    user: userWithoutPassword,
    token,
    expiresIn: JWT_EXPIRES_IN
  }
}

export async function getAuthenticatedUser(request: Request | NextRequest) {
  const result = await getUserFromToken(request)
  
  if (!result.success || !result.user) {
    return null
  }
  
  return result.user
}

export async function requireAdmin(request: Request | NextRequest) {
  const result = await getUserFromToken(request)
  
  if (!result.success || !result.user) {
    throw new Error('Unauthorized')
  }
  
  if (result.user.type !== 'ADMIN') {
    throw new Error('Admin access required')
  }
  
  return result.user
}