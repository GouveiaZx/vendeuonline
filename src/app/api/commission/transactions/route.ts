import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authMiddleware } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  storeId: z.string().optional(),
  status: z.enum(['pending', 'calculated', 'paid', 'cancelled']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categoryId: z.string().optional()
});

// GET - Listar transações de comissão
const getTransactionsHandler = async (request: NextRequest) => {
  // Verificar autenticação
  const authResult = await authMiddleware(request);
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  const user = authResult.user;
  if (!user || !['SELLER', 'ADMIN'].includes(user.type)) {
    return NextResponse.json(
      { error: 'Acesso negado. Apenas vendedores e administradores podem acessar.' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    let supabaseQuery = supabase
      .from('commission_transactions')
      .select(`
        *,
        "Order"!inner(
          id,
          total,
          status,
          createdAt,
          buyers(
            id,
            name,
            email
          )
        ),
        stores!inner(
          id,
          name,
          slug
        )
      `)
      .order('createdAt', { ascending: false });

    // Filtrar por vendedor se não for admin
    if (user && user.type === 'SELLER') {
      if (!user.seller) {
        return NextResponse.json(
          { error: 'Vendedor não encontrado.' },
          { status: 400 }
        );
      }
      
      // Buscar lojas do vendedor
      const { data: userStores, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('sellerId', user.seller.id);

      if (storeError) {
        console.error('Erro ao buscar lojas do vendedor:', storeError);
        return NextResponse.json(
          { error: 'Erro ao buscar dados do vendedor' },
          { status: 500 }
        );
      }

      const storeIds = userStores?.map(store => store.id) || [];
      if (storeIds.length === 0) {
        return NextResponse.json({
          data: [],
          pagination: {
            page: query.page,
            limit: query.limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        });
      }

      supabaseQuery = supabaseQuery.in('storeId', storeIds);
    }

    // Aplicar filtros
    if (query.storeId) {
      supabaseQuery = supabaseQuery.eq('storeId', query.storeId);
    }

    if (query.status) {
      supabaseQuery = supabaseQuery.eq('status', query.status);
    }

    if (query.categoryId) {
      supabaseQuery = supabaseQuery.eq('categoryId', query.categoryId);
    }

    if (query.startDate || query.endDate) {
      if (query.startDate) {
        supabaseQuery = supabaseQuery.gte('createdAt', query.startDate);
      }
      if (query.endDate) {
        supabaseQuery = supabaseQuery.lte('createdAt', query.endDate);
      }
    }

    // Paginação
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;
    supabaseQuery = supabaseQuery.range(from, to);

    const { data: transactions, error, count } = await supabaseQuery;

    if (error) {
      console.error('Erro ao buscar transações de comissão:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar transações de comissão' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / query.limit);

    return NextResponse.json({
      data: transactions || [],
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count || 0,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao buscar transações de comissão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
};

export const GET = getTransactionsHandler;