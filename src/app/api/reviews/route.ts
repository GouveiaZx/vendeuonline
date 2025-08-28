import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Palavras proibidas para filtro automático
const PROHIBITED_WORDS = [
  'spam', 'fake', 'scam', 'hate', 'discrimination', 'abuse', 'violence'
];

// Função para detectar conteúdo inapropriado
function detectInappropriateContent(text: string): {
  hasProhibitedWords: boolean;
  severity: 'low' | 'medium' | 'high';
  flags: string[];
} {
  const lowerText = text.toLowerCase();
  const flags: string[] = [];
  
  // Verificar palavras proibidas
  PROHIBITED_WORDS.forEach(word => {
    if (lowerText.includes(word)) {
      flags.push(word);
    }
  });
  
  // Verificar caracteres repetidos excessivos (possível spam)
  const repeatedChars = /(.)\1{4,}/g;
  if (repeatedChars.test(text)) {
    flags.push('repeated_chars');
  }
  
  // Verificar comprimento suspeito (muito curto ou muito longo)
  if (text.length < 15 || text.length > 1000) {
    flags.push('suspicious_length');
  }
  
  // Verificar uso excessivo de caps lock
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5 && text.length > 10) {
    flags.push('excessive_caps');
  }
  
  const hasProhibitedWords = flags.some(flag => PROHIBITED_WORDS.includes(flag));
  const severity = flags.length === 0 ? 'low' : 
                 flags.length <= 2 ? 'medium' : 'high';
  
  return { hasProhibitedWords, severity, flags };
}

