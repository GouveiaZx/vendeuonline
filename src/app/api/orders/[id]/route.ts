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
    
    // Verificar autenticação
    const authResult = await getUserFromToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            id,
            name,
            price,
            images,
            seller_id
          )
        ),
        buyers (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('id', id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verificar permissões
    const canAccess = 
      user.type === 'ADMIN' ||
      (user.type === 'BUYER' && order.buyer_id === user.id) ||
      (user.type === 'SELLER' && order.order_items?.some((item: any) => item.products?.seller_id === user.id));

    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true, 
      data: order 
    });

  } catch (error) {
    console.error('Order GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verificar autenticação
    const authResult = await getUserFromToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;
    const body = await request.json();
    
    // Buscar pedido atual
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (seller_id)
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verificar permissões para update
    const canUpdate = 
      user.type === 'ADMIN' ||
      (user.type === 'BUYER' && currentOrder.buyer_id === user.id && ['PENDING', 'CONFIRMED'].includes(currentOrder.status)) ||
      (user.type === 'SELLER' && currentOrder.order_items?.some((item: any) => item.products?.seller_id === user.id));

    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Preparar dados para update
    const updateData: any = {};
    
    if (body.status) {
      // Validar transições de status
      const validTransitions = {
        'PENDING': ['CONFIRMED', 'CANCELLED'],
        'CONFIRMED': ['PROCESSING', 'CANCELLED'],
        'PROCESSING': ['SHIPPED', 'CANCELLED'],
        'SHIPPED': ['DELIVERED'],
        'DELIVERED': [],
        'CANCELLED': []
      };

      const allowedStatuses = validTransitions[currentOrder.status as keyof typeof validTransitions] || [];
      if (!(allowedStatuses as string[]).includes(body.status)) {
        return NextResponse.json({ 
          error: `Cannot change status from ${currentOrder.status} to ${body.status}` 
        }, { status: 400 });
      }

      updateData.status = body.status;
    }

    if (body.tracking_code && user.type === 'SELLER') {
      updateData.tracking_code = body.tracking_code;
    }

    if (body.notes && (user.type === 'ADMIN' || user.type === 'SELLER')) {
      updateData.notes = body.notes;
    }

    updateData.updated_at = new Date().toISOString();

    // Atualizar pedido
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedOrder,
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error('Order PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verificar autenticação
    const authResult = await getUserFromToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;

    // Apenas admins podem deletar pedidos
    if (user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Buscar pedido para verificar se pode ser deletado
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Só permitir deletar pedidos cancelados ou pendentes
    if (!['PENDING', 'CANCELLED'].includes(order.status)) {
      return NextResponse.json({ 
        error: 'Only pending or cancelled orders can be deleted' 
      }, { status: 400 });
    }

    // Deletar itens do pedido primeiro
    const { error: itemsDeleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', id);

    if (itemsDeleteError) {
      console.error('Error deleting order items:', itemsDeleteError);
      return NextResponse.json({ error: 'Failed to delete order items' }, { status: 500 });
    }

    // Deletar pedido
    const { error: orderDeleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (orderDeleteError) {
      console.error('Error deleting order:', orderDeleteError);
      return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Order DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}