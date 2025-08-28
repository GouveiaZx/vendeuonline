import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authMiddleware } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'calculated', 'paid', 'cancelled'], {
    errorMap: () => ({ message: 'Status deve ser pending, calculated, paid ou cancelled' })
  })
});

// PATCH - Atualizar status da transação (apenas admin)
const updateTransactionStatusHandler = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
      { error: 'Acesso negado. Apenas administradores podem atualizar status de transações.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { status } = updateStatusSchema.parse(body);
    const { id } = await params;

    // Verificar se a transação existe
    const { data: existingTransaction, error: fetchError } = await supabase
      .from('commission_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingTransaction) {
      return NextResponse.json(
        { error: 'Transação de comissão não encontrada' },
        { status: 404 }
      );
    }

    // Validar transições de status
    const validTransitions: Record<string, string[]> = {
      'pending': ['calculated', 'cancelled'],
      'calculated': ['paid', 'cancelled'],
      'paid': [], // Status final
      'cancelled': [] // Status final
    };

    const currentStatus = existingTransaction.status;
    if (!validTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json(
        { error: `Não é possível alterar status de ${currentStatus} para ${status}` },
        { status: 400 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = { status };
    
    // Se está marcando como pago, adicionar timestamp
    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    const { data: updatedTransaction, error } = await supabase
      .from('commission_transactions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        orders(
          id,
          total,
          status,
          created_at,
          buyers(
            id,
            name,
            email
          )
        ),
        stores(
          id,
          name,
          slug
        )
      `)
      .single();

    if (error) {
      console.error('Erro ao atualizar status da transação:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar status da transação' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar status da transação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
};

export const PATCH = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  return updateTransactionStatusHandler(request, { params });
};