import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH /api/admin/banners/[id]/toggle - Alternar status do banner
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Buscar banner atual
    const { data: existingBanner, error: fetchError } = await supabase
      .from('banners')
      .select('id, title, isActive')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Banner não encontrado' },
          { status: 404 }
        );
      }
      console.error('Erro ao buscar banner:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao buscar banner' },
        { status: 500 }
      );
    }

    // Alternar status
    const newStatus = !existingBanner.isActive;

    const { data: banner, error } = await supabase
      .from('banners')
      .update({
        isActive: newStatus,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar status do banner:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar status do banner' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: banner,
      message: `Banner "${existingBanner.title}" ${newStatus ? 'ativado' : 'desativado'} com sucesso`
    });
  } catch (error) {
    console.error('Erro na alteração de status:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}