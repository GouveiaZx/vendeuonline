import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type BucketType = 'product-images' | 'store-images' | 'user-avatars';

interface UploadOptions {
  bucket: BucketType;
  folder?: string;
  maxSizeInMB?: number;
  allowedTypes?: string[];
}

interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (
    file: File,
    options: UploadOptions
  ): Promise<UploadResult | null> => {
    const {
      bucket,
      folder = '',
      maxSizeInMB = 5,
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    } = options;

    try {
      setUploading(true);
      setProgress(0);

      // Validar tipo de arquivo
      if (!allowedTypes.includes(file.type)) {
        const error = `Tipo de arquivo não permitido. Use: ${allowedTypes.join(', ')}`;
        toast.error(error);
        return { url: '', path: '', error };
      }

      // Validar tamanho do arquivo
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        const error = `Arquivo muito grande. Tamanho máximo: ${maxSizeInMB}MB`;
        toast.error(error);
        return { url: '', path: '', error };
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      setProgress(25);

      // Upload do arquivo
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erro no upload:', error);
        toast.error('Erro ao fazer upload da imagem');
        return { url: '', path: '', error: error.message };
      }

      setProgress(75);

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setProgress(100);
      toast.success('Imagem enviada com sucesso!');

      return {
        url: urlData.publicUrl,
        path: data.path,
      };

    } catch (error) {
      console.error('Erro no upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao fazer upload da imagem');
      return { url: '', path: '', error: errorMessage };
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteImage = async (
    path: string,
    bucket: BucketType
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Erro ao deletar imagem:', error);
        toast.error('Erro ao deletar imagem');
        return false;
      }

      toast.success('Imagem deletada com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      toast.error('Erro ao deletar imagem');
      return false;
    }
  };

  const getImageUrl = (path: string, bucket: BucketType): string => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  };

  return {
    uploadImage,
    deleteImage,
    getImageUrl,
    uploading,
    progress