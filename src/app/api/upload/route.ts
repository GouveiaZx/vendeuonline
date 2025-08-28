import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { getUserFromToken } from '@/lib/auth';
import { uploadRateLimiter, createRateLimitHeaders } from '@/lib/rateLimiting';

// Configurações de upload
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Função para validar arquivo
function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.'
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Arquivo muito grande. Tamanho máximo: 10MB.'
    };
  }

  return { valid: true };
}

// Função para gerar nome único do arquivo
function generateFileName(originalName: string, folder?: string): string {
  const extension = originalName.split('.').pop();
  const uniqueId = uuidv4();
  const timestamp = Date.now();
  const fileName = `${timestamp}-${uniqueId}.${extension}`;
  
  return folder ? `${folder}/${fileName}` : fileName;
}

// POST - Upload de arquivo (com autenticação)
export async function POST(request: NextRequest) {
  try {
    // Verificar rate limiting
    const rateLimitResult = await uploadRateLimiter.isAllowed(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many upload attempts. Try again later.' },
        { 
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult, 10)
        }
      );
    }

    // Verificar autenticação
    const authResult = await getUserFromToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const folder = formData.get('folder') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo fornecido' },
        { status: 400 }
      );
    }

    if (!bucket) {
      return NextResponse.json(
        { error: 'Bucket não especificado' },
        { status: 400 }
      );
    }

    // Validar arquivo
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Gerar nome único para o arquivo
    const fileName = generateFileName(file.name, folder);

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, uint8Array, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erro no upload:', error);
      return NextResponse.json(
        { error: 'Erro ao fazer upload do arquivo' },
        { status: 500 }
      );
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      data: {
        path: data.path,
        publicUrl: urlData.publicUrl,
        fileName: file.name,
        size: file.size,
        type: file.type
      }
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover arquivo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const bucket = searchParams.get('bucket');

    if (!path || !bucket) {
      return NextResponse.json(
        { error: 'Path e bucket são obrigatórios' },
        { status: 400 }
      );
    }

    // Remover arquivo do Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Erro ao deletar arquivo:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar arquivo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Arquivo deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}