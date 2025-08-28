import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { comparePassword, generateToken } from '@/lib/auth'
import { authRateLimiter, createRateLimitHeaders } from '@/lib/rateLimiting'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
})

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Verificar rate limiting
    const rateLimitResult = await authRateLimiter.isAllowed(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again later.' },
        { 
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult, 5)
        }
      );
    }

    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Criar cliente Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Buscar usuário por email
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id, name, email, password, phone, type, city, state, avatar, isVerified, createdAt, updatedAt,
        buyers(id, userId),
        sellers(id, userId, storeName, storeDescription, storeSlug, plan, isActive, rating),
        stores(id, name, slug, description)
      `)
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    // Verificar senha
    const isValidPassword = await comparePassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    // Gerar token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      type: user.type
    })

    // Preparar resposta do usuário (sem senha)
    const { password: _, ...userWithoutPassword } = user
    
    return NextResponse.json({
      user: userWithoutPassword,
      token,
      message: 'Login realizado com sucesso'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    console.error('Erro no login:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

