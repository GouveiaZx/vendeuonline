import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromToken } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verificar autenticação
    const authResult = await getUserFromToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y

    // Verificar se a loja existe
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select(`
        id,
        name,
        is_active,
        created_at,
        sellers (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Verificar permissões
    const canAccess = 
      user.type === 'ADMIN' ||
      (user.type === 'SELLER' && (store.sellers as any)?.id === user.id);

    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calcular período
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Buscar estatísticas em paralelo
    const [
      productsResult,
      ordersResult,
      salesResult,
      visitorsResult,
      reviewsResult
    ] = await Promise.all([
      // Total de produtos
      supabase
        .from('products')
        .select('id, stock, created_at')
        .eq('seller_id', (store.sellers as any)?.id),

      // Pedidos no período
      supabase
        .from('orders')
        .select('id, status, total, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('status', ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']),

      // Vendas totais no período
      supabase
        .from('order_items')
        .select('quantity, price, orders!inner(created_at, status)')
        .gte('orders.created_at', startDate.toISOString())
        .lte('orders.created_at', endDate.toISOString())
        .in('orders.status', ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']),

      // Visitantes da loja (analytics)
      supabase
        .from('analytics_events')
        .select('user_id, ip_address, created_at')
        .eq('event', 'store_visit')
        .eq('properties->storeId', id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),

      // Avaliações
      supabase
        .from('reviews')
        .select('id, rating, created_at')
        .eq('store_id', id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
    ]);

    // Processar resultados
    const products = productsResult.data || [];
    const orders = ordersResult.data || [];
    const sales = salesResult.data || [];
    const visitors = visitorsResult.data || [];
    const reviews = reviewsResult.data || [];

    // Calcular métricas
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.stock > 0).length;
    const totalOrders = orders.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.quantity * sale.price), 0);

    // Visitantes únicos
    const uniqueVisitors = new Set([
      ...visitors.map(v => v.user_id).filter(Boolean),
      ...visitors.map(v => v.ip_address).filter(Boolean)
    ]).size;

    // Rating médio
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    // Vendas por dia (últimos 7 dias para gráfico)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailySales = last7Days.map(date => {
      const daySales = sales.filter(sale => 
        (sale.orders as any).created_at.startsWith(date)
      );
      const dayRevenue = daySales.reduce((sum, sale) => sum + (sale.quantity * sale.price), 0);
      
      return {
        date,
        revenue: dayRevenue,
        orders: daySales.length
      };
    });

    // Status dos pedidos
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Produtos com baixo estoque
    const lowStockProducts = products.filter(p => p.stock <= 5).length;

    // Crescimento comparado ao período anterior
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(startDate);
    const periodDuration = endDate.getTime() - startDate.getTime();
    previousStartDate.setTime(previousStartDate.getTime() - periodDuration);

    const { data: previousPeriodSales } = await supabase
      .from('order_items')
      .select('quantity, price, orders!inner(created_at, status)')
      .gte('orders.created_at', previousStartDate.toISOString())
      .lte('orders.created_at', previousEndDate.toISOString())
      .in('orders.status', ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']);

    const previousRevenue = previousPeriodSales?.reduce((sum, sale) => sum + (sale.quantity * sale.price), 0) || 0;
    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    return NextResponse.json({ 
      success: true, 
      data: {
        storeId: store.id,
        storeName: store.name,
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        overview: {
          totalProducts,
          activeProducts,
          lowStockProducts,
          totalOrders,
          totalRevenue,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          uniqueVisitors,
          averageRating,
          totalReviews: reviews.length,
          revenueGrowth
        },
        charts: {
          dailySales,
          ordersByStatus: Object.entries(ordersByStatus).map(([status, count]) => ({
            status,
            count
          }))
        }
      }
    });

  } catch (error) {
    console.error('Store stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}