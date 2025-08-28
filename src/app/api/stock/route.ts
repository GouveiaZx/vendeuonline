import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authMiddleware, AuthenticatedRequest, requireAdmin, requireSeller, requireBuyer } from '@/lib/auth-middleware'
import { StockService } from '@/services/stockService'
import { createClient } from '@supabase/supabase-js'

const stockAdjustmentSchema = z.object({
  productId: z.string(),
  quantity: z.number().int(),
  reason: z.string().min(1, 'Motivo é obrigatório'),
  type: z.enum(['ADJUSTMENT', 'PURCHASE', 'RETURN', 'SALE'])
})

const stockCheckSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive()
})

/**
 * GET /api/stock - Listar produtos com estoque baixo ou esgotado
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'low' | 'out_of_stock'
    const storeId = searchParams.get('storeId')

    // Verificar permissões
    if (!authResult.user || authResult.user.type === 'BUYER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Se for vendedor, só pode ver produtos da própria loja
    if (authResult.user.type === 'SELLER' && !storeId) {
      return NextResponse.json({ error: 'ID da loja é obrigatório para vendedores' }, { status: 400 })
    }

    let products
    if (status === 'low') {
      products = await StockService.getLowStockProducts(storeId ? parseInt(storeId) : undefined)
    } else if (status === 'out_of_stock') {
      products = await StockService.getLowStockProducts(storeId ? parseInt(storeId) : undefined)
    } else {
      // Retornar ambos
      const [lowStock, outOfStock] = await Promise.all([
        StockService.getLowStockProducts(storeId ? parseInt(storeId) : undefined),
        StockService.getLowStockProducts(storeId ? parseInt(storeId) : undefined)
      ])
      products = { lowStock, outOfStock }
    }

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Erro ao buscar produtos com estoque baixo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/stock - Fazer ajuste manual de estoque
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    // Apenas admins e vendedores podem fazer ajustes
    if (!authResult.user || authResult.user.type === 'BUYER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = stockAdjustmentSchema.parse(body)

    // Se for vendedor, verificar se o produto pertence à sua loja
    if (authResult.user.type === 'SELLER') {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: seller } = await supabase
        .from('sellers')
        .select('store_id')
        .eq('user_id', authResult.user.id)
        .single();

      if (!seller?.store_id) {
        return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
      }

      const { data: product } = await supabase
        .from('products')
        .select('id')
        .eq('id', validatedData.productId)
        .eq('store_id', seller.store_id)
        .single();

      if (!product) {
        return NextResponse.json({ error: 'Produto não pertence à sua loja' }, { status: 403 })
      }
    }

    // Executar ajuste de estoque
    const operation = {
      productId: validatedData.productId,
      quantity: validatedData.quantity,
      type: validatedData.type as any,
      reason: validatedData.reason,
      userId: authResult.user.id
    }

    await StockService.executeStockOperations([operation])

    return NextResponse.json({ 
      message: 'Ajuste de estoque realizado com sucesso',
      operation 
    })
  } catch (error) {
    console.error('Erro ao fazer ajuste de estoque:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/stock - Verificar disponibilidade de estoque
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = stockCheckSchema.parse(body)

    const isAvailable = await StockService.checkAvailability(
      validatedData.productId
    )

    return NextResponse.json({ 
      available: isAvailable,
      productId: validatedData.productId,
      requestedQuantity: validatedData.quantity
    })
  } catch (error) {
    console.error('Erro ao verificar disponibilidade de estoque:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}