import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/banners/[id] - Buscar banner específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: banner, error } = await supabase
      .from('banners')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Banner não encontrado' },
          { status: 404 }
        );
      }
      console.error('Erro ao buscar banner:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar banner' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: banner });
  } catch (error) {
    console.error('Erro na busca de banner:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/banners/[id] - Atualizar banner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      imageUrl,
      targetUrl,
      position,
      startDate,
      endDate,
      isActive
    } = body;

    // Verificar se o banner existe
    const { data: existingBanner } = await supabase
      .from('banners')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingBanner) {
      return NextResponse.json(
        { error: 'Banner não encontrado' },
        { status: 404 }
      );
    }

    // Validações
    if (position && !['HEADER', 'SIDEBAR', 'FOOTER', 'CATEGORY'].includes(position)) {
      return NextResponse.json(
        { error: 'Posição inválida. Use: HEADER, SIDEBAR, FOOTER ou CATEGORY' },
        { status: 400 }
      );
    }

    // Validar datas se fornecidas
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end <= start) {
        return NextResponse.json(
          { error: 'Data de fim deve ser posterior à data de início' },
          { status: 400 }
        );
      }
    }

    // Preparar dados para atualização
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (targetUrl !== undefined) updateData.targetUrl = targetUrl;
    if (position !== undefined) updateData.position = position;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (startDate !== undefined) updateData.startDate = new Date(startDate).toISOString();
    if (endDate !== undefined) updateData.endDate = new Date(endDate).toISOString();

    // Atualizar banner
    const { data: banner, error } = await supabase
      .from('banners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar banner:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar banner' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: banner,
      message: 'Banner atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro na atualização de banner:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/banners/[id] - Excluir banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se o banner existe
    const { data: existingBanner } = await supabase
      .from('banners')
      .select('id, title')
      .eq('id', id)
      .single();

    if (!existingBanner) {
      return NextResponse.json(
        { error: 'Banner não encontrado' },
        { status: 404 }
      );
    }

    // Excluir banner
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir banner:', error);
      return NextResponse.json(
        { error: 'Erro ao excluir banner' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Banner "${existingBanner.title}" excluído com sucesso`
    });
  } catch (error) {
    console.error('Erro na exclusão de banner:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}