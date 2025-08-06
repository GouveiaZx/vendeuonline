import { ApiRequest as NextRequest, ApiResponse as NextResponse } from '@/types/api'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireSeller, AuthenticatedRequest } from '@/lib/middleware'
import { withApiSecurity } from '@/lib/security-middleware'

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
    name: z.string(),
    value: z.string()
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

// GET - Listar produtos com filtros e paginação
async function getProductsHandler(request: NextRequest) {
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

    return NextResponse.json({
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar produto (apenas vendedores)
const createProductHandler = async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    const validatedData = createProductSchema.parse(body)
    const user = request.user

    // Verificar se o vendedor tem uma loja
    if (!user.seller?.store) {
      return NextResponse.json(
        { error: 'Vendedor deve ter uma loja para criar produtos' },
        { status: 400 }
      )
    }

    // Verificar se a categoria existe
    const category = await prisma.category.findUnique({
      where: { id: validatedData.categoryId }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
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
        specifications: {
          create: validatedData.specifications as any
        }
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

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao criar produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Aplicar middleware de segurança
export const GET = withApiSecurity(getProductsHandler)
export const POST = requireSeller(withApiSecurity(createProductHandler))