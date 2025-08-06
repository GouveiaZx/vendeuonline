import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/users - Listar todos os usuários
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const userType = searchParams.get('userType') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Query base para buscar usuários
    let query = supabase
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
      `);

    // Aplicar filtros
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (userType !== 'all') {
      query = query.eq('type', userType.toUpperCase());
    }

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }

    // Buscar estatísticas adicionais para cada usuário
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        let storeCount = 0;
        let orderCount = 0;

        // Se for vendedor, buscar número de lojas
        if (user.type === 'SELLER') {
          const { data: sellerData } = await supabase
            .from('sellers')
            .select('id')
            .eq('userId', user.id)
            .single();

          if (sellerData) {
            const { count: stores } = await supabase
              .from('stores')
              .select('*', { count: 'exact', head: true })
              .eq('sellerId', sellerData.id);
            storeCount = stores || 0;
          }
        }

        // Buscar número de pedidos (como comprador)
        if (user.type === 'BUYER') {
          const { data: buyerData } = await supabase
            .from('buyers')
            .select('id')
            .eq('userId', user.id)
            .single();

          if (buyerData) {
            // TODO: Implementar contagem de pedidos quando a tabela orders estiver criada
            // const { count: orders } = await supabase
            //   .from('orders')
            //   .select('*', { count: 'exact', head: true })
            //   .eq('buyerId', buyerData.id);
            // orderCount = orders || 0;
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.type.toLowerCase(),
          status: user.isVerified ? 'active' : 'pending',
          createdAt: user.createdAt,
          lastLogin: user.updatedAt, // Usando updatedAt como proxy para lastLogin
          storeCount,
          orderCount
        };
      })
    );

    return NextResponse.json({
      data: usersWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Erro na API de usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, type, city, state } = body;

    // Validar dados obrigatórios
    if (!name || !email || !password || !type || !city || !state) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      );
    }

    // Criar usuário
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password, // TODO: Hash da senha
        phone: '', // Campo obrigatório, mas pode ser vazio inicialmente
        type: type.toUpperCase(),
        city,
        state,
        isVerified: false
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      );
    }

    // Criar registro específico do tipo de usuário
    if (type.toUpperCase() === 'BUYER') {
      await supabase.from('buyers').insert({ id: user.id, userId: user.id });
    } else if (type.toUpperCase() === 'SELLER') {
      await supabase.from('sellers').insert({
        id: user.id,
        userId: user.id,
        storeName: `Loja de ${name}`,
        storeDescription: 'Descrição da loja',
        storeSlug: email.split('@')[0],
        address: '',
        zipCode: '',
        category: 'Geral'
      });
    } else if (type.toUpperCase() === 'ADMIN') {
      await supabase.from('admins').insert({
        id: user.id,
        userId: user.id,
        permissions: ['users', 'stores', 'products', 'orders']
      });
    }

    return NextResponse.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.type.toLowerCase(),
        status: user.isVerified ? 'active' : 'pending',
        createdAt: user.createdAt
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Erro na criação de usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}