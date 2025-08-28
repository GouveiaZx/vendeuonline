import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromToken } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // MODO DESENVOLVIMENTO: Retornar dados mock se Supabase não está configurado
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || 
        supabaseUrl.includes('seu-projeto') || 
        supabaseUrl.includes('vendeuonline-demo') ||
        !serviceKey || 
        serviceKey === 'your-service-role-key-here' ||
        serviceKey.includes('demo')) {
      console.log('[DEV MODE] Returning mock stores data');
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      
      const mockStores = [
        {
          id: '1',
          name: 'Loja Demo 1',
          description: 'Uma loja de demonstração',
          logo: null,
          banner: null,
          slug: 'loja-demo-1',
          isActive: true,
          createdAt: '2024-01-15T10:00:00.000Z',
          sellerId: 'seller1'
        },
        {
          id: '2',
          name: 'Loja Demo 2',
          description: 'Outra loja de demonstração',
          logo: null,
          banner: null,
          slug: 'loja-demo-2',
          isActive: true,
          createdAt: '2024-02-20T14:30:00.000Z',
          sellerId: 'seller2'
        }
      ];
      
      return NextResponse.json({
        success: true,
        stores: mockStores,
        pagination: {
          page,
          limit,
          total: mockStores.length,
          totalPages: 1
        }
      });
    }

    // Autenticação opcional para listar lojas públicas
    const authResult = await getUserFromToken(request);
    const user = authResult.success ? authResult.user : null;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('Store')
      .select(`
        id,
        name,
        description,
        logo,
        banner,
        slug,
        isActive,
        createdAt,
        sellerId
      `)
      .order('name');

    // Filtros
    if (active === 'true') {
      query = query.eq('isActive', true);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Para usuários não autenticados, mostrar apenas lojas ativas
    if (!user) {
      query = query.eq('isActive', true);
    }

    // Para vendedores, mostrar apenas sua própria loja
    if (user && user.type === 'SELLER') {
      query = query.eq('sellerId', user.id);
    }

    const [storesResult, countResult] = await Promise.all([
      query.range(offset, offset + limit - 1),
      supabase.from('Store').select('id', { count: 'exact', head: true })
    ]);

    if (storesResult.error) {
      console.error('Error fetching stores:', storesResult.error);
      return NextResponse.json({ 
        error: 'Failed to fetch stores' 
      }, { status: 500 });
    }

    const stores = storesResult.data || [];
    const totalCount = countResult.count || 0;

    // Adicionar estatísticas básicas para cada loja (apenas para admins)
    if (user && user.type === 'ADMIN') {
      const storesWithStats = await Promise.all(
        stores.map(async (store) => {
          const { data: stats } = await supabase
            .from('Product')
            .select('id', { count: 'exact', head: true })
            .eq('sellerId', store.sellerId);

          return {
            ...store,
            productCount: stats?.length || 0
          };
        })
      );

      return NextResponse.json({ 
        success: true,
        stores: storesWithStats,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      stores,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Stores GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (vendedores e admins podem criar lojas)
    const authResult = await getUserFromToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;

    // Apenas vendedores e admins podem criar lojas
    if (user.type !== 'SELLER' && user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      logo,
      banner,
      phone,
      email,
      address,
      website,
      social_media = {}
    } = body;

    // Validar dados obrigatórios
    if (!name) {
      return NextResponse.json({ 
        error: 'Store name is required' 
      }, { status: 400 });
    }

    // Verificar se vendedor já tem uma loja
    if (user.type === 'SELLER') {
      const { data: existingStore } = await supabase
        .from('Store')
        .select('id')
        .eq('sellerId', user.id)
        .single();

      if (existingStore) {
        return NextResponse.json({ 
          error: 'Seller already has a store' 
        }, { status: 409 });
      }
    }

    // Verificar se nome da loja já existe
    const { data: nameCheck } = await supabase
      .from('Store')
      .select('id')
      .ilike('name', name)
      .single();

    if (nameCheck) {
      return NextResponse.json({ 
        error: 'Store name already exists' 
      }, { status: 409 });
    }

    // Para admins, precisam especificar qual vendedor
    let sellerId = user.type === 'SELLER' ? user.id : null;
    if (user.type === 'ADMIN' && body.sellerId) {
      sellerId = body.sellerId;
    }

    if (!sellerId) {
      return NextResponse.json({ 
        error: 'Seller ID is required' 
      }, { status: 400 });
    }

    // Gerar slug único
    const baseSlug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50);

    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const { data: slugExists } = await supabase
        .from('Store')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!slugExists) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Criar loja
    const storeData = {
      sellerId: sellerId,
      name: name.trim(),
      description: description || '',
      slug: slug,
      logo: logo || null,
      banner: banner || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data: store, error: storeError } = await supabase
      .from('Store')
      .insert(storeData)
      .select()
      .single();

    if (storeError) {
      console.error('Error creating store:', storeError);
      return NextResponse.json({ 
        error: 'Failed to create store' 
      }, { status: 500 });
    }

    // Nota: A loja já está vinculada ao vendedor através do campo sellerId

    return NextResponse.json({ 
      success: true, 
      data: store,
      message: 'Store created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Stores POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}