import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/banners/[id]/click - Registrar clique no banner
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se o banner existe e está ativo
    const { data: banner, error: fetchError } = await supabase
      .from('banners')
      .select('id, isActive, clicks')
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

    // Só registrar clique se o banner estiver ativo
    if (!banner.isActive) {
      return NextResponse.json(
        { error: 'Banner não está ativo' },
        { status: 400 }
      );
    }

    // Incrementar contador de cliques
    const { error: updateError } = await supabase
      .from('banners')
      .update({ 
        clicks: banner.clicks + 1,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Erro ao atualizar cliques:', updateError);
      return NextResponse.json(
        { error: 'Erro ao registrar clique' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      clicks: banner.clicks + 1
    });
  } catch (error) {
    console.error('Erro no registro de clique:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}