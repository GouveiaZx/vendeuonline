import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromToken } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await getUserFromToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // active, expired, cancelled
    const sellerId = searchParams.get('sellerId');

    // Verificar permissões
    if (user.type !== 'ADMIN' && user.type !== 'SELLER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let query = supabase
      .from('subscriptions')
      .select(`
        id,
        seller_id,
        plan_type,
        status,
        starts_at,
        expires_at,
        payment_id,
        created_at,
        updated_at,
        sellers (
          id,
          name,
          email
        ),
        plans (
          id,
          name,
          price,
          features
        )
      `)
      .order('created_at', { ascending: false });

    // Para vendedores, mostrar apenas suas próprias assinaturas
    if (user.type === 'SELLER') {
      query = query.eq('seller_id', user.id);
    } else if (sellerId) {
      // Para admins, permitir filtrar por vendedor específico
      query = query.eq('seller_id', sellerId);
    }

    // Filtro por status
    if (status) {
      query = query.eq('status', status.toUpperCase());
    }

    const { data: subscriptions, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch subscriptions' 
      }, { status: 500 });
    }

    // Enriquecer com informações de status calculado
    const enrichedSubscriptions = subscriptions?.map(subscription => {
      const now = new Date();
      const expiresAt = new Date(subscription.expires_at);
      const startsAt = new Date(subscription.starts_at);
      
      let calculatedStatus = subscription.status;
      
      // Verificar se está realmente ativo baseado nas datas
      if (subscription.status === 'ACTIVE') {
        if (now < startsAt) {
          calculatedStatus = 'PENDING';
        } else if (now > expiresAt) {
          calculatedStatus = 'EXPIRED';
        }
      }

      return {
        ...subscription,
        calculatedStatus,
        daysUntilExpiry: Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: enrichedSubscriptions || []
    });

  } catch (error) {
    console.error('Subscriptions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await getUserFromToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;
    const body = await request.json();
    
    const {
      planType,
      sellerId,
      paymentId,
      duration = 1 // em meses
    } = body;

    // Validar dados obrigatórios
    if (!planType) {
      return NextResponse.json({ 
        error: 'Plan type is required' 
      }, { status: 400 });
    }

    // Determinar vendedor
    let targetSellerId = sellerId;
    if (user.type === 'SELLER') {
      targetSellerId = user.id; // Vendedores só podem criar para si mesmos
    } else if (user.type === 'ADMIN' && !sellerId) {
      return NextResponse.json({ 
        error: 'Seller ID is required for admin' 
      }, { status: 400 });
    } else if (user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verificar se o plano existe
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, name, price, duration_months')
      .eq('type', planType.toUpperCase())
      .eq('active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ 
        error: 'Plan not found or inactive' 
      }, { status: 404 });
    }

    // Verificar se vendedor existe
    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select('id, name, current_plan')
      .eq('id', targetSellerId)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json({ 
        error: 'Seller not found' 
      }, { status: 404 });
    }

    // Verificar se já existe assinatura ativa
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, status, expires_at')
      .eq('seller_id', targetSellerId)
      .eq('status', 'ACTIVE')
      .single();

    if (existingSubscription) {
      const expiresAt = new Date(existingSubscription.expires_at);
      if (expiresAt > new Date()) {
        return NextResponse.json({ 
          error: 'Seller already has an active subscription' 
        }, { status: 409 });
      }
    }

    // Calcular datas da assinatura
    const now = new Date();
    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (duration || plan.duration_months || 1));

    // Criar assinatura
    const subscriptionData = {
      seller_id: targetSellerId,
      plan_type: planType.toUpperCase(),
      status: paymentId ? 'ACTIVE' : 'PENDING', // Se tem pagamento, ativar imediatamente
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      payment_id: paymentId || null,
      created_at: now.toISOString()
    };

    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select(`
        *,
        plans (
          name,
          price,
          features
        )
      `)
      .single();

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      return NextResponse.json({ 
        error: 'Failed to create subscription' 
      }, { status: 500 });
    }

    // Atualizar plano atual do vendedor se a assinatura está ativa
    if (subscription.status === 'ACTIVE') {
      const { error: sellerUpdateError } = await supabase
        .from('sellers')
        .update({ 
          current_plan: subscription.plan_type,
          plan_expires_at: subscription.expires_at,
          updated_at: now.toISOString()
        })
        .eq('id', targetSellerId);

      if (sellerUpdateError) {
        console.error('Error updating seller plan:', sellerUpdateError);
        // Não falhar completamente, apenas log do erro
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: subscription,
      message: 'Subscription created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Subscriptions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT para atualizar status de assinatura
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação (apenas admins)
    const authResult = await getUserFromToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;

    if (user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { subscriptionId, status, reason } = body;

    if (!subscriptionId || !status) {
      return NextResponse.json({ 
        error: 'Subscription ID and status are required' 
      }, { status: 400 });
    }

    const validStatuses = ['ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status' 
      }, { status: 400 });
    }

    // Buscar assinatura atual
    const { data: currentSubscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !currentSubscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Atualizar assinatura
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update subscription' 
      }, { status: 500 });
    }

    // Atualizar plano do vendedor se necessário
    if (status === 'ACTIVE') {
      await supabase
        .from('sellers')
        .update({ 
          current_plan: updatedSubscription.plan_type,
          plan_expires_at: updatedSubscription.expires_at
        })
        .eq('id', updatedSubscription.seller_id);
    } else if (['CANCELLED', 'EXPIRED', 'SUSPENDED'].includes(status)) {
      // Reverter para plano gratuito
      await supabase
        .from('sellers')
        .update({ 
          current_plan: 'GRATUITO',
          plan_expires_at: null
        })
        .eq('id', updatedSubscription.seller_id);
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedSubscription,
      message: 'Subscription updated successfully'
    });

  } catch (error) {
    console.error('Subscriptions PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}