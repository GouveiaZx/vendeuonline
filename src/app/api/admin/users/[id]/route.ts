import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/users/[id] - Buscar usuário específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        type,
        city,
        state,
        avatar,
        isVerified,
        createdAt,
        updatedAt
      `)
      .eq('id', id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Buscar dados específicos do tipo de usuário
    let additionalData = {};

    if (user.type === 'SELLER') {
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('*')
        .eq('userId', user.id)
        .single();

      if (sellerData) {
        const { data: stores } = await supabase
          .from('stores')
          .select('*')
          .eq('sellerId', sellerData.id);

        additionalData = {
          seller: sellerData,
          stores: stores || []
        };
      }
    } else if (user.type === 'BUYER') {
      const { data: buyerData } = await supabase
        .from('buyers')
        .select('*')
        .eq('userId', user.id)
        .single();

      additionalData = {
        buyer: buyerData
      };
    } else if (user.type === 'ADMIN') {
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('userId', user.id)
        .single();

      additionalData = {
        admin: adminData
      };
    }

    return NextResponse.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.type.toLowerCase(),
        status: user.isVerified ? 'active' : 'pending',
        city: user.city,
        state: user.state,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        ...additionalData
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, city, state, isVerified } = body;

    // Verificar se o usuário existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar usuário
    const { data: user, error } = await supabase
      .from('users')
      .update({
        name,
        email,
        city,
        state,
        isVerified,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar usuário' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.type.toLowerCase(),
        status: user.isVerified ? 'active' : 'pending',
        city: user.city,
        state: user.state,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Erro na atualização de usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Deletar usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se o usuário existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, type')
      .eq('id', id)
      .single();

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Deletar registros relacionados primeiro
    if (existingUser.type === 'SELLER') {
      // Deletar lojas do vendedor
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('id')
        .eq('userId', id)
        .single();

      if (sellerData) {
        await supabase
          .from('stores')
          .delete()
          .eq('sellerId', sellerData.id);

        await supabase
          .from('sellers')
          .delete()
          .eq('userId', id);
      }
    } else if (existingUser.type === 'BUYER') {
      await supabase
        .from('buyers')
        .delete()
        .eq('userId', id);
    } else if (existingUser.type === 'ADMIN') {
      await supabase
        .from('admins')
        .delete()
        .eq('userId', id);
    }

    // Deletar o usuário principal
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar usuário' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Usuário deletado com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro na deleção de usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}