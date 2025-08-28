import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authMiddleware } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const statsQuerySchema = z.object({
  storeId: z.string().optional(),
  period: z.string().optional(), // YYYY-MM format
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.enum(['month', 'category', 'store']).optional().default('month')
});

// GET - Buscar estatísticas de comissões
const getCommissionStatsHandler = async (request: NextRequest) => {
  // Verificar autenticação
  const authResult = await authMiddleware(request);
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  const user = authResult.user;
  
  // Apenas vendedores e admins podem acessar estatísticas
  if (!user || !['SELLER', 'ADMIN'].includes(user.type)) {
    return NextResponse.json(
      { error: 'Acesso negado. Apenas vendedores e administradores podem acessar estatísticas.' },
      { status: 403 }
    );
  }

  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { storeId, period, startDate, endDate, groupBy } = statsQuerySchema.parse(queryParams);

    // Se for vendedor, só pode ver estatísticas das próprias lojas
    let allowedStoreIds: string[] = [];
    if (user && user.type === 'SELLER') {
      const { data: sellerStores, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('sellerId', user.id);

      if (storeError) {
        console.error('Erro ao buscar lojas do vendedor:', storeError);
        return NextResponse.json(
          { error: 'Erro ao buscar lojas do vendedor' },
          { status: 500 }
        );
      }

      allowedStoreIds = sellerStores.map(store => store.id);
      
      // Se especificou uma loja, verificar se pertence ao vendedor
      if (storeId && !allowedStoreIds.includes(storeId)) {
        return NextResponse.json(
          { error: 'Acesso negado a esta loja' },
          { status: 403 }
        );
      }
    }

    // Construir query base
    let query = supabase
      .from('commission_transactions')
      .select(`
        *,
        stores(
          id,
          name,
          slug
        ),
        orders(
          id,
          totalAmount,
          products(
            id,
            name,
            categories(
              id,
              name
            )
          )
        )
      `);

    // Aplicar filtros
    if (storeId) {
      query = query.eq('storeId', storeId);
    } else if (user && user.type === 'SELLER' && allowedStoreIds.length > 0) {
      query = query.in('storeId', allowedStoreIds);
    }

    if (period) {
      const startOfMonth = `${period}-01`;
      const endOfMonth = `${period}-31`;
      query = query.gte('createdAt', startOfMonth).lte('createdAt', endOfMonth);
    } else {
      if (startDate) {
        query = query.gte('createdAt', startDate);
      }
      if (endDate) {
        query = query.lte('createdAt', endDate);
      }
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Erro ao buscar transações:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar transações' },
        { status: 500 }
      );
    }

    // Processar estatísticas baseado no groupBy
    let stats: any = {};

    if (groupBy === 'month') {
      stats = processMonthlyStats(transactions);
    } else if (groupBy === 'category') {
      stats = processCategoryStats(transactions);
    } else if (groupBy === 'store') {
      stats = processStoreStats(transactions);
    }

    // Calcular totais gerais
    const totalCommission = transactions.reduce((sum, t) => sum + (t.commissionAmount || 0), 0);
    const totalOrders = transactions.length;
    const totalOrderValue = transactions.reduce((sum, t) => sum + (t.orderAmount || 0), 0);
    const averageCommissionRate = totalOrderValue > 0 ? (totalCommission / totalOrderValue) * 100 : 0;

    const summary = {
      totalCommission,
      totalOrders,
      totalOrderValue,
      averageCommissionRate: Math.round(averageCommissionRate * 100) / 100,
      pendingCommission: transactions
        .filter(t => t.status === 'calculated')
        .reduce((sum, t) => sum + (t.commissionAmount || 0), 0),
      paidCommission: transactions
        .filter(t => t.status === 'paid')
        .reduce((sum, t) => sum + (t.commissionAmount || 0), 0)
    };

    return NextResponse.json({
      summary,
      data: stats,
      groupBy,
      period: period || `${startDate || ''} - ${endDate || ''}`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
};

// Funções auxiliares para processar estatísticas
function processMonthlyStats(transactions: any[]) {
  const monthlyData: Record<string, any> = {};

  transactions.forEach(transaction => {
    const month = transaction.createdAt.substring(0, 7); // YYYY-MM
    
    if (!monthlyData[month]) {
      monthlyData[month] = {
        month,
        totalCommission: 0,
        totalOrders: 0,
        totalOrderValue: 0,
        pendingCommission: 0,
        paidCommission: 0
      };
    }

    monthlyData[month].totalCommission += transaction.commissionAmount || 0;
    monthlyData[month].totalOrders += 1;
    monthlyData[month].totalOrderValue += transaction.orderAmount || 0;
    
    if (transaction.status === 'calculated') {
      monthlyData[month].pendingCommission += transaction.commissionAmount || 0;
    } else if (transaction.status === 'paid') {
      monthlyData[month].paidCommission += transaction.commissionAmount || 0;
    }
  });

  return Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));
}

function processCategoryStats(transactions: any[]) {
  const categoryData: Record<string, any> = {};

  transactions.forEach(transaction => {
    const categoryName = transaction.orders?.products?.categories?.name || 'Sem categoria';
    const categoryId = transaction.orders?.products?.categories?.id || 'unknown';
    
    if (!categoryData[categoryId]) {
      categoryData[categoryId] = {
        categoryId,
        categoryName,
        totalCommission: 0,
        totalOrders: 0,
        totalOrderValue: 0,
        averageCommissionRate: 0
      };
    }

    categoryData[categoryId].totalCommission += transaction.commissionAmount || 0;
    categoryData[categoryId].totalOrders += 1;
    categoryData[categoryId].totalOrderValue += transaction.orderAmount || 0;
  });

  // Calcular taxa média de comissão por categoria
  Object.values(categoryData).forEach((category: any) => {
    if (category.totalOrderValue > 0) {
      category.averageCommissionRate = Math.round(
        (category.totalCommission / category.totalOrderValue) * 100 * 100
      ) / 100;
    }
  });

  return Object.values(categoryData).sort((a: any, b: any) => b.totalCommission - a.totalCommission);
}

function processStoreStats(transactions: any[]) {
  const storeData: Record<string, any> = {};

  transactions.forEach(transaction => {
    const storeId = transaction.storeId;
    const storeName = transaction.stores?.name || 'Loja desconhecida';
    
    if (!storeData[storeId]) {
      storeData[storeId] = {
        storeId,
        storeName,
        totalCommission: 0,
        totalOrders: 0,
        totalOrderValue: 0,
        pendingCommission: 0,
        paidCommission: 0
      };
    }

    storeData[storeId].totalCommission += transaction.commissionAmount || 0;
    storeData[storeId].totalOrders += 1;
    storeData[storeId].totalOrderValue += transaction.orderAmount || 0;
    
    if (transaction.status === 'calculated') {
      storeData[storeId].pendingCommission += transaction.commissionAmount || 0;
    } else if (transaction.status === 'paid') {
      storeData[storeId].paidCommission += transaction.commissionAmount || 0;
    }
  });

  return Object.values(storeData).sort((a: any, b: any) => b.totalCommission - a.totalCommission);
}

export const GET = getCommissionStatsHandler;