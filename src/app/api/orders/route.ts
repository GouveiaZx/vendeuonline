import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromToken } from '@/lib/auth';
import { 
  handleAPIError, 
  TransactionManager, 
  validateRequired,
  validateUUID,
  APIError
} from '@/utils/apiErrorHandler';

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
    const status = searchParams.get('status');
    const buyerId = searchParams.get('buyerId');
    const sellerId = searchParams.get('sellerId');

    // Otimizar query com relacionamentos eficientes
    let baseQuery = supabase
      .from('orders')
      .select(`
        id,
        buyer_id,
        status,
        subtotal,
        shipping_cost,
        total,
        payment_method,
        shipping_address,
        created_at,
        updated_at,
        payment_confirmed_at,
        order_items!inner(
          id,
          product_id,
          quantity,
          price,
          subtotal,
          products!inner(
            id,
            name,
            price,
            images,
            seller_id,
            store_id,
            stores!inner(
              id,
              name,
              seller_id
            )
          )
        ),
        users!buyer_id(
          id,
          name,
          email
        )
      `)

    // Filtros baseados no tipo de usuário (otimizado)
    if (user.type === 'BUYER') {
      baseQuery = baseQuery.eq('buyer_id', user.id);
    } else if (user.type === 'SELLER') {
      // Para vendedores, filtrar pelos produtos da loja
      baseQuery = baseQuery.eq('order_items.products.seller_id', user.id);
    }

    // Aplicar filtros adicionais (otimizado)
    if (status) baseQuery = baseQuery.eq('status', status);
    if (buyerId && user.type === 'ADMIN') baseQuery = baseQuery.eq('buyer_id', buyerId);
    if (sellerId && user.type === 'ADMIN') {
      baseQuery = baseQuery.eq('order_items.products.seller_id', sellerId);
    }

    // Paginação otimizada
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    // Contar total primeiro
    const { count, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('Erro ao contar pedidos:', countError);
    }

    const { data: orders, error } = await baseQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Processar dados para otimizar response
    const processedOrders = orders?.map(order => ({
      ...order,
      // Agrupar items por vendedor para melhor organização
      itemsBySeller: order.order_items.reduce((acc: any, item: any) => {
        const sellerId = item.products.seller_id;
        const storeId = item.products.store_id;
        const storeName = item.products.stores.name;
        
        if (!acc[sellerId]) {
          acc[sellerId] = {
            sellerId,
            storeId,
            storeName,
            items: []
          };
        }
        
        acc[sellerId].items.push({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          product: {
            id: item.products.id,
            name: item.products.name,
            price: item.products.price,
            images: item.products.images
          }
        });
        
        return acc;
      }, {}),
      // Manter items originais também
      order_items: order.order_items.map((item: any) => ({
        ...item,
        product: {
          id: item.products.id,
          name: item.products.name,
          price: item.products.price,
          images: item.products.images
        }
      }))
    })) || [];

    return NextResponse.json({ 
      success: true, 
      data: processedOrders,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Orders GET error:', error);
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
      items,
      shippingAddress,
      paymentMethod,
      paymentData
    } = body;

    // Validar dados obrigatórios
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ 
        error: 'Items are required' 
      }, { status: 400 });
    }

    if (!shippingAddress) {
      return NextResponse.json({ 
        error: 'Shipping address is required' 
      }, { status: 400 });
    }

    // Calcular totais
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, price, stock')
        .eq('id', item.productId)
        .single();

      if (productError || !product) {
        return NextResponse.json({ 
          error: `Product ${item.productId} not found` 
        }, { status: 404 });
      }

      if (product.stock < item.quantity) {
        return NextResponse.json({ 
          error: `Insufficient stock for ${product.name}` 
        }, { status: 400 });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product_id: item.productId,
        quantity: item.quantity,
        price: product.price,
        subtotal: itemTotal
      });
    }

    // Calcular shipping e taxas (simplificado)
    const shippingCost = subtotal > 100 ? 0 : 15.99;
    const total = subtotal + shippingCost;

    // Criar pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        status: 'PENDING',
        subtotal,
        shipping_cost: shippingCost,
        total,
        payment_method: paymentMethod || 'credit_card',
        shipping_address: shippingAddress,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ 
        error: 'Failed to create order' 
      }, { status: 500 });
    }

    // Criar itens do pedido
    const itemsToInsert = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Rollback: deletar o pedido criado
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ 
        error: 'Failed to create order items' 
      }, { status: 500 });
    }

    // Atualizar estoque dos produtos
    for (const item of items) {
      const { error: stockError } = await supabase
        .rpc('decrement_stock', {
          product_id: item.productId,
          quantity: item.quantity
        });

      if (stockError) {
        console.error('Error updating stock:', stockError);
        throw new APIError('Erro ao atualizar estoque', 500, 'STOCK_UPDATE_ERROR', stockError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: order,
      message: 'Order created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}