import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromToken } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // MODO DESENVOLVIMENTO: Retornar sucesso mock se Supabase não está configurado
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || 
        supabaseUrl.includes('seu-projeto') || 
        supabaseUrl.includes('vendeuonline-demo') ||
        !serviceKey || 
        serviceKey === 'your-service-role-key-here' ||
        serviceKey.includes('demo')) {
      console.log('[DEV MODE] Mock analytics event received');
      return NextResponse.json({
        success: true,
        message: 'Analytics event recorded (mock mode)'
      });
    }

    // Verificar autenticação (opcional para analytics)
    const authResult = await getUserFromToken(request);
    const user = authResult.success ? authResult.user : null;

    const body = await request.json();
    const {
      event,
      properties = {},
      userId,
      sessionId,
      userAgent,
      ip,
      page,
      timestamp
    } = body;

    // Validar dados obrigatórios
    if (!event) {
      return NextResponse.json({ 
        error: 'Event name is required' 
      }, { status: 400 });
    }

    // Capturar informações do request
    const requestInfo = {
      userAgent: userAgent || request.headers.get('user-agent'),
      ip: ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      referer: request.headers.get('referer'),
      origin: request.headers.get('origin')
    };

    // Preparar dados do evento
    const eventData = {
      event,
      user_id: userId || user?.id || null,
      session_id: sessionId || null,
      properties: {
        ...properties,
        page,
        ...requestInfo
      },
      ip_address: requestInfo.ip,
      user_agent: requestInfo.userAgent,
      created_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
    };

    // Inserir evento na tabela de analytics
    const { data: analyticsEvent, error: eventError } = await supabase
      .from('analytics_events')
      .insert(eventData)
      .select()
      .single();

    if (eventError) {
      console.error('Error creating analytics event:', eventError);
      return NextResponse.json({ 
        error: 'Failed to create analytics event' 
      }, { status: 500 });
    }

    // Processar eventos específicos
    await processSpecificEvent(event, properties, user);

    return NextResponse.json({ 
      success: true, 
      data: {
        eventId: analyticsEvent.id,
        event,
        timestamp: analyticsEvent.created_at
      },
      message: 'Event tracked successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Analytics event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Processar eventos específicos que necessitam ações adicionais
async function processSpecificEvent(event: string, properties: any, user: any) {
  try {
    switch (event) {
      case 'product_view':
        if (properties.productId) {
          await trackProductView(properties.productId, user?.id);
        }
        break;
      
      case 'product_purchase':
        if (properties.productId && properties.orderId) {
          await trackProductPurchase(properties.productId, properties.orderId, user?.id);
        }
        break;
      
      case 'search':
        if (properties.query) {
          await trackSearchQuery(properties.query, properties.resultsCount || 0, user?.id);
        }
        break;
      
      case 'store_visit':
        if (properties.storeId) {
          await trackStoreVisit(properties.storeId, user?.id);
        }
        break;
      
      case 'user_signup':
        if (user?.id) {
          await trackUserSignup(user.id, properties.source || 'direct');
        }
        break;
      
      case 'cart_add':
        if (properties.productId && properties.quantity) {
          await trackCartAddition(properties.productId, properties.quantity, user?.id);
        }
        break;
    }
  } catch (error) {
    console.error('Error processing specific event:', error);
    // Não falhar o request principal por erro no processamento específico
  }
}

// Funções para tracking específico
async function trackProductView(productId: string, userId: string | null) {
  try {
    // Incrementar contador de visualizações do produto
    const { error } = await supabase
      .rpc('increment_product_views', {
        product_id: productId,
        user_id: userId
      });

    if (error) {
      console.error('Error tracking product view:', error);
    }
  } catch (error) {
    console.error('Error in trackProductView:', error);
  }
}

async function trackProductPurchase(productId: string, orderId: string, userId: string | null) {
  try {
    // Incrementar contador de compras do produto
    const { error } = await supabase
      .rpc('increment_product_purchases', {
        product_id: productId,
        order_id: orderId,
        user_id: userId
      });

    if (error) {
      console.error('Error tracking product purchase:', error);
    }
  } catch (error) {
    console.error('Error in trackProductPurchase:', error);
  }
}

async function trackSearchQuery(query: string, resultsCount: number, userId: string | null) {
  try {
    // Registrar consulta de busca
    const { error } = await supabase
      .from('search_analytics')
      .insert({
        query: query.toLowerCase().trim(),
        results_count: resultsCount,
        user_id: userId,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error tracking search query:', error);
    }
  } catch (error) {
    console.error('Error in trackSearchQuery:', error);
  }
}

async function trackStoreVisit(storeId: string, userId: string | null) {
  try {
    // Incrementar contador de visitas da loja
    const { error } = await supabase
      .rpc('increment_store_visits', {
        store_id: storeId,
        user_id: userId
      });

    if (error) {
      console.error('Error tracking store visit:', error);
    }
  } catch (error) {
    console.error('Error in trackStoreVisit:', error);
  }
}

async function trackUserSignup(userId: string, source: string) {
  try {
    // Registrar origem do signup
    const { error } = await supabase
      .from('user_acquisition')
      .insert({
        user_id: userId,
        source,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error tracking user signup:', error);
    }
  } catch (error) {
    console.error('Error in trackUserSignup:', error);
  }
}

async function trackCartAddition(productId: string, quantity: number, userId: string | null) {
  try {
    // Registrar adição ao carrinho
    const { error } = await supabase
      .from('cart_analytics')
      .insert({
        product_id: productId,
        quantity,
        user_id: userId,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error tracking cart addition:', error);
    }
  } catch (error) {
    console.error('Error in trackCartAddition:', error);
  }
}