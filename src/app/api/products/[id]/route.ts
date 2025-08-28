import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken } from '@/lib/auth'
import { handleAPIError, TransactionManager } from '@/utils/apiErrorHandler'

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  comparePrice: z.number().positive().optional(),
  categoryId: z.string().optional(),
  subcategory: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().optional(),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive()
  }).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),

  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  images: z.array(z.object({
      url: z.string().url(),
      alt: z.string()
    })).optional(),
  specifications: z.array(z.object({
    name: z.string(),
    value: z.string()
  })).optional()
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET - Buscar produto por ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // Incrementar view count se não for o próprio vendedor
    const authResult = await getUserFromToken(request)
    let shouldIncrementView = true
    
    if (authResult.success && authResult.user) {
      const { data: product } = await supabase
        .from('products')
        .select('seller_id')
        .eq('id', id)
        .single()
      
      if (product && product.seller_id === authResult.user.id) {
        shouldIncrementView = false
      }
    }

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        compare_price,
        stock,
        sku,
        weight,
        dimensions,
        is_active,
        rating,
        review_count,
        sales_count,
        view_count,
        created_at,
        updated_at,
        category_id,
        store_id,
        seller_id,
        images,
        specifications,
        tags,
        categories!inner(
          id,
          name,
          slug
        ),
        stores!inner(
          id,
          name,
          slug,
          rating,
          review_count
        ),
        reviews(
          id,
          rating,
          title,
          comment,
          created_at,
          is_visible,
          users(
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()
    
    if (product && shouldIncrementView) {
      // Incrementar view count em background (sem aguardar)
      try {
        await supabase
          .from('products')
          .update({ view_count: (product.view_count || 0) + 1 })
          .eq('id', id)
        // View count updated successfully
      } catch (err) {
        console.error('Erro ao incrementar view count:', err)
      }
    }

    if (error || !product) {
      console.error('Erro ao buscar produto:', error)
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Filtrar reviews apenas visíveis
    if (product.reviews) {
      product.reviews = product.reviews.filter((r: any) => r.is_visible)
    }

    return NextResponse.json({
      success: true,
      data: product
    })
  } catch (error) {
    return handleAPIError(error, {
      method: request.method,
      url: request.url
    })
  }
}

// PUT - Atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Validar auth
    const authResult = await getUserFromToken(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = authResult.user
    if (user.type !== 'SELLER' && user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params;
    const body = await request.json()
    const validatedData = updateProductSchema.parse(body)

    const transaction = new TransactionManager()

    // Verificar se o produto existe e permissões
    const existingProduct = await transaction.execute(
      'verify-product',
      async () => {
        const { data, error } = await supabase
          .from('products')
          .select('id, seller_id, stock, name, is_active, store_id')
          .eq('id', id)
          .single()
        if (error) throw error
        return data
      },
      async () => {} // Nada para rollback
    )

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Verificar permissões
    if (user.type === 'SELLER' && existingProduct.seller_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Preparar dados de atualização
    const updateData: any = {}
    
    if (validatedData.name) updateData.name = validatedData.name
    if (validatedData.description) updateData.description = validatedData.description
    if (validatedData.price) updateData.price = validatedData.price
    if (validatedData.comparePrice) updateData.compare_price = validatedData.comparePrice
    if (validatedData.categoryId) updateData.category_id = validatedData.categoryId
    if (validatedData.stock !== undefined) updateData.stock = validatedData.stock
    if (validatedData.sku !== undefined) updateData.sku = validatedData.sku
    if (validatedData.weight) updateData.weight = validatedData.weight
    if (validatedData.dimensions) updateData.dimensions = validatedData.dimensions
    if (validatedData.isActive !== undefined) updateData.is_active = validatedData.isActive
    if (validatedData.isFeatured !== undefined) updateData.is_featured = validatedData.isFeatured

    if (validatedData.seoTitle) updateData.seo_title = validatedData.seoTitle
    if (validatedData.seoDescription) updateData.seo_description = validatedData.seoDescription

    // Atualizar produto com transação
    const updatedProduct = await transaction.execute(
      'update-product',
      async () => {
        updateData.updated_at = new Date().toISOString()
        
        const { data, error } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', id)
          .select('*')
          .single()
        if (error) throw error
        return data
      },
      async () => {
        // Rollback: restaurar dados originais (simplificado)
        console.log('Rollback de produto necessário')
      }
    )

    // Atualizar contador de produtos se status mudou
    if (validatedData.isActive !== undefined && validatedData.isActive !== existingProduct.is_active) {
      const rpcFunction = validatedData.isActive 
        ? 'increment_store_product_count' 
        : 'decrement_store_product_count'
      
      await transaction.execute(
        'update-counter',
        async () => {
          const { error } = await supabase.rpc(rpcFunction, {
            store_id: existingProduct.store_id
          })
          if (error) throw error
        },
        async () => {
          const oppositeFunction = validatedData.isActive 
            ? 'decrement_store_product_count'
            : 'increment_store_product_count'
          await supabase.rpc(oppositeFunction, {
            store_id: existingProduct.store_id
          })
        }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: 'Produto atualizado com sucesso'
    })
  } catch (error) {
    return handleAPIError(error, {
      method: request.method,
      url: request.url
    })
  }
}

// DELETE - Deletar produto
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Validar auth
    const authResult = await getUserFromToken(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = authResult.user
    if (user.type !== 'SELLER' && user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params;
    const transaction = new TransactionManager()

    // Verificar se o produto existe e permissões
    const existingProduct = await transaction.execute(
      'verify-product',
      async () => {
        const { data, error } = await supabase
          .from('products')
          .select('id, store_id, seller_id, is_active')
          .eq('id', id)
          .single()
        if (error) throw error
        return data
      },
      async () => {}
    )

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Verificar permissões
    if (user.type === 'SELLER' && existingProduct.seller_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete - marcar como inativo
    await transaction.execute(
      'deactivate-product',
      async () => {
        const { error } = await supabase
          .from('products')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
        if (error) throw error
      },
      async () => {
        await supabase
          .from('products')
          .update({ 
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
      }
    )

    // Decrementar contador se estava ativo
    if (existingProduct.is_active) {
      await transaction.execute(
        'decrement-counter',
        async () => {
          const { error } = await supabase.rpc('decrement_store_product_count', {
            store_id: existingProduct.store_id
          })
          if (error) throw error
        },
        async () => {
          await supabase.rpc('increment_store_product_count', {
            store_id: existingProduct.store_id
          })
        }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Produto removido com sucesso' 
    })
  } catch (error) {
    return handleAPIError(error, {
      method: request.method,
      url: request.url
    })
  }
}