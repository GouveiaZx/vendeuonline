import { ApiRequest as NextRequest, ApiResponse as NextResponse } from '@/types/api'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireSeller, AuthenticatedRequest } from '@/lib/middleware'
import { withApiSecurity } from '@/lib/security-middleware'

const createStoreSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  logo: z.string().url().optional(),
  banner: z.string().url().optional(),
  address: z.string().min(5, 'Endereço é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zipCode: z.string().min(8, 'CEP inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido'),
  whatsapp: z.string().optional(),
  website: z.string().url().optional(),
  category: z.string().min(2, 'Categoria é obrigatória'),
  socialMedia: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional()
  }).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional()
})

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('12'),
  search: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  isVerified: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['name', 'rating', 'createdAt', 'salesCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// GET - Listar lojas com filtros e paginação
async function getStoresHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = querySchema.parse(Object.fromEntries(searchParams))

    const where: any = {
      isActive: true
    }

    // Filtros
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } }
      ]
    }

    if (query.category) {
      where.category = { contains: query.category, mode: 'insensitive' }
    }

    if (query.city) {
      where.city = { contains: query.city, mode: 'insensitive' }
    }

    if (query.state) {
      where.state = { contains: query.state, mode: 'insensitive' }
    }

    if (query.isVerified !== undefined) {
      where.isVerified = query.isVerified
    }

    // Ordenação
    const orderBy: any = {}
    orderBy[query.sortBy] = query.sortOrder

    // Paginação
    const skip = (query.page - 1) * query.limit

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              storeName: true,
              rating: true,
              totalSales: true
            }
          },
          products: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              price: true,
              images: {
                where: { isMain: true },
                take: 1
              }
            },
            take: 4,
            orderBy: {
              salesCount: 'desc'
            }
          },
          _count: {
            select: {
              products: {
                where: { isActive: true }
              },
              orders: true,
              reviews: true
            }
          }
        },
        orderBy,
        skip,
        take: query.limit
      }),
      prisma.store.count({ where })
    ])

    const totalPages = Math.ceil(total / query.limit)

    return NextResponse.json({
      stores,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao buscar lojas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova loja
async function createStoreHandlerBase(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const validatedData = createStoreSchema.parse(body)
    const user = request.user

    // Verificar se o vendedor já tem uma loja
    const existingStore = await prisma.store.findUnique({
      where: { sellerId: user.seller.id }
    })

    if (existingStore) {
      return NextResponse.json(
        { error: 'Vendedor já possui uma loja' },
        { status: 400 }
      )
    }

    // Gerar slug único
    const baseSlug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    let slug = baseSlug
    let counter = 1
    
    while (await prisma.store.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Criar loja
    const store = await prisma.store.create({
      data: {
        ...validatedData,
        slug,
        sellerId: user.seller.id,
        socialMedia: validatedData.socialMedia || {}
      } as any,
      include: {
        seller: {
          select: {
            id: true,
            storeName: true,
            rating: true,
            totalSales: true
          }
        },
        _count: {
          select: {
            products: {
              where: { isActive: true }
            },
            orders: true,
            reviews: true
          }
        }
      }
    })

    return NextResponse.json(store, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao criar loja:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Aplicar middleware de segurança
export const GET = withApiSecurity(getStoresHandler)
export const POST = requireSeller(withApiSecurity(createStoreHandlerBase))