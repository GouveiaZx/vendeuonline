import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadFile, validateFileType, validateFileSize, STORAGE_BUCKETS } from '@/lib/supabase';
import { toast } from 'sonner';

interface ImageUploaderProps {
  bucket: keyof typeof STORAGE_BUCKETS;
  onUpload: (url: string, path: string) => void;
  onRemove?: () => void;
  currentImage?: string;
  maxSizeInMB?: number;
  allowedTypes?: string[];
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  bucket,
  onUpload,
  onRemove,
  currentImage,
  maxSizeInMB = 10,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = '',
  disabled = false,
  placeholder = 'Clique ou arraste uma imagem aqui'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileValidation = useCallback((file: File): boolean => {
    if (!validateFileType(file, allowedTypes)) {
      toast.error(`Tipo de arquivo não permitido. Use: ${allowedTypes.join(', ')}`);
      return false;
    }

    if (!validateFileSize(file, maxSizeInMB)) {
      toast.error(`Arquivo muito grande. Tamanho máximo: ${maxSizeInMB}MB`);
      return false;
    }

    return true;
  }, [allowedTypes, maxSizeInMB]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!handleFileValidation(file)) return;

    setIsUploading(true);
    
    try {
      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop();
      const fileName = `${timestamp}-${randomString}.${extension}`;
      const filePath = `${bucket}/${fileName}`;

      // Fazer upload
      const result = await uploadFile(STORAGE_BUCKETS[bucket.toUpperCase() as keyof typeof STORAGE_BUCKETS], filePath, file);
      
      if (result.error) {
        throw result.error;
      }

      if (result.data) {
        setPreview(result.data.publicUrl);
        onUpload(result.data.publicUrl, result.data.path);
        toast.success('Imagem enviada com sucesso!');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  }, [bucket, handleFileValidation, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [disabled, isUploading, handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled, isUploading]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    if (onRemove) {
      onRemove();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onRemove]);

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
          />
          {!disabled && (
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
              <button
                onClick={handleRemove}
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                disabled={isUploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            w-full h-48 border-2 border-dashed rounded-lg
            flex flex-col items-center justify-center
            transition-all duration-200 cursor-pointer
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled || isUploading 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-gray-50'
            }
          `}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
              <p className="text-sm text-gray-600">Enviando imagem...</p>
            </>
          ) : (
            <>
              {isDragging ? (
                <Upload className="w-8 h-8 text-blue-500 mb-2" />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
              )}
              <p className="text-sm text-gray-600 text-center px-4">
                {isDragging ? 'Solte a imagem aqui' : placeholder}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Máximo {maxSizeInMB}MB • {allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;