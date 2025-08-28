import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authMiddleware } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const updatePayoutStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed'], {
    errorMap: () => ({ message: 'Status deve ser pending, processing, completed ou failed' })
  }),
  notes: z.string().optional(),
  payment_reference: z.string().optional()
});

// PATCH - Atualizar status do repasse (apenas admin)
const updatePayoutStatusHandler = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
      { error: 'Acesso negado. Apenas administradores podem atualizar status de repasses.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { status, notes, payment_reference } = updatePayoutStatusSchema.parse(body);
    const { id } = await params;

    // Verificar se o repasse existe
    const { data: existingPayout, error: fetchError } = await supabase
      .from('commission_payouts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingPayout) {
      return NextResponse.json(
        { error: 'Repasse não encontrado' },
        { status: 404 }
      );
    }

    // Validar transições de status
    const validTransitions: Record<string, string[]> = {
      'pending': ['processing', 'failed'],
      'processing': ['completed', 'failed'],
      'completed': [], // Status final
      'failed': ['pending'] // Pode tentar novamente
    };

    const currentStatus = existingPayout.status;
    if (!validTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json(
        { error: `Não é possível alterar status de ${currentStatus} para ${status}` },
        { status: 400 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = { 
      status,
      processed_by: user.id
    };
    
    // Se está marcando como processado ou completado, adicionar timestamp
    if (['processing', 'completed'].includes(status)) {
      updateData.processed_at = new Date().toISOString();
    }

    // Adicionar notas se fornecidas
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Adicionar referência de pagamento se fornecida
    if (payment_reference !== undefined) {
      updateData.payment_reference = payment_reference;
    }

    const { data: updatedPayout, error } = await supabase
      .from('commission_payouts')
      .update(updateData)
      .eq('id', id)
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
      console.error('Erro ao atualizar status do repasse:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar status do repasse' },
        { status: 500 }
      );
    }

    // Se o repasse foi completado, atualizar status das transações relacionadas
    if (status === 'completed') {
      const startDate = `${existingPayout.period}-01`;
      const endDate = `${existingPayout.period}-31`;

      const { error: transactionUpdateError } = await supabase
        .from('commission_transactions')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('store_id', existingPayout.store_id)
        .eq('status', 'calculated')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (transactionUpdateError) {
        console.error('Erro ao atualizar transações:', transactionUpdateError);
        // Não falhar a operação, apenas logar o erro
      }
    }

    return NextResponse.json(updatedPayout);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar status do repasse:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
};

export const PATCH = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  return updatePayoutStatusHandler(request, { params })
}