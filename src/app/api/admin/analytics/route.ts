import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin, AuthenticatedRequest } from '@/lib/middleware'

const querySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  metric: z.enum(['overview', 'sales', 'users', 'products', 'stores']).default('overview')
})

// GET - Analytics globais (apenas admin)
const getAnalyticsHandler = async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const { period, metric } = querySchema.parse(Object.fromEntries(searchParams))

    // Calcular data de início baseada no período
    const now = new Date()
    const startDate = new Date()
    const previousStartDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        previousStartDate.setDate(now.getDate() - 14)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        previousStartDate.setDate(now.getDate() - 60)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        previousStartDate.setDate(now.getDate() - 180)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        previousStartDate.setFullYear(now.getFullYear() - 2)
        break
    }

    // Buscar dados em paralelo
    const [currentPeriodData, previousPeriodData] = await Promise.all([
      getAnalyticsData(startDate, now),
      getAnalyticsData(previousStartDate, startDate)
    ])

    // Calcular crescimento
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    const analytics = {
      period,
      overview: {
        totalRevenue: currentPeriodData.totalRevenue,
        totalOrders: currentPeriodData.totalOrders,
        totalUsers: currentPeriodData.totalUsers,
        totalStores: currentPeriodData.totalStores,
        totalProducts: currentPeriodData.totalProducts,
        avgOrderValue: currentPeriodData.totalOrders > 0 
          ? currentPeriodData.totalRevenue / currentPeriodData.totalOrders 
          : 0,
        conversionRate: currentPeriodData.totalUsers > 0 
          ? (currentPeriodData.totalOrders / currentPeriodData.totalUsers) * 100 
          : 0,
        growth: {
          revenue: calculateGrowth(currentPeriodData.totalRevenue, previousPeriodData.totalRevenue),
          orders: calculateGrowth(currentPeriodData.totalOrders, previousPeriodData.totalOrders),
          users: calculateGrowth(currentPeriodData.totalUsers, previousPeriodData.totalUsers),
          stores: calculateGrowth(currentPeriodData.totalStores, previousPeriodData.totalStores)
        }
      },
      salesByDay: await getSalesByDay(startDate, now),
      topStores: await getTopStores(startDate, now),
      topProducts: await getTopProducts(startDate, now),
      userGrowth: await getUserGrowth(startDate, now),
      ordersByStatus: currentPeriodData.ordersByStatus,
      revenueByCategory: await getRevenueByCategory(startDate, now)
    }

    return NextResponse.json(analytics)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao buscar analytics:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função auxiliar para buscar dados de analytics
async function getAnalyticsData(startDate: Date, endDate: Date) {
  const [orders, users, stores, products, revenue] = await Promise.all([
    // Pedidos no período
    prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate
        }
      }
    }),
    
    // Usuários criados no período
    prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate
        }
      }
    }),
    
    // Lojas criadas no período
    prisma.store.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate
        },
        isActive: true
      }
    }),
    
    // Produtos criados no período
    prisma.product.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate
        },
        isActive: true
      }
    }),
    
    // Receita total no período
    prisma.order.aggregate({
      where: {
        status: 'DELIVERED',
        createdAt: {
          gte: startDate,
          lt: endDate
        }
      },
      _sum: {
        total: true
      }
    })
  ])

  // Agrupar pedidos por status
  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    totalRevenue: revenue._sum.total || 0,
    totalOrders: orders.length,
    totalUsers: users,
    totalStores: stores,
    totalProducts: products,
    ordersByStatus
  }
}

// Função para buscar vendas por dia
async function getSalesByDay(startDate: Date, endDate: Date) {
  const salesByDay = []
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  for (let i = 0; i < daysDiff; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    date.setHours(0, 0, 0, 0)
    
    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)
    
    const [orders, revenue] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      }),
      
      prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
          createdAt: {
            gte: date,
            lt: nextDate
          }
        },
        _sum: {
          total: true
        }
      })
    ])
    
    salesByDay.push({
      date: date.toISOString().split('T')[0],
      orders,
      revenue: revenue._sum.total || 0
    })
  }
  
  return salesByDay
}

// Função para buscar top lojas
async function getTopStores(startDate: Date, endDate: Date) {
  const topStores = await prisma.store.findMany({
    include: {
      orders: {
        where: {
          status: 'DELIVERED',
          createdAt: {
            gte: startDate,
            lt: endDate
          }
        }
      },
      _count: {
        select: {
          products: {
            where: { isActive: true }
          }
        }
      }
    },
    take: 10
  })

  return topStores
    .map(store => ({
      id: store.id,
      name: store.name,
      revenue: store.orders.reduce((sum, order) => sum + order.total, 0),
      orders: store.orders.length,
      products: store._count.products
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
}

// Função para buscar top produtos
async function getTopProducts(startDate: Date, endDate: Date) {
  const topProducts = await prisma.product.findMany({
    include: {
      orderItems: {
        where: {
          order: {
            status: 'DELIVERED',
            createdAt: {
              gte: startDate,
              lt: endDate
            }
          }
        }
      },
      store: {
        select: {
          name: true
        }
      }
    },
    where: {
      isActive: true
    },
    take: 20
  })

  return topProducts
    .map(product => ({
      id: product.id,
      name: product.name,
      storeName: product.store.name,
      sales: product.orderItems.reduce((sum, item) => sum + item.quantity, 0),
      revenue: product.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
}

// Função para buscar crescimento de usuários
async function getUserGrowth(startDate: Date, endDate: Date) {
  const userGrowth = []
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  for (let i = 0; i < daysDiff; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    date.setHours(0, 0, 0, 0)
    
    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)
    
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: date,
          lt: nextDate
        }
      }
    })
    
    userGrowth.push({
      date: date.toISOString().split('T')[0],
      newUsers
    })
  }
  
  return userGrowth
}

// Função para buscar receita por categoria
async function getRevenueByCategory(startDate: Date, endDate: Date) {
  // Como não temos categorias definidas no schema, vamos usar dados mockados
  // Em uma implementação real, isso viria do banco de dados
  return [
    { name: 'Eletrônicos', revenue: 45000, percentage: 35 },
    { name: 'Roupas', revenue: 32000, percentage: 25 },
    { name: 'Casa & Jardim', revenue: 25600, percentage: 20 },
    { name: 'Esportes', revenue: 15360, percentage: 12 },
    { name: 'Outros', revenue: 10240, percentage: 8 }
  ]
}

// Export com middleware de autenticação
export const GET = requireAdmin(getAnalyticsHandler)