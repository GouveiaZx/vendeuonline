import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromToken } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    
    // Verificar autenticação
    const authResult = await getUserFromToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;

    // Verificar se o produto existe e permissões
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, stock, seller_id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verificar permissões
    const canAccess = 
      user.type === 'ADMIN' ||
      (user.type === 'SELLER' && product.seller_id === user.id);

    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Buscar histórico de movimentações de estoque (últimas 50)
    const { data: stockMovements, error: movementsError } = await supabase
      .from('stock_movements')
      .select(`
        id,
        type,
        quantity,
        previous_stock,
        new_stock,
        reason,
        order_id,
        created_at,
        orders (
          id,
          status,
          buyers (
            name,
            email
          )
        )
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (movementsError) {
      console.error('Error fetching stock movements:', movementsError);
    }

    // Buscar alertas de estoque baixo se aplicável
    const { data: lowStockAlert } = await supabase
      .from('products')
      .select('stock, min_stock')
      .eq('id', productId)
      .single();

    const isLowStock = lowStockAlert && 
      lowStockAlert.min_stock && 
      lowStockAlert.stock <= lowStockAlert.min_stock;

    return NextResponse.json({ 
      success: true, 
      data: {
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        lowStockAlert: isLowStock,
        minStock: lowStockAlert?.min_stock || null,
        movements: stockMovements || []
      }
    });

  } catch (error) {
    console.error('Stock GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    
    // Verificar autenticação
    const authResult = await getUserFromToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;
    const body = await request.json();
    
    const {
      operation, // 'set', 'add', 'subtract'
      quantity,
      reason = 'Manual adjustment'
    } = body;

    // Validar dados obrigatórios
    if (!operation || quantity === undefined) {
      return NextResponse.json({ 
        error: 'Operation and quantity are required' 
      }, { status: 400 });
    }

    if (quantity < 0) {
      return NextResponse.json({ 
        error: 'Quantity cannot be negative' 
      }, { status: 400 });
    }

    const validOperations = ['set', 'add', 'subtract'];
    if (!validOperations.includes(operation)) {
      return NextResponse.json({ 
        error: 'Invalid operation. Must be: set, add, or subtract' 
      }, { status: 400 });
    }

    // Verificar se o produto existe e permissões
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, stock, seller_id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verificar permissões
    const canUpdate = 
      user.type === 'ADMIN' ||
      (user.type === 'SELLER' && product.seller_id === user.id);

    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calcular novo estoque
    let newStock = product.stock;
    const previousStock = product.stock;

    switch (operation) {
      case 'set':
        newStock = quantity;
        break;
      case 'add':
        newStock = product.stock + quantity;
        break;
      case 'subtract':
        newStock = product.stock - quantity;
        if (newStock < 0) {
          return NextResponse.json({ 
            error: 'Stock cannot be negative' 
          }, { status: 400 });
        }
        break;
    }

    // Iniciar transação para atualizar estoque e registrar movimentação
    const updates = [];

    // 1. Atualizar estoque do produto
    updates.push(
      supabase
        .from('products')
        .update({ 
          stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
    );

    // 2. Registrar movimentação de estoque
    const movementType = operation === 'add' ? 'IN' : operation === 'subtract' ? 'OUT' : 'ADJUSTMENT';
    
    updates.push(
      supabase
        .from('stock_movements')
        .insert({
          product_id: productId,
          type: movementType,
          quantity: Math.abs(newStock - previousStock),
          previous_stock: previousStock,
          new_stock: newStock,
          reason,
          created_by: user.id,
          created_at: new Date().toISOString()
        })
    );

    // Executar todas as operações
    const results = await Promise.all(updates);
    
    // Verificar se alguma operação falhou
    for (const result of results) {
      if (result.error) {
        console.error('Stock update error:', result.error);
        return NextResponse.json({ 
          error: 'Failed to update stock' 
        }, { status: 500 });
      }
    }

    // Verificar se precisa gerar alerta de estoque baixo
    const { data: productWithMinStock } = await supabase
      .from('products')
      .select('min_stock')
      .eq('id', productId)
      .single();

    const shouldAlert = productWithMinStock?.min_stock && 
      newStock <= productWithMinStock.min_stock &&
      previousStock > productWithMinStock.min_stock;

    if (shouldAlert) {
      // Em produção, disparar notificação/email de estoque baixo
      console.log(`Low stock alert: Product ${productId} has ${newStock} units (min: ${productWithMinStock.min_stock})`);
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        productId,
        previousStock,
        newStock,
        operation,
        quantity: Math.abs(newStock - previousStock),
        reason,
        lowStockAlert: shouldAlert
      },
      message: 'Stock updated successfully'
    });

  } catch (error) {
    console.error('Stock PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}