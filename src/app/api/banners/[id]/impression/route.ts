import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/banners/[id]/impression - Registrar impressão do banner
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verificar se o banner existe e está ativo
    const { data: banner, error: fetchError } = await supabase
      .from('banners')
      .select('id, isActive, impressions')
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

    // Só registrar impressão se o banner estiver ativo
    if (!banner.isActive) {
      return NextResponse.json(
        { error: 'Banner não está ativo' },
        { status: 400 }
      );
    }

    // Incrementar contador de impressões
    const { error: updateError } = await supabase
      .from('banners')
      .update({ 
        impressions: banner.impressions + 1,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Erro ao atualizar impressões:', updateError);
      return NextResponse.json(
        { error: 'Erro ao registrar impressão' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      impressions: banner.impressions + 1
    });
  } catch (error) {
    console.error('Erro no registro de impressão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}