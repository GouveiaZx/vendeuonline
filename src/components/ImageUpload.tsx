import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useImageUpload, BucketType } from '@/hooks/useImageUpload';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  bucket: BucketType;
  folder?: string;
  currentImage?: string;
  onImageUploaded: (url: string, path: string) => void;
  onImageRemoved?: () => void;
  maxSizeInMB?: number;
  allowedTypes?: string[];
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function ImageUpload({
  bucket,
  folder,
  currentImage,
  onImageUploaded,
  onImageRemoved,
  maxSizeInMB = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  className,
  disabled = false,
  placeholder = 'Clique para fazer upload de uma imagem'
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { uploadImage, deleteImage, uploading, progress } = useImageUpload();

  const handleFileSelect = async (file: File) => {
    const result = await uploadImage(file, {
      bucket,
      folder,
      maxSizeInMB,
      allowedTypes
    });

    if (result && !result.error) {
      onImageUploaded(result.url, result.path);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemoveImage = async () => {
    if (onImageRemoved) {
      onImageRemoved();
    }
  };

  const openFileDialog = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {currentImage ? (
        <div className="relative group">
          <img
            src={currentImage}
            alt="Uploaded image"
            className="w-full h-48 object-cover rounded-lg border-2 border-dashed border-gray-300"
          />
          
          {!disabled && (
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={openFileDialog}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Alterar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRemoveImage}
                  disabled={uploading}
                >
                  <X className="w-4 h-4 mr-1" />
                  Remover
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors',
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          onClick={openFileDialog}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 w-full px-4">
              <ImageIcon className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-600">Enviando imagem...</p>
              <Progress value={progress} className="w-full max-w-xs" />
              <p className="text-xs text-gray-500">{progress}%</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-600 text-center px-4">
                {placeholder}
              </p>
              <p className="text-xs text-gray-500">
                Arraste e solte ou clique para selecionar
              </p>
              <p className="text-xs text-gray-400">
                Máximo {maxSizeInMB}MB • {allowedTypes.map(type => type.split('/')[1]).join(', ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}