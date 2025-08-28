import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authMiddleware } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const createCommissionRateSchema = z.object({
  categoryId: z.string().min(1, 'ID da categoria é obrigatório'),
  commissionType: z.enum(['percentage', 'fixed'], {
    errorMap: () => ({ message: 'Tipo deve ser percentage ou fixed' })
  }),
  commissionValue: z.number().min(0, 'Valor da comissão deve ser positivo'),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  isActive: z.boolean().default(true)
});

const updateCommissionRateSchema = createCommissionRateSchema.partial();

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  categoryId: z.string().optional(),
  isActive: z.string().transform(val => val === 'true').optional()
});

// GET - Listar taxas de comissão (apenas admin)
const getCommissionRatesHandler = async (request: NextRequest) => {
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
      { error: 'Acesso negado. Apenas administradores podem acessar.' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    let supabaseQuery = supabase
      .from('commission_rates')
      .select('*')
      .order('createdAt', { ascending: false });

    // Aplicar filtros
    if (query.categoryId) {
      supabaseQuery = supabaseQuery.eq('categoryId', query.categoryId);
    }

    if (query.isActive !== undefined) {
      supabaseQuery = supabaseQuery.eq('isActive', query.isActive);
    }

    // Paginação
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;
    supabaseQuery = supabaseQuery.range(from, to);

    const { data: rates, error, count } = await supabaseQuery;

    if (error) {
      console.error('Erro ao buscar taxas de comissão:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar taxas de comissão' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / query.limit);

    return NextResponse.json({
      data: rates || [],
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

    console.error('Erro ao buscar taxas de comissão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
};

// POST - Criar taxa de comissão (apenas admin)
const createCommissionRateHandler = async (request: NextRequest) => {
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
      { error: 'Acesso negado. Apenas administradores podem criar taxas.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = createCommissionRateSchema.parse(body);

    // Verificar se já existe uma taxa para esta categoria
    const { data: existingRate } = await supabase
      .from('commission_rates')
      .select('id')
      .eq('categoryId', validatedData.categoryId)
      .single();

    if (existingRate) {
      return NextResponse.json(
        { error: 'Já existe uma taxa de comissão para esta categoria' },
        { status: 409 }
      );
    }

    // Validar minAmount e maxAmount
    if (validatedData.minAmount && validatedData.maxAmount && 
        validatedData.minAmount >= validatedData.maxAmount) {
      return NextResponse.json(
        { error: 'Valor mínimo deve ser menor que o valor máximo' },
        { status: 400 }
      );
    }

    const { data: newRate, error } = await supabase
      .from('commission_rates')
      .insert({
        ...validatedData,
        createdBy: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar taxa de comissão:', error);
      return NextResponse.json(
        { error: 'Erro ao criar taxa de comissão' },
        { status: 500 }
      );
    }

    return NextResponse.json(newRate, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao criar taxa de comissão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
};

export const GET = getCommissionRatesHandler;
export const POST = createCommissionRateHandler;