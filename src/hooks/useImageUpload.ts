import { useState } from 'react';
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

      setProgress(25);

      // Preparar FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      if (folder) {
        formData.append('folder', folder);
      }

      setProgress(50);

      // Fazer upload via API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro no upload');
      }

      setProgress(100);
      toast.success('Imagem enviada com sucesso!');

      return {
        url: result.data.publicUrl,
        path: result.data.path,
      };

    } catch (error) {
      console.error('Erro no upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(errorMessage);
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
      const response = await fetch(`/api/upload?path=${encodeURIComponent(path)}&bucket=${bucket}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao deletar imagem');
      }

      toast.success('Imagem deletada com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar imagem';
      toast.error(errorMessage);
      return false;
    }
  };

  const getImageUrl = (path: string, bucket: BucketType): string => {
    // Para URLs já completas, retornar como está
    if (path.startsWith('http')) {
      return path;
    }
    
    // Para paths relativos, construir URL do Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  };

  return {
    uploadImage,
    deleteImage,
    getImageUrl,
    uploading,
    progress
  };
}