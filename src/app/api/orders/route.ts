import { NextRequest, NextResponse } from '@/types/api'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticatedRequest, authMiddleware } from '@/lib/middleware'
import { withApiSecurity } from '@/lib/security-middleware'

const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().positive()
  })).min(1, 'Pelo menos um item é obrigatório'),
  shippingAddressId: z.string(),
  billingAddressId: z.string().optional(),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO', 'WHATSAPP']),
  notes: z.string().optional()
})

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  storeId: z.string().optional(),
  sellerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

// GET - Listar pedidos (compradores e vendedores)
const getOrdersHandler = async (request: Request) => {
  // Verificar autenticação
  const authResult = await authMiddleware(request);
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  const user = authResult.user;
  if (!['BUYER', 'SELLER'].includes(user.type)) {
    return NextResponse.json(
      { error: 'Acesso negado' },
      { status: 403 }
    );
  }
  try {
    const { searchParams } = new URL(request.url)
    const query = querySchema.parse(Object.fromEntries(searchParams))
    // user já foi definido acima como authResult.user

    const where: any = {}

    // Filtrar por tipo de usuário
    if (user.type === 'BUYER') {
      where.buyerId = user.id
    } else if (user.type === 'SELLER') {
      where.sellerId = user.seller.id
    } else if (user.type === 'ADMIN') {
      // Admin pode ver todos os pedidos
    } else {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Aplicar filtros
    if (query.status) {
      where.status = query.status
    }

    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus
    }

    if (query.storeId) {
      where.storeId = query.storeId
    }

    if (query.sellerId && user.type === 'ADMIN') {
      where.sellerId = query.sellerId
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {}
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate)
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate)
      }
    }

    // Paginação
    const skip = (query.page - 1) * query.limit

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: {
                    where: { isMain: true },
                    take: 1
                  }
                }
              }
            }
          },
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          store: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          shippingAddress: true,
          billingAddress: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: query.limit
      }),
      prisma.order.count({ where })
    ])

    const totalPages = Math.ceil(total / query.limit)

    return NextResponse.json({
      orders,
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

    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar pedido (apenas compradores)
const createOrderHandler = async (request: Request) => {
  // Verificar autenticação
  const authResult = await authMiddleware(request);
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  const user = authResult.user;
  if (user.type !== 'BUYER') {
    return NextResponse.json(
      { error: 'Acesso negado' },
      { status: 403 }
    );
  }
  try {
    const body = await request.json()
    const validatedData = createOrderSchema.parse(body)

    // Verificar se o endereço de entrega pertence ao usuário
    const shippingAddress = await prisma.address.findFirst({
      where: {
        id: validatedData.shippingAddressId,
        buyerId: authResult.user.buyer.id
      }
    })

    if (!shippingAddress) {
      return NextResponse.json(
        { error: 'Endereço de entrega inválido' },
        { status: 400 }
      )
    }

    // Verificar endereço de cobrança se fornecido
    let billingAddress = null
    if (validatedData.billingAddressId) {
      billingAddress = await prisma.address.findFirst({
        where: {
          id: validatedData.billingAddressId,
          buyerId: authResult.user.buyer.id
        }
      })

      if (!billingAddress) {
        return NextResponse.json(
          { error: 'Endereço de cobrança inválido' },
          { status: 400 }
        )
      }
    }

    // Verificar produtos e calcular totais
    const productIds = validatedData.items.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true
      },
      include: {
        images: {
          where: { isMain: true },
          take: 1
        },
        store: true
      }
    })

    if (products.length !== validatedData.items.length) {
      return NextResponse.json(
        { error: 'Um ou mais produtos não foram encontrados' },
        { status: 400 }
      )
    }

    // Verificar estoque
    for (const item of validatedData.items) {
      const product = products.find(p => p.id === item.productId)
      if (!product || product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Estoque insuficiente para o produto ${product?.name || 'desconhecido'}` },
          { status: 400 }
        )
      }
    }

    // Agrupar itens por loja (um pedido por loja)
    const itemsByStore = validatedData.items.reduce((acc, item) => {
      const product = products.find(p => p.id === item.productId)!
      const storeId = product.storeId
      
      if (!acc[storeId]) {
        acc[storeId] = {
          store: product.store,
          items: []
        }
      }
      
      acc[storeId].items.push({
        ...item,
        product
      })
      
      return acc
    }, {} as any)

    const createdOrders = []

    // Criar um pedido para cada loja
    for (const [storeId, storeData] of Object.entries(itemsByStore) as any) {
      const subtotal = storeData.items.reduce((sum: number, item: any) => {
        return sum + (item.price * item.quantity)
      }, 0)

      const shipping = 0 // Calcular frete baseado na loja e endereço
      const tax = 0 // Calcular impostos se necessário
      const discount = 0 // Aplicar descontos se houver
      const total = subtotal + shipping + tax - discount

      const order = await prisma.order.create({
        data: {
          buyerId: authResult.user.id,
          sellerId: storeData.store.sellerId,
          storeId: storeId,
          subtotal,
          shipping,
          tax,
          discount,
          total,
          paymentMethod: validatedData.paymentMethod,
          shippingAddressId: validatedData.shippingAddressId,
          billingAddressId: validatedData.billingAddressId,
          notes: validatedData.notes,
          items: {
            create: storeData.items.map((item: any) => ({
              productId: item.productId,
              productName: item.product.name,
              productImage: item.product.images[0]?.url || '',
              price: item.price,
              quantity: item.quantity,
              total: item.price * item.quantity
            }))
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: {
                    where: { isMain: true },
                    take: 1
                  }
                }
              }
            }
          },
          store: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          shippingAddress: true,
          billingAddress: true
        }
      })

      // Atualizar estoque dos produtos
      for (const item of storeData.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            },
            salesCount: {
              increment: item.quantity
            }
          }
        })
      }

      // Atualizar contador de vendas da loja
      await prisma.store.update({
        where: { id: storeId },
        data: {
          salesCount: {
            increment: 1
          }
        }
      })

      createdOrders.push(order)
    }

    return NextResponse.json(
      { 
        orders: createdOrders,
        message: `${createdOrders.length} pedido(s) criado(s) com sucesso`
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao criar pedido:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Aplicar middleware de segurança
export const GET = withApiSecurity(getOrdersHandler)
export const POST = withApiSecurity(createOrderHandler)