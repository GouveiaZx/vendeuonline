import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// POST /api/reviews/[id]/vote - Votar em review
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: reviewId } = await params;
    const supabaseClient = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    const body = await request.json()
    const { voteType } = body

    // Validação
    if (!voteType || !['helpful', 'not_helpful'].includes(voteType)) {
      return NextResponse.json(
        { error: 'Tipo de voto inválido' },
        { status: 400 }
      )
    }

    // Verificar se o review existe
    const { data: review, error: reviewError } = await supabaseClient
      .from('reviews')
      .select('id, userId')
      .eq('id', reviewId)
      .single()

    if (reviewError) {
      if (reviewError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Review não encontrado' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar review:', reviewError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Não permitir votar no próprio review
    if (review.userId === user.id) {
      return NextResponse.json(
        { error: 'Não é possível votar no próprio review' },
        { status: 400 }
      )
    }

    // Verificar se já votou
    const { data: existingVote, error: voteError } = await supabaseClient
      .from('review_votes')
      .select('id, voteType')
      .eq('reviewId', reviewId)
      .eq('userId', user.id)
      .single()

    if (voteError && voteError.code !== 'PGRST116') {
      console.error('Erro ao buscar voto existente:', voteError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    let voteResult
    
    if (existingVote) {
      // Se já votou, atualizar o voto
      if (existingVote.voteType === voteType) {
        // Se é o mesmo voto, remover
        const { error: deleteError } = await supabaseClient
          .from('review_votes')
          .delete()
          .eq('id', existingVote.id)

        if (deleteError) {
          console.error('Erro ao remover voto:', deleteError)
          return NextResponse.json(
            { error: 'Erro ao remover voto' },
            { status: 500 }
          )
        }
        
        voteResult = { action: 'removed', voteType: null }
      } else {
        // Se é voto diferente, atualizar
        const { error: updateError } = await supabaseClient
          .from('review_votes')
          .update({ voteType })
          .eq('id', existingVote.id)

        if (updateError) {
          console.error('Erro ao atualizar voto:', updateError)
          return NextResponse.json(
            { error: 'Erro ao atualizar voto' },
            { status: 500 }
          )
        }
        
        voteResult = { action: 'updated', voteType }
      }
    } else {
      // Criar novo voto
      const { error: insertError } = await supabaseClient
        .from('review_votes')
        .insert([{
          reviewId,
          userId: user.id,
          voteType
        }])

      if (insertError) {
        console.error('Erro ao criar voto:', insertError)
        return NextResponse.json(
          { error: 'Erro ao criar voto' },
          { status: 500 }
        )
      }
      
      voteResult = { action: 'created', voteType }
    }

    // Atualizar contador de helpful no review
    const { data: votes, error: countError } = await supabaseClient
      .from('review_votes')
      .select('voteType')
      .eq('reviewId', reviewId)

    if (countError) {
      console.error('Erro ao contar votos:', countError)
      return NextResponse.json(
        { error: 'Erro ao atualizar contador' },
        { status: 500 }
      )
    }

    const helpfulCount = votes?.filter(vote => vote.voteType === 'helpful').length || 0

    const { error: updateCountError } = await supabaseClient
      .from('reviews')
      .update({ helpfulCount })
      .eq('id', reviewId)

    if (updateCountError) {
      console.error('Erro ao atualizar contador de helpful:', updateCountError)
      return NextResponse.json(
        { error: 'Erro ao atualizar contador' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      vote: voteResult,
      helpfulCount
    })

  } catch (error) {
    console.error('Erro na API de voto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET /api/reviews/[id]/vote - Buscar voto do usuário
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: reviewId } = await params;
    const supabaseClient = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { data: vote, error } = await supabaseClient
      .from('review_votes')
      .select('voteType')
      .eq('reviewId', reviewId)
      .eq('userId', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar voto:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      vote: vote?.voteType || null
    })

  } catch (error) {
    console.error('Erro na API de voto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}