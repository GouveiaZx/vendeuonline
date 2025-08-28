import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface RouteParams {
  params: Promise<{
    slug: string
  }>
}

// GET - Buscar loja por slug
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug da loja é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buscar loja por slug
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      );
    }

    // Buscar produtos da loja
    const { data: products } = await supabase
      .from('products')
      .select(`
        *,
        product_images!inner(image_url, is_main)
      `)
      .eq('store_id', store.id)
      .eq('is_active', true)
      .eq('product_images.is_main', true)
      .order('sales_count', { ascending: false })
      .limit(20);

    // Buscar reviews da loja
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Contar produtos ativos
    const { count: productsCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', store.id)
      .eq('is_active', true);

    // Contar reviews
     const { count: reviewsCount } = await supabase
       .from('reviews')
       .select('id', { count: 'exact', head: true })
       .eq('store_id', store.id);

    // Calcular avaliação média
    const { data: avgRatingData } = await supabase
      .from('reviews')
      .select('rating')
      .eq('store_id', store.id);

    const avgRating = avgRatingData && avgRatingData.length > 0
      ? avgRatingData.reduce((sum, review) => sum + review.rating, 0) / avgRatingData.length
      : 0;

    const storeWithStats = {
      ...store,
      products: products || [],
      reviews: reviews || [],
      avgRating,
      totalProducts: productsCount || 0,
      totalOrders: 0, // Simulado
      totalReviews: reviewsCount || 0
    }

    return NextResponse.json(storeWithStats)
  } catch (error) {
    console.error('Erro ao buscar loja por slug:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}