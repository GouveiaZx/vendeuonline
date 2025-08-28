import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromToken } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação (opcional para visualizar planos)
    const authResult = await getUserFromToken(request);
    const user = authResult.success ? authResult.user : null;

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const type = searchParams.get('type'); // GRATUITO, MICRO_EMPRESA, etc.

    let query = supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    // Filtros
    if (active === 'true') {
      query = query.eq('active', true);
    }

    if (type) {
      query = query.eq('type', type.toUpperCase());
    }

    const { data: plans, error } = await query;

    if (error) {
      console.error('Error fetching plans:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch plans' 
      }, { status: 500 });
    }

    // Adicionar informações do plano atual do usuário se logado
    let currentPlan = null;
    if (user && user.type === 'SELLER') {
      const { data: seller } = await supabase
        .from('sellers')
        .select(`
          current_plan,
          plan_expires_at,
          plans (*)
        `)
        .eq('id', user.id)
        .single();

      if (seller && seller.plans) {
        currentPlan = {
          type: seller.current_plan,
          expiresAt: seller.plan_expires_at,
          details: seller.plans
        };
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        plans: plans || [],
        currentPlan
      }
    });

  } catch (error) {
    console.error('Plans GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (apenas admins podem criar planos)
    const authResult = await getUserFromToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;

    // Apenas admins podem criar novos planos
    if (user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      type,
      price,
      duration_months,
      max_products,
      max_images_per_product,
      commission_rate,
      features = [],
      active = true,
      description
    } = body;

    // Validar dados obrigatórios
    if (!name || !type || price === undefined) {
      return NextResponse.json({ 
        error: 'Name, type and price are required' 
      }, { status: 400 });
    }

    // Validar tipo do plano
    const validTypes = ['GRATUITO', 'MICRO_EMPRESA', 'PEQUENA_EMPRESA', 'EMPRESA_SIMPLES', 'EMPRESA_PLUS'];
    if (!validTypes.includes(type.toUpperCase())) {
      return NextResponse.json({ 
        error: 'Invalid plan type' 
      }, { status: 400 });
    }

    // Verificar se já existe plano com este tipo
    const { data: existingPlan } = await supabase
      .from('plans')
      .select('id')
      .eq('type', type.toUpperCase())
      .single();

    if (existingPlan) {
      return NextResponse.json({ 
        error: 'Plan with this type already exists' 
      }, { status: 409 });
    }

    // Criar plano
    const planData = {
      name,
      type: type.toUpperCase(),
      price: parseFloat(price),
      duration_months: duration_months || 1,
      max_products: max_products || null,
      max_images_per_product: max_images_per_product || 5,
      commission_rate: commission_rate ? parseFloat(commission_rate) : 0.05, // 5% padrão
      features: features || [],
      active,
      description: description || '',
      created_at: new Date().toISOString()
    };

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .insert(planData)
      .select()
      .single();

    if (planError) {
      console.error('Error creating plan:', planError);
      return NextResponse.json({ 
        error: 'Failed to create plan' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: plan,
      message: 'Plan created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Plans POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}