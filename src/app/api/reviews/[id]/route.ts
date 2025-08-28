import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/reviews/[id] - Buscar review específico
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: review, error } = await supabaseClient
      .from('reviews')
      .select(`
        *,
        user:users!reviews_userId_fkey(
          id,
          name,
          avatar
        )
      `)
      .eq('id', id)
      .eq('is_visible', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Review não encontrado' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar review:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    return NextResponse.json({ review })

  } catch (error) {
    console.error('Erro na API de review:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/reviews/[id] - Atualizar review
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { id } = await params;
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    const body = await request.json()
    const { rating, title, comment, isVisible } = body

    // Buscar review existente
    const { data: existingReview, error: fetchError } = await supabaseClient
      .from('reviews')
      .select('user_id, is_visible')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Review não encontrado' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar review:', fetchError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Verificar se o usuário é o dono do review
    if (existingReview.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Não autorizado a editar este review' },
        { status: 403 }
      )
    }

    // Validação
    const updateData: any = {}
    
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating deve ser entre 1 e 5' },
          { status: 400 }
        )
      }
      updateData.rating = rating
    }

    if (title !== undefined) {
      if (title && title.trim().length > 100) {
        return NextResponse.json(
          { error: 'Título deve ter no máximo 100 caracteres' },
          { status: 400 }
        )
      }
      updateData.title = title?.trim() || null
    }

    if (comment !== undefined) {
      if (!comment || comment.trim().length < 10) {
        return NextResponse.json(
          { error: 'Comentário deve ter pelo menos 10 caracteres' },
          { status: 400 }
        )
      }
      if (comment.trim().length > 1000) {
        return NextResponse.json(
          { error: 'Comentário deve ter no máximo 1000 caracteres' },
          { status: 400 }
        )
      }
      updateData.comment = comment.trim()
    }

    if (isVisible !== undefined) {
      updateData.is_visible = isVisible
    }

    // Atualizar review
    const { data: updatedReview, error: updateError } = await supabaseClient
      .from('reviews')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        user:users!reviews_userId_fkey(
          id,
          name,
          avatar
        )
      `)
      .single()

    if (updateError) {
      console.error('Erro ao atualizar review:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar review' },
        { status: 500 }
      )
    }

    return NextResponse.json({ review: updatedReview })

  } catch (error) {
    console.error('Erro na API de review:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews/[id] - Deletar review
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    )
    const { id } = await params;
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar review existente
    const { data: existingReview, error: fetchError } = await supabaseClient
      .from('reviews')
      .select('user_id, product_id, store_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Review não encontrado' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar review:', fetchError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Verificar se o usuário é o dono do review
    if (existingReview.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Não autorizado a deletar este review' },
        { status: 403 }
      )
    }

    // Deletar review
    const { error: deleteError } = await supabaseClient
      .from('reviews')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao deletar review:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao deletar review' },
        { status: 500 }
      )
    }

    // Atualização da média de rating é gerenciada por triggers no banco de dados.
    // Enviar notificação informando o vendedor sobre a remoção do review
    try {
      let storeId = existingReview.store_id as string | undefined

      // Caso seja review de produto, obter storeId a partir do produto
      if (!storeId && existingReview.product_id) {
        const { data: product, error: productError } = await supabaseClient
          .from('products')
          .select('store_id')
          .eq('id', existingReview.product_id)
          .single()

        if (productError) {
          console.error('Erro ao buscar produto para notificação:', productError)
        } else {
          storeId = product?.store_id as string | undefined
        }
      }

      if (storeId) {
        const { data: store, error: storeError } = await supabaseClient
          .from('stores')
          .select('user_id')
          .eq('id', storeId)
          .single()

        if (storeError) {
          console.error('Erro ao buscar loja para notificação:', storeError)
        } else if (store?.user_id) {
          await supabaseClient.from('notifications').insert([
            {
              user_id: store.user_id,
              type: 'REVIEW_DELETED',
              title: 'Review removido',
              message: 'Um review foi removido de um dos seus produtos/loja.',
              data: {
                review_id: id,
                store_id: storeId,
                product_id: existingReview.product_id || null
              }
            }
          ])
        }
      }
    } catch (notifyError) {
      console.error('Erro ao enviar notificação de review deletado:', notifyError)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro na API de review:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}