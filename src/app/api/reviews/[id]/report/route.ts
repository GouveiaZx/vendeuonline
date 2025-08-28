import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// POST /api/reviews/[id]/report - Reportar review
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
    const { reason, description } = body

    // Validação
    const validReasons = [
      'spam',
      'inappropriate_language',
      'fake_review',
      'off_topic',
      'personal_information',
      'other'
    ]

    if (!reason || !validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Motivo do report inválido' },
        { status: 400 }
      )
    }

    if (reason === 'other' && (!description || description.trim().length < 10)) {
      return NextResponse.json(
        { error: 'Descrição é obrigatória para motivo "outro"' },
        { status: 400 }
      )
    }

    if (description && description.trim().length > 500) {
      return NextResponse.json(
        { error: 'Descrição deve ter no máximo 500 caracteres' },
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

    // Não permitir reportar o próprio review
    if (review.userId === user.id) {
      return NextResponse.json(
        { error: 'Não é possível reportar o próprio review' },
        { status: 400 }
      )
    }

    // Verificar se já reportou este review
    const { data: existingReport, error: reportError } = await supabaseClient
      .from('review_reports')
      .select('id')
      .eq('reviewId', reviewId)
      .eq('reportedBy', user.id)
      .single()

    if (reportError && reportError.code !== 'PGRST116') {
      console.error('Erro ao buscar report existente:', reportError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (existingReport) {
      return NextResponse.json(
        { error: 'Você já reportou este review' },
        { status: 400 }
      )
    }

    // Criar report
    const { data: newReport, error: insertError } = await supabaseClient
      .from('review_reports')
      .insert([{
        reviewId,
        reportedBy: user.id,
        reason,
        description: description?.trim() || null,
        status: 'pending'
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar report:', insertError)
      return NextResponse.json(
        { error: 'Erro ao criar report' },
        { status: 500 }
      )
    }

    // Contar total de reports para este review
    const { data: reports, error: countError } = await supabaseClient
      .from('review_reports')
      .select('id')
      .eq('reviewId', reviewId)
      .eq('status', 'pending')

    if (countError) {
      console.error('Erro ao contar reports:', countError)
    } else {
      const reportCount = reports?.length || 0
      
      // Se tem muitos reports, marcar review como suspeito
      if (reportCount >= 3) {
        const { error: updateError } = await supabaseClient
          .from('reviews')
          .update({ 
            isVisible: false,
            moderationStatus: 'under_review'
          })
          .eq('id', reviewId)

        if (updateError) {
          console.error('Erro ao atualizar status do review:', updateError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Report enviado com sucesso'
    })

  } catch (error) {
    console.error('Erro na API de report:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}