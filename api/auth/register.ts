import { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { prisma } from '../../src/lib/prisma.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

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

function generateToken(payload: any): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret'
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

function createAuthResponse(user: any, token: string) {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      city: user.city,
      state: user.state,
      phone: user.phone,
      buyer: user.buyer,
      seller: user.seller,
      admin: user.admin
    },
    token
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const validatedData = registerSchema.parse(req.body)

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Email já está em uso' })
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

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
      },
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
        }
      })
    } else if (validatedData.type === 'SELLER') {
      if (!validatedData.storeName || !validatedData.storeDescription || 
          !validatedData.address || !validatedData.zipCode || !validatedData.category) {
        return res.status(400).json({ error: 'Dados da loja são obrigatórios para vendedores' })
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
        }
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

    return res.status(201).json(createAuthResponse(updatedUser, token))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues
      })
    }

    console.error('Erro no registro:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  } finally {
    await prisma.$disconnect()
  }
}