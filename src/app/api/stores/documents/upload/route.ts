import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const storeId = formData.get('storeId') as string;
    const documentType = formData.get('documentType') as string;

    if (!file || !storeId || !documentType) {
      return NextResponse.json(
        { error: 'Arquivo, ID da loja e tipo de documento são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a loja existe
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o tipo de documento é válido
    const { data: requiredDoc, error: docError } = await supabase
      .from('required_documents')
      .select('*')
      .eq('document_type', documentType)
      .single();

    if (docError || !requiredDoc) {
      return NextResponse.json(
        { error: 'Tipo de documento inválido' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!requiredDoc.file_types.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Tipo de arquivo não permitido. Tipos aceitos: ${requiredDoc.file_types.join(', ')}` },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo
    if (file.size > requiredDoc.max_file_size) {
      const maxSizeMB = requiredDoc.max_file_size / (1024 * 1024);
      return NextResponse.json(
        { error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Gerar nome único para o arquivo
    const fileId = uuidv4();
    const fileName = `${fileId}_${file.name}`;
    const filePath = `stores/${storeId}/documents/${fileName}`;

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      return NextResponse.json(
        { error: 'Erro ao fazer upload do arquivo' },
        { status: 500 }
      );
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Remover documento anterior do mesmo tipo (se existir)
    const { data: existingDoc } = await supabase
      .from('stores')
      .select('documents')
      .eq('id', storeId)
      .single();

    const currentDocuments = existingDoc?.documents || {};
    
    // Se já existe um documento deste tipo, remover o arquivo antigo
    if (currentDocuments[documentType]) {
      const oldFilePath = currentDocuments[documentType].file_path;
      if (oldFilePath) {
        await supabase.storage
          .from('documents')
          .remove([oldFilePath]);
      }
    }

    // Atualizar documentos da loja
    currentDocuments[documentType] = {
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_path: filePath,
      uploaded_at: new Date().toISOString(),
      file_size: file.size,
      file_type: file.type
    };

    const { error: updateError } = await supabase
      .from('stores')
      .update({ 
        documents: currentDocuments,
        last_status_change: new Date().toISOString()
      })
      .eq('id', storeId);

    if (updateError) {
      console.error('Erro ao atualizar documentos:', updateError);
      // Remover arquivo do storage se falhou ao atualizar o banco
      await supabase.storage
        .from('documents')
        .remove([filePath]);
      
      return NextResponse.json(
        { error: 'Erro ao salvar informações do documento' },
        { status: 500 }
      );
    }

    // Retornar informações do documento
    const documentInfo = {
      document_type: documentType,
      file_name: file.name,
      file_url: urlData.publicUrl,
      uploaded_at: new Date().toISOString(),
      file_size: file.size
    };

    return NextResponse.json({
      message: 'Documento enviado com sucesso',
      document: documentInfo
    });

  } catch (error) {
    console.error('Erro no upload de documento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}