import { NextRequest, NextResponse } from '@/types/api'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken, createAuthResponse } from '@/lib/auth'
import { withAuthSecurity } from '@/lib/security-middleware'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  phone: z.string().min(10, 'Telefone inválido'),
  type: z.enum(['BUYER', 'SELLER'], {
    message: 'Tipo deve ser BUYER ou SELLER'
  }),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  // Campos específicos para vendedor
  storeName: z.string().optional(),
  storeDescription: z.string().optional(),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  zipCode: z.string().optional(),
  category: z.string().optional()
})

async function registerHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await hashPassword(validatedData.password)

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        phone: validatedData.phone,
        type: validatedData.type,
        city: validatedData.city,
        state: validatedData.state
      } as any,
      include: {
        buyer: true,
        seller: {
          include: {
            store: true
          }
        },
        admin: true
      }
    })

    // Criar perfil específico baseado no tipo
    if (validatedData.type === 'BUYER') {
      await prisma.buyer.create({
        data: {
          userId: user.id
        } as any
      })
    } else if (validatedData.type === 'SELLER') {
      if (!validatedData.storeName || !validatedData.storeDescription || 
          !validatedData.address || !validatedData.zipCode || !validatedData.category) {
        return NextResponse.json(
          { error: 'Dados da loja são obrigatórios para vendedores' },
          { status: 400 }
        )
      }

      const storeSlug = validatedData.storeName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      const seller = await prisma.seller.create({
        data: {
          userId: user.id,
          storeName: validatedData.storeName,
          storeDescription: validatedData.storeDescription,
          storeSlug,
          cnpj: validatedData.cnpj,
          address: validatedData.address,
          zipCode: validatedData.zipCode,
          category: validatedData.category
        } as any
      })

      // Criar loja
      await prisma.store.create({
        data: {
          sellerId: seller.id,
          name: validatedData.storeName,
          slug: storeSlug,
          description: validatedData.storeDescription,
          address: validatedData.address,
          city: validatedData.city,
          state: validatedData.state,
          zipCode: validatedData.zipCode,
          phone: validatedData.phone,
          email: validatedData.email,
          category: validatedData.category
        }
      })
    }

    // Buscar usuário atualizado com relacionamentos
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        buyer: true,
        seller: {
          include: {
            store: true
          }
        },
        admin: true
      }
    })

    // Gerar token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      type: user.type
    })

    return NextResponse.json(
      createAuthResponse(updatedUser, token),
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro no registro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const POST = withAuthSecurity(registerHandler)