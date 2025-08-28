import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação não encontrado' },
        { status: 401 }
      );
    }

    // Verificar se o token é válido e obter dados do usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Buscar a loja do vendedor
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select(`
        id,
        name,
        description,
        category,
        logo,
        address,
        city,
        state,
        phone,
        email,
        approval_status,
        documents,
        rejection_reason,
        verification_notes,
        "createdAt",
        last_status_change
      `)
      .eq('sellerId', user.id)
      .single();

    if (storeError) {
      if (storeError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Loja não encontrada' },
          { status: 404 }
        );
      }
      console.error('Erro ao buscar loja:', storeError);
      return NextResponse.json(
        { error: 'Erro ao buscar loja' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      store
    });

  } catch (error) {
    console.error('Erro na API my-store:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação não encontrado' },
        { status: 401 }
      );
    }

    // Verificar se o token é válido e obter dados do usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const { documents, ...updateData } = await request.json();

    // Atualizar dados da loja
    const updateFields: any = {
      ...updateData,
      last_status_change: new Date().toISOString()
    };

    if (documents) {
      updateFields.documents = documents;
    }

    const { data: store, error: updateError } = await supabase
      .from('stores')
      .update(updateFields)
      .eq('sellerId', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar loja:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar loja' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Loja atualizada com sucesso',
      store
    });

  } catch (error) {
    console.error('Erro na atualização da loja:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}