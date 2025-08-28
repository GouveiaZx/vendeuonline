// ✅ MIGRADO AUTOMATICAMENTE: PRISMA → SUPABASE
// Data: 2025-08-22T19:55:03.111Z

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
import { AuthenticatedRequest, requireAdmin, requireSeller, requireBuyer } from '@/lib/auth-middleware'

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
  const [ordersResult, usersResult, storesResult, productsResult, revenueResult] = await Promise.all([
    // Pedidos no período
    supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString()),
    
    // Usuários criados no período
    supabase
      .from('users')
      .select('*', { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString()),
    
    // Lojas criadas no período
    supabase
      .from('stores')
      .select('*', { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString())
      .eq('is_active', true),
    
    // Produtos criados no período
    supabase
      .from('products')
      .select('*', { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString())
      .eq('is_active', true),
    
    // Receita total no período
    supabase
      .from('orders')
      .select('total')
      .eq('status', 'DELIVERED')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString())
  ])

  // Extrair dados dos resultados
  const orders = ordersResult.data || []
  const usersCount = usersResult.count || 0
  const storesCount = storesResult.count || 0
  const productsCount = productsResult.count || 0
  const revenueOrders = revenueResult.data || []

  // Calcular receita total
  const totalRevenue = revenueOrders.reduce((sum, order) => sum + (order.total || 0), 0)

  // Agrupar pedidos por status
  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    totalRevenue,
    totalOrders: orders.length,
    totalUsers: usersCount,
    totalStores: storesCount,
    totalProducts: productsCount,
    ordersByStatus
  }
}

// Função para buscar vendas por dia
async function getSalesByDay(startDate: Date, endDate: Date) {
  try {
    const { data: salesData, error } = await supabase
      .from('orders')
      .select(`
        created_at,
        total,
        status
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .in('status', ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'])

    if (error) {
      console.error('Erro ao buscar vendas por dia:', error)
      return []
    }

    // Agrupar vendas por dia
    const salesByDay = new Map()
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Inicializar todos os dias com zero
    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateKey = date.toISOString().split('T')[0]
      salesByDay.set(dateKey, { date: dateKey, orders: 0, revenue: 0 })
    }
    
    // Processar dados reais
    salesData?.forEach(order => {
      const dateKey = new Date(order.created_at).toISOString().split('T')[0]
      if (salesByDay.has(dateKey)) {
        const dayData = salesByDay.get(dateKey)
        dayData.orders += 1
        dayData.revenue += parseFloat(order.total || '0')
      }
    })
    
    return Array.from(salesByDay.values())
  } catch (error) {
    console.error('Erro na função getSalesByDay:', error)
    return []
  }
}

// Função para buscar top lojas
async function getTopStores(startDate: Date, endDate: Date) {
  try {
    const { data: storesData, error } = await supabase
      .from('orders')
      .select(`
        store_id,
        total,
        stores!inner(
          id,
          name,
          slug
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .in('status', ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'])

    if (error) {
      console.error('Erro ao buscar top lojas:', error)
      return []
    }

    // Agrupar por loja
    const storeMetrics = new Map()
    storesData?.forEach(order => {
      const storeId = order.store_id
      if (!storeMetrics.has(storeId)) {
        storeMetrics.set(storeId, {
          id: storeId,
          name: order.stores?.[0]?.name || 'Nome não disponível',
          slug: order.stores?.[0]?.slug || 'slug-indisponivel',
          orders: 0,
          revenue: 0
        })
      }
      const store = storeMetrics.get(storeId)
      store.orders += 1
      store.revenue += parseFloat(order.total || '0')
    })

    // Ordenar por receita e retornar top 10
    return Array.from(storeMetrics.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  } catch (error) {
    console.error('Erro na função getTopStores:', error)
    return []
  }
}

// Função para buscar top produtos
async function getTopProducts(startDate: Date, endDate: Date) {
  try {
    const { data: productsData, error } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        price,
        orders!inner(
          created_at,
          status
        ),
        products!inner(
          id,
          name,
          slug
        )
      `)
      .gte('orders.created_at', startDate.toISOString())
      .lte('orders.created_at', endDate.toISOString())
      .in('orders.status', ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'])

    if (error) {
      console.error('Erro ao buscar top produtos:', error)
      return []
    }

    // Agrupar por produto
    const productMetrics = new Map()
    productsData?.forEach(item => {
      const productId = item.product_id
      if (!productMetrics.has(productId)) {
        productMetrics.set(productId, {
          id: productId,
          name: item.products?.[0]?.name || 'Produto não disponível',
          slug: item.products?.[0]?.slug || 'produto-indisponivel',
          quantity: 0,
          revenue: 0
        })
      }
      const product = productMetrics.get(productId)
      product.quantity += parseInt(item.quantity || '0')
      product.revenue += parseFloat(item.price || '0') * parseInt(item.quantity || '0')
    })

    // Ordenar por quantidade vendida e retornar top 10
    return Array.from(productMetrics.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
  } catch (error) {
    console.error('Erro na função getTopProducts:', error)
    return []
  }
}

// Função para buscar crescimento de usuários
async function getUserGrowth(startDate: Date, endDate: Date) {
  try {
    const { data: usersData, error } = await supabase
      .from('users')
      .select('created_at, type')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at')

    if (error) {
      console.error('Erro ao buscar crescimento de usuários:', error)
      return []
    }

    // Agrupar por dia e tipo
    const growthByDay = new Map()
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Inicializar todos os dias com zero
    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateKey = date.toISOString().split('T')[0]
      growthByDay.set(dateKey, {
        date: dateKey,
        buyers: 0,
        sellers: 0,
        admins: 0,
        total: 0
      })
    }
    
    // Processar dados reais
    usersData?.forEach(user => {
      const dateKey = new Date(user.created_at).toISOString().split('T')[0]
      if (growthByDay.has(dateKey)) {
        const dayData = growthByDay.get(dateKey)
        dayData.total += 1
        switch (user.type) {
          case 'BUYER':
            dayData.buyers += 1
            break
          case 'SELLER':
            dayData.sellers += 1
            break
          case 'ADMIN':
            dayData.admins += 1
            break
        }
      }
    })
    
    return Array.from(growthByDay.values())
  } catch (error) {
    console.error('Erro na função getUserGrowth:', error)
    return []
  }
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
export async function GET(request: NextRequest) {
  return requireAdmin(getAnalyticsHandler)(request)
}