import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Cliente Supabase para o frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para Storage
export interface UploadResult {
  data: {
    path: string;
    fullPath: string;
    publicUrl: string;
  } | null;
  error: Error | null;
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
      return { data: null, error };
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      data: {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl: publicUrlData.publicUrl
      },
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Upload failed')
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

// Função para validar tipo de arquivo
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

// Função para validar tamanho do arquivo
export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}