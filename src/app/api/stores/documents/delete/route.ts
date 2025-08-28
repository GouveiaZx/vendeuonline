import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromToken } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await getUserFromToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;
    const { storeId, documentType } = await request.json();

    if (!storeId || !documentType) {
      return NextResponse.json(
        { error: 'ID da loja e tipo de documento são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a loja existe e obter documentos atuais
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, documents, seller_id')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem permissão para deletar documentos desta loja
    const isOwner = user.type === 'SELLER' && store.seller_id === user.id;
    const isAdmin = user.type === 'ADMIN';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Você não tem permissão para deletar documentos desta loja' },
        { status: 403 }
      );
    }

    const currentDocuments = store.documents || {};
    
    // Verificar se o documento existe
    if (!currentDocuments[documentType]) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    const documentInfo = currentDocuments[documentType];
    
    // Remover arquivo do Supabase Storage
    if (documentInfo.file_path) {
      const { error: deleteError } = await supabase.storage
        .from('documents')
        .remove([documentInfo.file_path]);

      if (deleteError) {
        // Log error apenas em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.error('Erro ao remover arquivo do storage:', deleteError);
        }
        // Continuar mesmo se houver erro no storage
      }
    }

    // Remover documento do objeto
    delete currentDocuments[documentType];

    // Atualizar documentos da loja
    const { error: updateError } = await supabase
      .from('stores')
      .update({ 
        documents: currentDocuments,
        last_status_change: new Date().toISOString()
      })
      .eq('id', storeId);

    if (updateError) {
      // Log error apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao atualizar documentos:', updateError);
      }
      return NextResponse.json(
        { error: 'Erro ao remover documento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Documento removido com sucesso'
    });

  } catch (error) {
    // Log error apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao deletar documento:', error);
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}