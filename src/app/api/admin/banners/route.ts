import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin, getUserFromToken } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/banners - Listar banners (Auth opcional para leitura pública)
export async function GET(request: NextRequest) {
  try {
    // Auth opcional para listagem pública de banners
    const authResult = await getUserFromToken(request);
    const user = authResult.success ? authResult.user : null;
    
    if (user) {
      console.log(`👤 User ${user.email} (${user.type}) acessou lista de banners`);
    }
    
    // MODO DESENVOLVIMENTO: Retornar dados mock se Supabase não está configurado
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || 
        supabaseUrl.includes('seu-projeto') || 
        supabaseUrl.includes('vendeuonline-demo') ||
        !serviceKey || 
        serviceKey === 'your-service-role-key-here' ||
        serviceKey.includes('demo')) {
      console.log('[DEV MODE] Returning mock banners data');
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      
      const mockBanners = [
        {
          id: '1',
          title: 'Banner Promocional Demo',
          description: 'Banner de demonstração para testes',
          imageUrl: '/images/demo-banner.jpg',
          targetUrl: '/',
          position: 'HEADER',
          isActive: true,
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-12-31T23:59:59.000Z',
          clicks: 0,
          impressions: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z'
        },
        {
          id: '2',
          title: 'Banner Lateral Demo',
          description: 'Outro banner de demonstração',
          imageUrl: '/images/demo-banner-2.jpg',
          targetUrl: '/products',
          position: 'SIDEBAR',
          isActive: true,
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-12-31T23:59:59.000Z',
          clicks: 0,
          impressions: 0,
          createdAt: '2024-02-20T14:30:00.000Z',
          updatedAt: '2024-02-20T14:30:00.000Z'
        }
      ];
      
      return NextResponse.json({
        banners: mockBanners,
        pagination: {
          page,
          limit,
          total: mockBanners.length,
          totalPages: 1
        }
      });
    }

    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('banners')
      .select('*', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (position) {
      query = query.eq('position', position);
    }

    if (isActive !== null) {
      query = query.eq('isActive', isActive === 'true');
    }
    
    // Para não-admin, mostrar apenas banners ativos
    if (!user || user.type !== 'ADMIN') {
      query = query.eq('isActive', true);
    }

    const { data: banners, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar banners:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar banners' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      banners: banners || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Erro na busca de banners:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/admin/banners - Criar novo banner (ADMIN ONLY)
export async function POST(request: NextRequest) {
  try {
    // Verificar se é admin
    const admin = await requireAdmin(request);
    console.log(`👨‍💻 Admin ${admin.email} criando novo banner`);
    
    const body = await request.json();
    const {
      title,
      description,
      imageUrl,
      targetUrl,
      position,
      startDate,
      endDate,
      isActive = true
    } = body;

    // Validações
    if (!title || !description || !imageUrl || !targetUrl || !position) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: title, description, imageUrl, targetUrl, position' },
        { status: 400 }
      );
    }

    if (!['HEADER', 'SIDEBAR', 'FOOTER', 'CATEGORY'].includes(position)) {
      return NextResponse.json(
        { error: 'Posição inválida. Use: HEADER, SIDEBAR, FOOTER ou CATEGORY' },
        { status: 400 }
      );
    }

    // Validar datas
    const start = new Date(startDate || new Date());
    const end = new Date(endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    if (end <= start) {
      return NextResponse.json(
        { error: 'Data de fim deve ser posterior à data de início' },
        { status: 400 }
      );
    }

    // Criar banner
    const { data: banner, error } = await supabase
      .from('banners')
      .insert({
        title,
        description,
        imageUrl,
        targetUrl,
        position,
        isActive,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        clicks: 0,
        impressions: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar banner:', error);
      return NextResponse.json(
        { error: 'Erro ao criar banner' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: banner,
      message: 'Banner criado com sucesso'
    }, { status: 201 });
  } catch (error) {
    console.error('Erro na criação de banner:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}