import { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { prisma } from '../src/lib/prisma.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const createProductSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  price: z.number().positive('Preço deve ser positivo'),
  comparePrice: z.number().positive().optional(),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  subcategory: z.string().optional(),
  stock: z.number().int().min(0, 'Estoque não pode ser negativo'),
  minStock: z.number().int().min(0).default(5),
  sku: z.string().optional(),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive()
  }).optional(),
  tags: z.array(z.string()).default([]),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string(),
    isMain: z.boolean().default(false)
  })).min(1, 'Pelo menos uma imagem é obrigatória'),
  specifications: z.array(z.object({
    name: z.string().min(1, 'Nome da especificação é obrigatório'),
    value: z.string().min(1, 'Valor da especificação é obrigatório')
  })).default([])
})

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('12'),
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
  sortBy: z.enum(['name', 'price', 'createdAt', 'rating', 'sales']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  storeId: z.string().optional(),
  sellerId: z.string().optional()
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
    where: { id: decoded.userId },
    include: {
      seller: {
        include: {
          store: true
        }
      }
    }
  })

  return user
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[PRODUCTS] Iniciando handler de produtos')
  console.log('[PRODUCTS] Método:', req.method)
  console.log('[PRODUCTS] Query params:', JSON.stringify(req.query, null, 2))
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    console.log('[PRODUCTS] Respondendo OPTIONS')
    return res.status(200).end()
  }

  try {
    console.log('[PRODUCTS] Testando conexão com Prisma...')
    if (req.method === 'GET') {
      // Listar produtos com filtros e paginação
      const query = querySchema.parse(req.query)

      const where: any = {
        isActive: true
      }

      // Filtros
      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { tags: { has: query.search } }
        ]
      }

      if (query.category) {
        where.category = { slug: query.category }
      }

      if (query.minPrice || query.maxPrice) {
        where.price = {}
        if (query.minPrice) where.price.gte = query.minPrice
        if (query.maxPrice) where.price.lte = query.maxPrice
      }

      if (query.storeId) {
        where.storeId = query.storeId
      }

      if (query.sellerId) {
        where.sellerId = query.sellerId
      }

      // Ordenação
      const orderBy: any = {}
      if (query.sortBy === 'sales') {
        orderBy.salesCount = query.sortOrder
      } else {
        orderBy[query.sortBy] = query.sortOrder
      }

      // Paginação
      const skip = (query.page - 1) * query.limit

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            images: {
              orderBy: { order: 'asc' }
            },
            specifications: true,
            category: true,
            store: {
              select: {
                id: true,
                name: true,
                slug: true,
                rating: true
              }
            },
            seller: {
              select: {
                id: true,
                storeName: true,
                rating: true
              }
            }
          },
          orderBy,
          skip,
          take: query.limit
        }),
        prisma.product.count({ where })
      ])

      const totalPages = Math.ceil(total / query.limit)

      return res.status(200).json({
        products,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
          hasNext: query.page < totalPages,
          hasPrev: query.page > 1
        }
      })
    }

    if (req.method === 'POST') {
      // Criar produto (apenas vendedores)
      const user = await getAuthenticatedUser(req)
      if (!user) {
        return res.status(401).json({ error: 'Token inválido ou expirado' })
      }

      if (!user.seller) {
        return res.status(403).json({ error: 'Acesso negado. Apenas vendedores podem criar produtos.' })
      }

      const validatedData = createProductSchema.parse(req.body)

      // Verificar se o vendedor tem uma loja
      if (!user.seller?.store) {
        return res.status(400).json({ error: 'Vendedor deve ter uma loja para criar produtos' })
      }

      // Verificar se a categoria existe
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId }
      })

      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada' })
      }

      // Criar produto
      const product = await prisma.product.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          price: validatedData.price,
          comparePrice: validatedData.comparePrice,
          categoryId: validatedData.categoryId,
          subcategory: validatedData.subcategory,
          stock: validatedData.stock,
          minStock: validatedData.minStock,
          sku: validatedData.sku,
          weight: validatedData.weight,
          dimensions: validatedData.dimensions,
          tags: validatedData.tags,
          seoTitle: validatedData.seoTitle,
          seoDescription: validatedData.seoDescription,
          sellerId: user.seller.id,
          storeId: user.seller.store.id,
          images: {
            create: validatedData.images.map((img, index) => ({
              url: img.url,
              alt: img.alt,
              order: index,
              isMain: img.isMain
            }))
          },
          ...(validatedData.specifications && validatedData.specifications.length > 0 && {
            specifications: {
              createMany: {
                data: validatedData.specifications.map(spec => ({
                  name: spec.name,
                  value: spec.value
                }))
              }
            }
          })
        },
        include: {
          images: {
            orderBy: { order: 'asc' }
          },
          specifications: true,
          category: true,
          store: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      })

      // Atualizar contador de produtos da loja
      await prisma.store.update({
        where: { id: user.seller.store.id },
        data: {
          productCount: {
            increment: 1
          }
        }
      })

      return res.status(201).json(product)
    }

    console.log('[PRODUCTS] Método não permitido:', req.method)
    return res.status(405).json({ error: 'Método não permitido' })
  } catch (error) {
    console.error('[PRODUCTS] Erro capturado:', error)
    console.error('[PRODUCTS] Stack trace:', error instanceof Error ? error.stack : 'N/A')
    
    if (error instanceof z.ZodError) {
      console.log('[PRODUCTS] Erro de validação Zod:', error.issues)
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues
      })
    }

    // Log específico para erros do Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('[PRODUCTS] Erro do Prisma - Code:', (error as any).code)
      console.error('[PRODUCTS] Erro do Prisma - Message:', (error as any).message)
    }

    console.error('[PRODUCTS] Erro na API de produtos:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  } finally {
    console.log('[PRODUCTS] Desconectando Prisma...')
    await prisma.$disconnect()
    console.log('[PRODUCTS] Prisma desconectado')
  }
}