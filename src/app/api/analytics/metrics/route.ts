import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromToken } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // MODO DESENVOLVIMENTO: Retornar dados mock se Supabase não está configurado
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || 
        supabaseUrl.includes('seu-projeto') || 
        supabaseUrl.includes('vendeuonline-demo') ||
        !serviceKey || 
        serviceKey === 'your-service-role-key-here' ||
        serviceKey.includes('demo')) {
      console.log('[DEV MODE] Returning mock analytics metrics');
      
      const { searchParams } = new URL(request.url);
      const period = searchParams.get('period') || '30d';
      const metricType = searchParams.get('type') || 'overview';
      
      const mockMetrics = {
        overview: {
          totalSales: { value: 15420.50, change: 12.5 },
          totalOrders: { value: 89, change: 8.2 },
          totalProducts: { value: 156, change: 3.1 },
          totalVisitors: { value: 2340, change: 15.7 }
        },
        sales: { totalRevenue: 15420.50, avgOrderValue: 173.26 },
        visitors: { totalVisitors: 2340, uniqueVisitors: 1856 },
        products: { totalProducts: 156, activeProducts: 142 },
        orders: { totalOrders: 89, pendingOrders: 12 }
      } as Record<string, any>;
      
      return NextResponse.json({
        success: true,
        data: mockMetrics[metricType] || mockMetrics.overview,
        period,
        generatedAt: new Date().toISOString()
      });
    }

    // Verificar autenticação
    const authResult = await getUserFromToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y
    const storeId = searchParams.get('storeId');
    const metricType = searchParams.get('type'); // sales, visitors, products, orders

    // Verificar permissões
    if (user.type !== 'ADMIN' && user.type !== 'SELLER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Para vendedores, limitar aos dados da própria loja
    let effectiveStoreId = storeId;
    if (user.type === 'SELLER') {
      const { data: seller } = await supabase
        .from('sellers')
        .select('store_id')
        .eq('id', user.id)
        .single();
      
      if (seller) {
        effectiveStoreId = seller.store_id;
      }
    }

    // Calcular período
    const { startDate, endDate } = calculatePeriod(period);

    // Buscar métricas baseado no tipo solicitado
    let metrics = {};

    if (!metricType || metricType === 'overview') {
      metrics = await getOverviewMetrics(startDate, endDate, effectiveStoreId);
    } else if (metricType === 'sales') {
      metrics = await getSalesMetrics(startDate, endDate, effectiveStoreId);
    } else if (metricType === 'visitors') {
      metrics = await getVisitorMetrics(startDate, endDate, effectiveStoreId);
    } else if (metricType === 'products') {
      metrics = await getProductMetrics(startDate, endDate, effectiveStoreId);
    } else if (metricType === 'orders') {
      metrics = await getOrderMetrics(startDate, endDate, effectiveStoreId);
    } else {
      return NextResponse.json({ 
        error: 'Invalid metric type' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        period,
        startDate,
        endDate,
        storeId: effectiveStoreId,
        metrics
      }
    });

  } catch (error) {
    console.error('Analytics metrics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Calcular período baseado no parâmetro
function calculatePeriod(period: string): { startDate: string; endDate: string } {
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

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
}

// Métricas gerais
async function getOverviewMetrics(startDate: string, endDate: string, storeId: string | null) {
  try {
    // Total de vendas
    let salesQuery = supabase
      .from('orders')
      .select('total')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .in('status', ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']);

    // Total de pedidos
    let ordersQuery = supabase
      .from('orders')
      .select('id')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Filtrar por loja se especificado
    if (storeId) {
      // Para filtrar por loja, precisamos fazer join com produtos
      salesQuery = salesQuery.in('order_items.product_id', [
        // Subquery para produtos da loja específica
      ]);
      ordersQuery = ordersQuery.in('order_items.product_id', [
        // Subquery para produtos da loja específica
      ]);
    }

    const [salesResult, ordersResult] = await Promise.all([
      salesQuery,
      ordersQuery
    ]);

    const totalSales = salesResult.data?.reduce((sum, order) => sum + order.total, 0) || 0;
    const totalOrders = ordersResult.data?.length || 0;

    // Visitantes únicos (baseado em analytics events)
    const { data: visitorsData } = await supabase
      .from('analytics_events')
      .select('user_id, ip_address')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('event', 'page_view');

    const uniqueVisitors = new Set([
      ...visitorsData?.map(v => v.user_id).filter(Boolean) || [],
      ...visitorsData?.map(v => v.ip_address).filter(Boolean) || []
    ]).size;

    // Produtos mais vendidos
    const { data: topProductsData } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        products (name)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .limit(5);

    const topProducts = topProductsData?.map((item: any) => ({
      productId: item.product_id,
      name: item.products?.name,
      quantity: item.quantity
    })) || [];

    return {
      totalSales,
      totalOrders,
      uniqueVisitors,
      averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
      topProducts
    };

  } catch (error) {
    console.error('Error getting overview metrics:', error);
    return {};
  }
}

// Métricas de vendas
async function getSalesMetrics(startDate: string, endDate: string, storeId: string | null) {
  try {
    // Vendas por dia
    const { data: dailySales } = await supabase
      .from('orders')
      .select('total, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .in('status', ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'])
      .order('created_at');

    // Agrupar por dia
    const salesByDay = dailySales?.reduce((acc, order) => {
      const day = new Date(order.created_at).toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + order.total;
      return acc;
    }, {} as Record<string, number>) || {};

    // Métodos de pagamento
    const { data: paymentMethods } = await supabase
      .from('payments')
      .select('payment_method')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('status', 'CONFIRMED');

    const paymentMethodStats = paymentMethods?.reduce((acc, payment) => {
      acc[payment.payment_method] = (acc[payment.payment_method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      dailySales: Object.entries(salesByDay).map(([date, amount]) => ({
        date,
        amount
      })),
      paymentMethods: Object.entries(paymentMethodStats).map(([method, count]) => ({
        method,
        count
      })),
      totalRevenue: Object.values(salesByDay).reduce((sum, amount) => sum + amount, 0)
    };

  } catch (error) {
    console.error('Error getting sales metrics:', error);
    return {};
  }
}

// Métricas de visitantes
async function getVisitorMetrics(startDate: string, endDate: string, storeId: string | null) {
  try {
    // Visitantes por dia
    const { data: dailyVisitors } = await supabase
      .from('analytics_events')
      .select('user_id, ip_address, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('event', 'page_view');

    // Agrupar por dia
    const visitorsByDay = dailyVisitors?.reduce((acc, event) => {
      const day = new Date(event.created_at).toISOString().split('T')[0];
      if (!acc[day]) acc[day] = new Set();
      acc[day].add(event.user_id || event.ip_address);
      return acc;
    }, {} as Record<string, Set<string>>) || {};

    // Páginas mais visitadas
    const { data: pageViews } = await supabase
      .from('analytics_events')
      .select('properties')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('event', 'page_view');

    const pageStats = pageViews?.reduce((acc, event) => {
      const page = event.properties?.page || 'unknown';
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      dailyVisitors: Object.entries(visitorsByDay).map(([date, visitors]) => ({
        date,
        count: visitors.size
      })),
      topPages: Object.entries(pageStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([page, views]) => ({ page, views })),
      totalUniqueVisitors: new Set(
        dailyVisitors?.map(v => v.user_id || v.ip_address) || []
      ).size
    };

  } catch (error) {
    console.error('Error getting visitor metrics:', error);
    return {};
  }
}

// Métricas de produtos
async function getProductMetrics(startDate: string, endDate: string, storeId: string | null) {
  try {
    // Produtos mais vendidos
    const { data: bestSellers } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        products (name, price)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const productStats = bestSellers?.reduce((acc: any, item: any) => {
      const productId = item.product_id;
      if (!acc[productId]) {
        acc[productId] = {
          productId,
          name: item.products?.name,
          price: item.products?.price,
          totalSold: 0,
          revenue: 0
        };
      }
      acc[productId].totalSold += item.quantity;
      acc[productId].revenue += item.quantity * (item.products?.price || 0);
      return acc;
    }, {} as Record<string, any>) || {};

    const topSellingProducts = Object.values(productStats)
      .sort((a: any, b: any) => b.totalSold - a.totalSold)
      .slice(0, 10);

    // Produtos mais visualizados
    const { data: productViews } = await supabase
      .from('analytics_events')
      .select('properties')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('event', 'product_view');

    const viewStats = productViews?.reduce((acc, event) => {
      const productId = event.properties?.productId;
      if (productId) {
        acc[productId] = (acc[productId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      bestSellers: topSellingProducts,
      mostViewed: Object.entries(viewStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([productId, views]) => ({ productId, views })),
      totalProductsSold: Object.values(productStats)
        .reduce((sum: number, product: any) => sum + product.totalSold, 0)
    };

  } catch (error) {
    console.error('Error getting product metrics:', error);
    return {};
  }
}

// Métricas de pedidos
async function getOrderMetrics(startDate: string, endDate: string, storeId: string | null) {
  try {
    // Status dos pedidos
    const { data: orderStatuses } = await supabase
      .from('orders')
      .select('status')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const statusStats = orderStatuses?.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Pedidos por dia
    const { data: dailyOrders } = await supabase
      .from('orders')
      .select('created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at');

    const ordersByDay = dailyOrders?.reduce((acc, order) => {
      const day = new Date(order.created_at).toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      statusDistribution: Object.entries(statusStats).map(([status, count]) => ({
        status,
        count
      })),
      dailyOrders: Object.entries(ordersByDay).map(([date, count]) => ({
        date,
        count
      })),
      totalOrders: orderStatuses?.length || 0
    };

  } catch (error) {
    console.error('Error getting order metrics:', error);
    return {};
  }
}