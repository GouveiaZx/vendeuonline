import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(100, 'Senha não pode ter mais de 100 caracteres')
    .regex(/(?=.*[a-z])/, 'Deve conter pelo menos uma letra minúscula')
    .regex(/(?=.*[A-Z])/, 'Deve conter pelo menos uma letra maiúscula') 
    .regex(/(?=.*\d)/, 'Deve conter pelo menos um número')
    .regex(/(?=.*[@$!%*?&])/, 'Deve conter pelo menos um caractere especial (@$!%*?&)'),
  phone: z.string().min(10, 'Telefone inválido'),
  type: z.enum(['BUYER', 'SELLER', 'ADMIN'], {
    message: 'Tipo deve ser BUYER, SELLER ou ADMIN'
  }),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  
  // Campos específicos para vendedor
  storeName: z.string().optional(),
  storeDescription: z.string().optional(),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  zipCode: z.string().optional(),
  category: z.string().optional(),
  
  // Campos específicos para admin
  inviteCode: z.string().optional(),
  adminCode: z.string().optional(),
  securityQuestion: z.string().optional(),
  securityAnswer: z.string().optional(),
  
  // Metadata adicional
  metadata: z.record(z.any()).optional(),
})

// Validação específica para admins
const adminRegisterSchema = registerSchema.extend({
  type: z.literal('ADMIN'),
  inviteCode: z.string().min(1, 'Código de convite obrigatório'),
  adminCode: z.string().min(1, 'Código administrativo obrigatório'),
  securityQuestion: z.string().min(1, 'Pergunta de segurança obrigatória'),
  securityAnswer: z.string().min(3, 'Resposta deve ter pelo menos 3 caracteres'),
})

// Códigos válidos para registro de admin (apenas via environment variables)
const VALID_INVITE_CODES = [
  process.env.ADMIN_INVITE_CODE,
].filter(Boolean)

const VALID_ADMIN_CODES = [
  process.env.ADMIN_CREATE_CODE,
].filter(Boolean)

// Verificar se as variáveis de ambiente estão configuradas
if (VALID_INVITE_CODES.length === 0 || VALID_ADMIN_CODES.length === 0) {
  console.error('❌ Variáveis de ambiente ADMIN_INVITE_CODE e ADMIN_CREATE_CODE devem ser configuradas para permitir registro de admins')
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json()
    
    // Validação específica baseada no tipo de usuário
    let validatedData
    if (body.type === 'ADMIN') {
      // Verificar se as variáveis de ambiente estão configuradas
      if (VALID_INVITE_CODES.length === 0 || VALID_ADMIN_CODES.length === 0) {
        console.error(`❌ Tentativa de registro admin bloqueada - variáveis de ambiente não configuradas: ${body.email}`)
        return NextResponse.json({ 
          error: 'Registro de administrador não disponível. Contate o suporte técnico.' 
        }, { status: 503 })
      }

      validatedData = adminRegisterSchema.parse(body)
      
      // Verificar códigos de admin
      if (!VALID_INVITE_CODES.includes(validatedData.inviteCode)) {
        console.warn(`Tentativa de registro admin com código de convite inválido: ${body.email}`)
        return NextResponse.json({ 
          error: 'Código de convite inválido' 
        }, { status: 401 })
      }
      
      if (!VALID_ADMIN_CODES.includes(validatedData.adminCode)) {
        console.warn(`Tentativa de registro admin com código administrativo inválido: ${body.email}`)
        return NextResponse.json({ 
          error: 'Código administrativo inválido' 
        }, { status: 401 })
      }
    } else {
      validatedData = registerSchema.parse(body)
    }

    // Criar cliente Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Verificar se o email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', validatedData.email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'Email já está em uso' }, { status: 400 })
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Gerar ID único
    const userId = crypto.randomUUID()

    // Criar usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        phone: validatedData.phone,
        type: validatedData.type,
        city: validatedData.city,
        state: validatedData.state,
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (userError) {
      console.error('Erro ao criar usuário:', userError)
      return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
    }

    // Criar perfil específico baseado no tipo
    if (validatedData.type === 'BUYER') {
      const { error: buyerError } = await supabase
        .from('buyers')
        .insert({
          id: userId,
          userId: userId,
          preferences: {
            notifications: true,
            emailUpdates: false,
            theme: 'light'
          }
        })
      
      if (buyerError) {
        console.error('Erro ao criar perfil de comprador:', buyerError)
      }
    } else if (validatedData.type === 'ADMIN') {
      // Criar perfil de administrador
      const { error: adminError } = await supabase
        .from('admins')
        .insert({
          id: userId,
          userId: userId,
          securityQuestion: validatedData.securityQuestion,
          securityAnswer: await bcrypt.hash(validatedData.securityAnswer!, 10),
          permissions: [
            'MANAGE_USERS',
            'MANAGE_PRODUCTS', 
            'MANAGE_STORES',
            'VIEW_ANALYTICS',
            'MANAGE_SYSTEM',
            'MANAGE_SECURITY'
          ],
          lastLoginAt: null,
          loginAttempts: 0,
          isActive: true,
          metadata: validatedData.metadata || {}
        })
      
      if (adminError) {
        console.error('Erro ao criar perfil de administrador:', adminError)
        return NextResponse.json({ 
          error: 'Erro ao criar perfil administrativo' 
        }, { status: 500 })
      }
      
      // Log do registro de admin
      console.info(`Novo administrador registrado: ${validatedData.email} - ID: ${userId}`)
      
      // Registrar evento de segurança
      await supabase
        .from('security_events')
        .insert({
          event_type: 'ADMIN_REGISTER',
          user_id: userId,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          metadata: {
            email: validatedData.email,
            invite_code: validatedData.inviteCode,
            admin_code: validatedData.adminCode
          }
        })
        
    } else if (validatedData.type === 'SELLER') {
      const sellerId = userId
      const storeSlug = `loja-${userId.slice(-8)}`
      
      const { error: sellerError } = await supabase
        .from('sellers')
        .insert({
          id: sellerId,
          userId: userId,
          storeName: validatedData.storeName || `Loja de ${validatedData.name}`,
          storeDescription: validatedData.storeDescription || 'Descrição da loja',
          storeSlug: storeSlug,
          address: validatedData.address || 'Endereço a ser preenchido',
          zipCode: validatedData.zipCode || '00000-000',
          category: validatedData.category || 'Geral',
          plan: 'GRATUITO',
          isActive: true,
          rating: 5.0,
          totalSales: 0,
          commission: 10.0
        })
      
      if (sellerError) {
        console.error('Erro ao criar perfil de vendedor:', sellerError)
      } else {
        // Criar store para o seller
        const { error: storeError } = await supabase
          .from('Store')
          .insert({
            id: crypto.randomUUID(),
            sellerId: sellerId,
            name: validatedData.storeName || `Loja de ${validatedData.name}`,
            slug: storeSlug,
            description: validatedData.storeDescription || 'Descrição da loja',
            logo: null,
            banner: null,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        
        if (storeError) {
          console.error('Erro ao criar loja:', storeError)
        }
      }
    }

    // Preparar resposta (sem senha)
    const { password: _, ...userWithoutPassword } = user
    
    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: 'Usuário registrado com sucesso'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Erro no registro:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

