import { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { prisma } from '../src/lib/prisma.js'
import jwt from 'jsonwebtoken'

const planSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  slug: z.string().min(1, 'Slug é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  price: z.number().min(0, 'Preço deve ser positivo'),
  originalPrice: z.number().min(0).optional(),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']),
  features: z.array(z.string()),
  maxProducts: z.number().int().min(0),
  maxOrders: z.number().int().min(0),
  maxStorage: z.number().int().min(0),
  hasAnalytics: z.boolean().default(false),
  hasSupport: z.boolean().default(false),
  supportLevel: z.enum(['BASIC', 'PREMIUM', 'ENTERPRISE']).optional(),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0)
})

// Função para verificar token JWT
function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return decoded
  } catch {
    return null
  }
}

// Função para obter usuário autenticado
async function getAuthenticatedUser(req: VercelRequest) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const decoded = verifyToken(token)
  if (!decoded) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  })

  return user
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'GET') {
      // Listar todos os planos ativos
      const plans = await prisma.plan.findMany({
        where: {
          isActive: true
        },
        orderBy: {
          order: 'asc'
        }
      })

      return res.status(200).json({
        success: true,
        data: plans
      })
    }

    if (req.method === 'POST') {
      // Criar novo plano (apenas admin)
      const user = await getAuthenticatedUser(req)
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Token inválido ou expirado' 
        })
      }

      if (user.type !== 'ADMIN') {
        return res.status(403).json({ 
          success: false, 
          error: 'Acesso negado. Apenas administradores podem criar planos.' 
        })
      }

      const validatedData = planSchema.parse(req.body)

      // Verificar se já existe um plano com o mesmo nome ou slug
      const existingPlan = await prisma.plan.findFirst({
        where: {
          OR: [
            { name: validatedData.name },
            { slug: validatedData.slug }
          ]
        }
      })

      if (existingPlan) {
        return res.status(400).json({
          success: false,
          error: 'Já existe um plano com este nome ou slug'
        })
      }

      const plan = await prisma.plan.create({
        data: validatedData
      })

      return res.status(201).json({
        success: true,
        data: plan,
        message: 'Plano criado com sucesso'
      })
    }

    if (req.method === 'PUT') {
      // Atualizar plano (apenas admin)
      const user = await getAuthenticatedUser(req)
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Token inválido ou expirado' 
        })
      }

      if (user.type !== 'ADMIN') {
        return res.status(403).json({ 
          success: false, 
          error: 'Acesso negado. Apenas administradores podem atualizar planos.' 
        })
      }

      const { id, ...updateData } = req.body

      if (!id) {
        return res.status(400).json({ 
          success: false, 
          error: 'ID do plano é obrigatório' 
        })
      }

      const validatedData = planSchema.partial().parse(updateData)

      // Verificar se o plano existe
      const existingPlan = await prisma.plan.findUnique({
        where: { id }
      })

      if (!existingPlan) {
        return res.status(404).json({ 
          success: false, 
          error: 'Plano não encontrado' 
        })
      }

      const updatedPlan = await prisma.plan.update({
        where: { id },
        data: validatedData
      })

      return res.status(200).json({
        success: true,
        data: updatedPlan,
        message: 'Plano atualizado com sucesso'
      })
    }

    return res.status(405).json({ 
      success: false, 
      error: 'Método não permitido' 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.issues
      })
    }

    console.error('Erro na API de planos:', error)
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}