// GET /api/reviews - Listar reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const storeId = searchParams.get('storeId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const rating = searchParams.get('rating')
    const sortBy = searchParams.get('sortBy') || 'newest'
    const includeHidden = searchParams.get('includeHidden') === 'true'
    const moderationStatus = searchParams.get('moderationStatus')
    const search = searchParams.get('search')
    
    // Autenticação para moderadores
    const supabaseClient = createRouteHandlerClient({ cookies })
    let isModerator = false
    
    if (includeHidden || moderationStatus || search) {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
      if (!authError && user) {
        const { data: userRole } = await supabaseClient
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        isModerator = userRole?.role === 'admin' || userRole?.role === 'moderator'
        
        if (!isModerator && (includeHidden || moderationStatus || search)) {
          return new Response(
            JSON.stringify({ error: 'Permissão negada' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Validação
    if (!productId && !storeId && !isModerator) {
      return new Response(
        JSON.stringify({ error: 'productId ou storeId é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let query = supabase
      .from('reviews')
      .select(`
        *,
        user:users!reviews_userId_fkey(
          id,
          name,
          avatar
        )
      `)
    
    if (!isModerator) {
      query = query.eq('isVisible', true)
    }

    // Filtros
    if (productId) {
      query = query.eq('productId', productId)
    } else if (storeId) {
      query = query.eq('storeId', storeId)
    }

    if (rating) {
      query = query.eq('rating', parseInt(rating))
    }

    // Filtros de moderação
    if (isModerator) {
      if (moderationStatus) {
        query = query.eq('moderationStatus', moderationStatus)
      }
      
      if (search) {
        // Usar textSearch do Supabase para busca segura ao invés de ilike manual
        query = query.textSearch('title', search, { type: 'websearch' })
          .or(`comment.fts.${search}`)
      }
    }

    // Ordenação
    switch (sortBy) {
      case 'oldest':
        query = query.order('createdAt', { ascending: true })
        break
      case 'rating_high':
        query = query.order('rating', { ascending: false })
        break
      case 'rating_low':
        query = query.order('rating', { ascending: true })
        break
      case 'helpful':
        query = query.order('helpfulCount', { ascending: false })
        break
      default: // newest
        query = query.order('createdAt', { ascending: false })
    }

    // Paginação
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: reviews, error, count } = await query

    if (error) {
      console.error('Erro ao buscar reviews:', error)
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Buscar estatísticas
    let statsQuery = supabase
      .from('reviews')
      .select('rating')
      .eq('isVisible', true)

    if (productId) {
      statsQuery = statsQuery.eq('productId', productId)
    } else if (storeId) {
      statsQuery = statsQuery.eq('storeId', storeId)
    }

    const { data: statsData } = await statsQuery
    
    const stats = statsData ? {
      totalReviews: statsData.length,
      averageRating: statsData.length > 0 
        ? Math.round((statsData.reduce((sum, r) => sum + r.rating, 0) / statsData.length) * 100) / 100
        : 0,
      ratingDistribution: {
        1: statsData.filter(r => r.rating === 1).length,
        2: statsData.filter(r => r.rating === 2).length,
        3: statsData.filter(r => r.rating === 3).length,
        4: statsData.filter(r => r.rating === 4).length,
        5: statsData.filter(r => r.rating === 5).length,
      }
    } : null

    return new Response(
      JSON.stringify({
        reviews: reviews || [],
        stats,
        pagination: {
          page,
          limit,
          total: count || 0,
          hasMore: (count || 0) > page * limit
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
      console.error('Erro na API de reviews:', error)
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

// POST /api/reviews - Criar review
export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await request.json()
    const { productId, storeId, orderId, rating, title, comment } = body

    // Validação
    if (!productId && !storeId) {
      return new Response(
        JSON.stringify({ error: 'productId ou storeId é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!rating || rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({ error: 'Rating deve ser entre 1 e 5' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!comment || comment.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Comentário deve ter pelo menos 10 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se o usuário já avaliou este produto/loja
    let existingQuery = supabaseClient
      .from('reviews')
      .select('id')
      .eq('userId', user.id)

    if (productId) {
      existingQuery = existingQuery.eq('productId', productId)
    } else {
      existingQuery = existingQuery.eq('storeId', storeId)
    }

    const { data: existing } = await existingQuery.single()
    
    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Você já avaliou este item' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se o produto/loja existe
    if (productId) {
      const { data: product } = await supabaseClient
        .from('Product')
        .select('id')
        .eq('id', productId)
        .single()
      
      if (!product) {
        return new Response(
          JSON.stringify({ error: 'Produto não encontrado' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    if (storeId) {
      const { data: store } = await supabaseClient
        .from('stores')
        .select('id')
        .eq('id', storeId)
        .single()
      
      if (!store) {
        return new Response(
          JSON.stringify({ error: 'Loja não encontrada' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Análise de moderação automática
    const contentAnalysis = detectInappropriateContent(comment + (title || ''));
    
    // Determinar status de moderação
    let moderationStatus = 'approved';
    let isVisible = true;
    
    if (contentAnalysis.severity === 'high') {
      moderationStatus = 'rejected';
      isVisible = false;
    } else if (contentAnalysis.severity === 'medium') {
      moderationStatus = 'pending';
      isVisible = false;
    }

    // Criar review com sistema de moderação
    const reviewData = {
      userId: user.id,
      productId: productId || null,
      storeId: storeId || null,
      orderId: orderId || null,
      rating,
      title: title?.trim() || null,
      comment: comment.trim(),
      isVerified: await verifyPurchase(user.id, productId, orderId),
      isVisible,
      moderationStatus,
      moderationFlags: contentAnalysis.flags,
      moderationNotes: contentAnalysis.severity !== 'low' ? 'Conteúdo sinalizado automaticamente' : null,
      helpfulCount: 0
    }

    const { data: review, error } = await supabaseClient
      .from('reviews')
      .insert([reviewData])
      .select(`
        *,
        user:users!reviews_userId_fkey(
          id,
          name,
          avatar
        )
      `)
      .single()

    if (error) {
      console.error('Erro ao criar review:', error)
      return new Response(
        JSON.stringify({ error: 'Erro ao criar avaliação' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Atualizar média de rating do produto
    if (review.product_id) {
      const { data: avgData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', review.product_id)
      
      if (avgData && avgData.length > 0) {
        const averageRating = avgData.reduce((sum, r) => sum + r.rating, 0) / avgData.length
        
        await supabase
          .from('products')
          .update({ 
            rating: Number(averageRating.toFixed(1)),
            review_count: avgData.length
          })
          .eq('id', review.product_id)
      }
    }

    // Atualizar média de rating da loja
    if (review.store_id) {
      const { data: avgData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('store_id', review.store_id)
      
      if (avgData && avgData.length > 0) {
        const averageRating = avgData.reduce((sum, r) => sum + r.rating, 0) / avgData.length
        
        await supabase
          .from('stores')
          .update({ 
            rating: Number(averageRating.toFixed(1)),
            review_count: avgData.length
          })
          .eq('id', review.store_id)
      }
    }

    // Criar notificação para o vendedor
    if (review?.id) {
      await createSellerNotification(productId, review.id)
    }

    return new Response(
      JSON.stringify({ review }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro na API de reviews:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// PUT /api/reviews/:id - Atualizar status de moderação (moderadores)
export async function PUT(request: NextRequest) {
  try {
    const supabaseClient = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se é moderador
    const { data: userRole } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'moderator'].includes(userRole?.role || '')) {
      return new Response(
        JSON.stringify({ error: 'Permissão negada' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(request.url)
    const reviewId = url.pathname.split('/').pop()
    const body = await request.json()
    const { moderationStatus, moderationNotes, isVisible } = body

    if (!reviewId) {
      return new Response(
        JSON.stringify({ error: 'ID da review é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!['approved', 'pending', 'rejected'].includes(moderationStatus)) {
      return new Response(
        JSON.stringify({ error: 'Status de moderação inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: review, error } = await supabaseClient
      .from('reviews')
      .update({
        moderationStatus,
        moderationNotes,
        isVisible: moderationStatus === 'approved',
        moderatedBy: user.id,
        moderatedAt: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar review:', error)
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar review' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ review }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro na API de reviews:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// DELETE /api/reviews/:id - Deletar review (moderadores ou autor)
export async function DELETE(request: NextRequest) {
  try {
    const supabaseClient = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(request.url)
    const reviewId = url.pathname.split('/').pop()

    if (!reviewId) {
      return new Response(
        JSON.stringify({ error: 'ID da review é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se é moderador ou autor
    const { data: userRole } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isModerator = ['admin', 'moderator'].includes(userRole?.role || '')

    if (!isModerator) {
      // Verificar se é o autor
      const { data: review } = await supabaseClient
        .from('reviews')
        .select('userId')
        .eq('id', reviewId)
        .single()

      if (!review || review.userId !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Permissão negada' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    const { error } = await supabaseClient
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) {
      console.error('Erro ao deletar review:', error)
      return new Response(
        JSON.stringify({ error: 'Erro ao deletar review' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro na API de reviews:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Verifica se o usuário realmente comprou o produto
 */
async function verifyPurchase(userId: string, productId: string, orderId?: string): Promise<boolean> {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query = supabaseClient
      .from('orders')
      .select(`
        id,
        order_items!inner(
          product_id
        )
      `)
      .eq('buyer_id', userId)
      .eq('order_items.product_id', productId)
      .in('status', ['DELIVERED', 'CONFIRMED'])

    // Se orderId foi fornecido, filtrar por ele também
    if (orderId) {
      query = query.eq('id', orderId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao verificar compra:', error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error('Erro na verificação de compra:', error)
    return false
  }
}

/**
 * Cria notificação para o vendedor sobre nova review
 */
async function createSellerNotification(productId: string, reviewId: string): Promise<void> {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar informações do produto e loja
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select(`
        name,
        store_id,
        stores!inner(
          seller_id
        )
      `)
      .eq('id', productId)
      .single()

    if (productError || !product) {
      console.error('Erro ao buscar produto para notificação:', productError)
      return
    }

    // Criar notificação
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: product.stores?.[0]?.seller_id,
        type: 'review_received',
        title: 'Nova avaliação recebida',
        message: `Seu produto "${product.name}" recebeu uma nova avaliação.`,
        metadata: {
          product_id: productId,
          review_id: reviewId,
          product_name: product.name
        },
        is_read: false
      })

    if (notificationError) {
      console.error('Erro ao criar notificação:', notificationError)
    }
  } catch (error) {
    console.error('Erro na criação de notificação:', error)
  }
}