import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authMiddleware } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const createPayoutSchema = z.object({
  store_id: z.string().min(1, 'ID da loja é obrigatório'),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Período deve estar no formato YYYY-MM'),
  payment_method: z.string().optional(),
  notes: z.string().optional()
});

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  store_id: z.string().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  period: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

// GET - Listar repasses de comissão
const getPayoutsHandler = async (request: NextRequest) => {
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
      .from('commission_payouts')
      .select(`
        *,
        stores!inner(
          id,
          name,
          slug,
          sellers(
            id,
            name,
            email
          )
        )
      `)
      .order('created_at', { ascending: false });

    // Filtrar por vendedor se não for admin
    if (user && user.type === 'SELLER') {
      if (!user.seller) {
        return NextResponse.json(
          { error: 'Dados do vendedor não encontrados' },
          { status: 400 }
        );
      }
      
      // Buscar lojas do vendedor
      const { data: userStores, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('seller_id', user.seller.id);

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

      supabaseQuery = supabaseQuery.in('store_id', storeIds);
    }

    // Aplicar filtros
    if (query.store_id) {
      supabaseQuery = supabaseQuery.eq('store_id', query.store_id);
    }

    if (query.status) {
      supabaseQuery = supabaseQuery.eq('status', query.status);
    }

    if (query.period) {
      supabaseQuery = supabaseQuery.eq('period', query.period);
    }

    if (query.startDate || query.endDate) {
      if (query.startDate) {
        supabaseQuery = supabaseQuery.gte('created_at', query.startDate);
      }
      if (query.endDate) {
        supabaseQuery = supabaseQuery.lte('created_at', query.endDate);
      }
    }

    // Paginação
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;
    supabaseQuery = supabaseQuery.range(from, to);

    const { data: payouts, error, count } = await supabaseQuery;

    if (error) {
      console.error('Erro ao buscar repasses de comissão:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar repasses de comissão' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / query.limit);

    return NextResponse.json({
      data: payouts || [],
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

    console.error('Erro ao buscar repasses de comissão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
};

// POST - Criar repasse de comissão (apenas admin)
const createPayoutHandler = async (request: NextRequest) => {
  // Verificar autenticação e permissão de admin
  const authResult = await authMiddleware(request);
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  const user = authResult.user;
  if (!user || user.type !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Acesso negado. Apenas administradores podem criar repasses.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = createPayoutSchema.parse(body);

    // Verificar se a loja existe
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('id', validatedData.store_id)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se já existe um repasse para esta loja e período
    const { data: existingPayout } = await supabase
      .from('commission_payouts')
      .select('id')
      .eq('store_id', validatedData.store_id)
      .eq('period', validatedData.period)
      .single();

    if (existingPayout) {
      return NextResponse.json(
        { error: 'Já existe um repasse para esta loja e período' },
        { status: 409 }
      );
    }

    // Calcular totais das transações do período
    const startDate = `${validatedData.period}-01`;
    const endDate = `${validatedData.period}-31`;

    const { data: transactions, error: transactionError } = await supabase
      .from('commission_transactions')
      .select('commission_amount')
      .eq('store_id', validatedData.store_id)
      .eq('status', 'calculated')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (transactionError) {
      console.error('Erro ao buscar transações:', transactionError);
      return NextResponse.json(
        { error: 'Erro ao calcular totais do período' },
        { status: 500 }
      );
    }

    const totalCommission = transactions?.reduce((sum, t) => sum + Number(t.commission_amount), 0) || 0;
    const transactionCount = transactions?.length || 0;

    if (totalCommission === 0) {
      return NextResponse.json(
        { error: 'Não há comissões calculadas para este período' },
        { status: 400 }
      );
    }

    // Criar o repasse
    const { data: newPayout, error } = await supabase
      .from('commission_payouts')
      .insert({
        store_id: validatedData.store_id,
        period: validatedData.period,
        total_commission: totalCommission,
        total_payout: totalCommission, // Por enquanto, repasse = comissão total
        transaction_count: transactionCount,
        payment_method: validatedData.payment_method,
        notes: validatedData.notes,
        status: 'pending'
      })
      .select(`
        *,
        stores(
          id,
          name,
          slug,
          sellers(
            id,
            name,
            email
          )
        )
      `)
      .single();

    if (error) {
      console.error('Erro ao criar repasse:', error);
      return NextResponse.json(
        { error: 'Erro ao criar repasse' },
        { status: 500 }
      );
    }

    return NextResponse.json(newPayout, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao criar repasse:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
};

export const GET = getPayoutsHandler;
export const POST = createPayoutHandler;