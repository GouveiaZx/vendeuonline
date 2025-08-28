/**
 * CONFIGURAÇÃO SUPABASE CONSOLIDADA
 * 
 * Esta é a única configuração de clientes Supabase do projeto.
 * Exporta diferentes clientes para diferentes contextos:
 * - supabase: Cliente público para frontend (anon key)
 * - supabaseServer: Cliente servidor com service role
 * 
 * Todas as funcionalidades de storage e upload estão centralizadas aqui.
 */

import { createClient } from '@supabase/supabase-js';
import { validateFileType, validateFileSize } from '@/utils/validators';
import type { Database } from './supabase-types';

// Validação de variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

// ============================================================================
// CLIENTES SUPABASE
// ============================================================================

// Cliente público para frontend (usa anon key)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    headers: {
      'X-Client-Info': 'vendeu-online-client'
    }
  }
});

// Cliente servidor para API routes (usa service role key)
export const supabaseServer = supabaseServiceKey ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'X-Client-Info': 'vendeu-online-server'
    }
  }
}) : null;

// Tipos para Storage
export interface UploadResult {
  url: string;
  path: string;
  error?: string;
  data?: {
    path: string;
    fullPath: string;
    publicUrl: string;
  };
}

// Configurações de storage
export const STORAGE_BUCKETS = {
  PRODUCTS: 'products',
  STORES: 'stores', 
  AVATARS: 'avatars',
  BANNERS: 'banners'
} as const;

// Função para fazer upload de arquivo
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<UploadResult> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      return { 
        url: '', 
        path: '', 
        error: error.message
      };
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: publicUrlData.publicUrl,
      path: data.path,
      data: {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl: publicUrlData.publicUrl
      }
    };
  } catch (error) {
    return {
      url: '',
      path: '',
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

// Função para deletar arquivo
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    return { error };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Delete failed')
    };
  }
}

// Função para obter URL pública
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

// Função para gerar nome único de arquivo
export function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
}

// Re-exportar funções de validação consolidadas
export { validateFileType, validateFileSize } from '../utils/validators';

// Funções de upload de imagem

export async function uploadImage(file: File, bucket: string, path?: string): Promise<UploadResult> {
  try {
    if (!supabaseServer) {
      throw new Error('Supabase server not initialized');
    }

    const fileName = generateFileName(file.name);
    const filePath = path ? `${path}/${fileName}` : fileName;
    
    const { data, error } = await supabaseServer.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) throw error;

    const url = getPublicUrl(bucket, data.path);
    return { url, path: data.path };
  } catch (error) {
    return { url: '', path: '', error: (error as Error).message };
  }
}

export async function deleteImage(bucket: string, path: string): Promise<{ error?: string }> {
  try {
    if (!supabaseServer) {
      throw new Error('Supabase server not initialized');
    }

    const { error } = await supabaseServer.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return {};
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function resizeImage(file: File, maxWidth: number, quality: number = 0.8): Promise<File> {
  // Para o momento, retornar o arquivo original
  // Implementação completa de resize seria feita com Canvas API ou biblioteca específica
  return file;
}