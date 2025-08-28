import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/reviews/stats - Buscar estatísticas de reviews
export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { searchParams } = new URL(request.url)
    
    const productId = searchParams.get('productId')
    const storeId = searchParams.get('storeId')

    if (!productId && !storeId) {
      return NextResponse.json(
        { error: 'productId ou storeId é obrigatório' },
        { status: 400 }
      )
    }

    // Construir query base
    let query = supabaseClient
      .from('reviews')
      .select('rating')
      .eq('is_visible', true)

    if (productId) {
      query = query.eq('product_id', productId)
    } else if (storeId) {
      query = query.eq('store_id', storeId)
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('Erro ao buscar reviews para stats:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({
        stats: {
          totalReviews: 0,
          averageRating: 0,
          distribution: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
          },
          percentages: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
          }
        }
      })
    }

    // Calcular estatísticas
    const totalReviews = reviews.length
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = Number((totalRating / totalReviews).toFixed(1))

    // Calcular distribuição por rating
    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    }

    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++
    })

    // Calcular percentuais
    const percentages = {
      1: Number(((distribution[1] / totalReviews) * 100).toFixed(1)),
      2: Number(((distribution[2] / totalReviews) * 100).toFixed(1)),
      3: Number(((distribution[3] / totalReviews) * 100).toFixed(1)),
      4: Number(((distribution[4] / totalReviews) * 100).toFixed(1)),
      5: Number(((distribution[5] / totalReviews) * 100).toFixed(1))
    }

    return NextResponse.json({
      stats: {
        totalReviews,
        averageRating,
        distribution,
        percentages
      }
    })

  } catch (error) {
    console.error('Erro na API de stats:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}