import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const updateStoreSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').optional(),
  logo: z.string().url().optional(),
  banner: z.string().url().optional(),
  address: z.string().min(5, 'Endereço é obrigatório').optional(),
  city: z.string().min(2, 'Cidade é obrigatória').optional(),
  state: z.string().min(2, 'Estado é obrigatório').optional(),
  zip_code: z.string().min(8, 'CEP inválido').optional(),
  phone: z.string().min(10, 'Telefone inválido').optional(),
  email: z.string().email('Email inválido').optional(),
  whatsapp: z.string().optional(),
  website: z.string().url().optional(),
  category: z.string().min(2, 'Categoria é obrigatória').optional(),
  social_media: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional()
  }).optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  is_active: z.boolean().optional()
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET - Buscar loja por ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID da loja é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Buscar loja com Supabase
    const { data: store, error } = await supabase
      .from('stores')
      .select(`
        *,
        sellers!inner(
          id,
          store_name,
          rating,
          total_sales,
          users!inner(
            name,
            email,
            phone
          )
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !store) {
      return new Response(
        JSON.stringify({ error: 'Loja não encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Buscar produtos da loja
    const { data: products } = await supabase
      .from('products')
      .select(`
        *,
        product_images!inner(url),
        categories(id, name)
      `)
      .eq('store_id', id)
      .eq('is_active', true)
      .order('sales_count', { ascending: false })
      .limit(20)

    // Buscar reviews da loja
    const { data: reviews } = await supabase
      .from('reviews')
      .select(`
        *,
        users(name)
      `)
      .eq('store_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calcular estatísticas
    const { data: stats } = await supabase
      .from('reviews')
      .select('rating')
      .eq('store_id', id)

    const avgRating = stats && stats.length > 0 
      ? stats.reduce((sum, review) => sum + review.rating, 0) / stats.length 
      : 0

    const storeWithStats = {
      ...store,
      products: products || [],
      reviews: reviews || [],
      avgRating,
      totalProducts: products?.length || 0,
      totalReviews: reviews?.length || 0
    }

    return new Response(
      JSON.stringify(storeWithStats),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro ao buscar loja:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// PUT - Atualizar loja
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateStoreSchema.parse(body)

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID da loja é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se a loja existe
    const { data: existingStore, error: fetchError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingStore) {
      return new Response(
        JSON.stringify({ error: 'Loja não encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Se o nome mudou, gerar novo slug
    const updateData: any = { ...validatedData }
    
    if (validatedData.name && validatedData.name !== existingStore.name) {
      const baseSlug = validatedData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      updateData.slug = baseSlug
    }

    // Atualizar loja
    const { data: updatedStore, error } = await supabase
      .from('stores')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Erro ao atualizar loja:', error)
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar loja' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(updatedStore),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos', details: error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.error('Erro ao atualizar loja:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// DELETE - Desativar loja (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID da loja é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se a loja existe
    const { data: existingStore, error: fetchError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingStore) {
      return new Response(
        JSON.stringify({ error: 'Loja não encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Soft delete - desativar loja
    const { error: updateError } = await supabase
      .from('stores')
      .update({ is_active: false })
      .eq('id', id)

    if (updateError) {
      console.error('Erro ao desativar loja:', updateError)
      return new Response(
        JSON.stringify({ error: 'Erro ao desativar loja' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Desativar todos os produtos da loja
    await supabase
      .from('products')
      .update({ is_active: false })
      .eq('store_id', id)

    return new Response(
      JSON.stringify({ message: 'Loja desativada com sucesso' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro ao deletar loja:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}