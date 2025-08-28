import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authMiddleware } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const updateCommissionRateSchema = z.object({
  categoryId: z.string().min(1).optional(),
  commissionType: z.enum(['percentage', 'fixed']).optional(),
  commissionValue: z.number().min(0).optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  isActive: z.boolean().optional()
});

// GET - Buscar taxa de comissão por ID (apenas admin)
const getCommissionRateHandler = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
    const { id } = await params;
    const { data: rate, error } = await supabase
      .from('commission_rates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !rate) {
      return NextResponse.json(
        { error: 'Taxa de comissão não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(rate);
  } catch (error) {
    console.error('Erro ao buscar taxa de comissão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
};

// PUT - Atualizar taxa de comissão (apenas admin)
const updateCommissionRateHandler = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
      { error: 'Acesso negado. Apenas administradores podem atualizar taxas.' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateCommissionRateSchema.parse(body);

    // Verificar se a taxa existe
    const { data: existingRate, error: fetchError } = await supabase
      .from('commission_rates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingRate) {
      return NextResponse.json(
        { error: 'Taxa de comissão não encontrada' },
        { status: 404 }
      );
    }

    // Se está alterando a categoria, verificar se não existe outra taxa para a nova categoria
    if (validatedData.categoryId && validatedData.categoryId !== existingRate.categoryId) {
      const { data: conflictingRate } = await supabase
        .from('commission_rates')
        .select('id')
        .eq('categoryId', validatedData.categoryId)
        .neq('id', id)
        .single();

      if (conflictingRate) {
        return NextResponse.json(
          { error: 'Já existe uma taxa de comissão para esta categoria' },
          { status: 409 }
        );
      }
    }

    // Validar minAmount e maxAmount
    const minAmount = validatedData.minAmount ?? existingRate.minAmount;
    const maxAmount = validatedData.maxAmount ?? existingRate.maxAmount;
    
    if (minAmount && maxAmount && minAmount >= maxAmount) {
      return NextResponse.json(
        { error: 'Valor mínimo deve ser menor que o valor máximo' },
        { status: 400 }
      );
    }

    const { data: updatedRate, error } = await supabase
      .from('commission_rates')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar taxa de comissão:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar taxa de comissão' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedRate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar taxa de comissão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
};

// DELETE - Excluir taxa de comissão (apenas admin)
const deleteCommissionRateHandler = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
      { error: 'Acesso negado. Apenas administradores podem excluir taxas.' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    // Verificar se existem transações associadas a esta taxa
    const { data: transactions, error: transactionError } = await supabase
      .from('commission_transactions')
      .select('id')
      .eq('categoryId', id)
      .limit(1);

    if (transactionError) {
      console.error('Erro ao verificar transações:', transactionError);
      return NextResponse.json(
        { error: 'Erro ao verificar dependências' },
        { status: 500 }
      );
    }

    if (transactions && transactions.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir taxa com transações associadas. Desative-a em vez de excluir.' },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from('commission_rates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir taxa de comissão:', error);
      return NextResponse.json(
        { error: 'Erro ao excluir taxa de comissão' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Taxa de comissão excluída com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao excluir taxa de comissão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
};

export const GET = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  return getCommissionRateHandler(request, { params });
};

export const PUT = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  return updateCommissionRateHandler(request, { params });
};

export const DELETE = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  return deleteCommissionRateHandler(request, { params });
};