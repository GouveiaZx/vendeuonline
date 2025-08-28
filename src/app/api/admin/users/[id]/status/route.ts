import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH /api/admin/users/[id]/status - Atualizar status do usuário
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Validar status
    if (!status || !['active', 'inactive', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use: active, inactive ou pending' },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, name, email, type')
      .eq('id', id)
      .single();

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Mapear status para isVerified
    const isVerified = status === 'active';

    // Atualizar status do usuário
    const { data: user, error } = await supabase
      .from('users')
      .update({
        isVerified,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, name, email, type, isVerified, updatedAt')
      .single();

    if (error) {
      console.error('Erro ao atualizar status do usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar status do usuário' },
        { status: 500 }
      );
    }

    // Se for vendedor, atualizar também o status da loja
    if (user.type === 'SELLER') {
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('id')
        .eq('userId', id)
        .single();

      if (sellerData) {
        await supabase
          .from('stores')
          .update({ isActive: isVerified })
          .eq('sellerId', sellerData.id);
      }
    }

    return NextResponse.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.type.toLowerCase(),
        status: user.isVerified ? 'active' : 'pending',
        updatedAt: user.updatedAt
      },
      message: `Status do usuário atualizado para ${status}`
    });
  } catch (error) {
    console.error('Erro na atualização de status:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}