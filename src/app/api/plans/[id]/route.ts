import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromToken } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verificar autenticação (opcional para visualizar plano específico)
    const authResult = await getUserFromToken(request);
    const user = authResult.success ? authResult.user : null;

    const { data: plan, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Adicionar estatísticas do plano se for admin
    let planStats = null;
    if (user && user.type === 'ADMIN') {
      const { data: subscribers } = await supabase
        .from('sellers')
        .select('id')
        .eq('current_plan', plan.type);

      planStats = {
        totalSubscribers: subscribers?.length || 0
      };
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        ...plan,
        ...(planStats && { stats: planStats })
      }
    });

  } catch (error) {
    console.error('Plan GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verificar autenticação (apenas admins podem atualizar planos)
    const authResult = await getUserFromToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;

    // Apenas admins podem atualizar planos
    if (user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Verificar se plano existe
    const { data: currentPlan, error: fetchError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Preparar dados para update
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.duration_months !== undefined) updateData.duration_months = body.duration_months;
    if (body.max_products !== undefined) updateData.max_products = body.max_products;
    if (body.max_images_per_product !== undefined) updateData.max_images_per_product = body.max_images_per_product;
    if (body.commission_rate !== undefined) updateData.commission_rate = parseFloat(body.commission_rate);
    if (body.features !== undefined) updateData.features = body.features;
    if (body.active !== undefined) updateData.active = body.active;
    if (body.description !== undefined) updateData.description = body.description;

    // Validar tipo se fornecido (não permitir mudança de tipo)
    if (body.type && body.type !== currentPlan.type) {
      return NextResponse.json({ 
        error: 'Plan type cannot be changed' 
      }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    // Atualizar plano
    const { data: updatedPlan, error: updateError } = await supabase
      .from('plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating plan:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update plan' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedPlan,
      message: 'Plan updated successfully'
    });

  } catch (error) {
    console.error('Plan PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verificar autenticação (apenas admins podem deletar planos)
    const authResult = await getUserFromToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;

    // Apenas admins podem deletar planos
    if (user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verificar se plano existe
    const { data: plan, error: fetchError } = await supabase
      .from('plans')
      .select('type')
      .eq('id', id)
      .single();

    if (fetchError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Verificar se existem vendedores usando este plano
    const { data: subscribers, error: subscribersError } = await supabase
      .from('sellers')
      .select('id')
      .eq('current_plan', plan.type);

    if (subscribersError) {
      console.error('Error checking plan subscribers:', subscribersError);
      return NextResponse.json({ 
        error: 'Failed to check plan subscribers' 
      }, { status: 500 });
    }

    if (subscribers && subscribers.length > 0) {
      return NextResponse.json({ 
        error: `Cannot delete plan with ${subscribers.length} active subscribers` 
      }, { status: 400 });
    }

    // Não permitir deletar plano gratuito
    if (plan.type === 'GRATUITO') {
      return NextResponse.json({ 
        error: 'Cannot delete free plan' 
      }, { status: 400 });
    }

    // Deletar plano
    const { error: deleteError } = await supabase
      .from('plans')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting plan:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete plan' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Plan deleted successfully'
    });

  } catch (error) {
    console.error('Plan DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}