import React, { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { uploadImage, deleteImage, resizeImage } from '@/lib/supabase'
import { validateImageFile } from '@/utils/validators'
import type { UploadResult } from '@/lib/supabase'

interface ImageUploadProps {
  bucket: 'products' | 'stores' | 'avatars' | 'banners'
  folder?: string
  currentImageUrl?: string
  onImageChange: (imageUrl: string, imagePath?: string) => void
  onError?: (error: string) => void
  className?: string
  maxWidth?: number
  maxHeight?: number
  quality?: number
  multiple?: boolean
  maxFiles?: number
}

export interface UploadedImage {
  url: string
  path: string
  file: File
}

export default function ImageUpload({
  bucket,
  folder,
  currentImageUrl,
  onImageChange,
  onError,
  className = '',
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8,
  multiple = false,
  maxFiles = 5
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Inicializar com imagem atual se fornecida
  React.useEffect(() => {
    if (currentImageUrl && uploadedImages.length === 0) {
      setUploadedImages([{
        url: currentImageUrl,
        path: '',
        file: new File([], 'current-image')
      }])
    }
  }, [currentImageUrl])

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    
    if (multiple) {
      if (uploadedImages.length + fileArray.length > maxFiles) {
        onError?.(`Máximo de ${maxFiles} imagens permitidas`)
        return
      }
    } else {
      if (fileArray.length > 1) {
        onError?.('Apenas uma imagem é permitida')
        return
      }
    }

    fileArray.forEach(file => processFile(file))
  }

  const processFile = async (file: File) => {
    // Validar arquivo
    const validation = validateImageFile(file)
    if (!validation.valid) {
      onError?.(validation.error || 'Arquivo inválido')
      return
    }

    setIsUploading(true)

    try {
      // Redimensionar imagem se necessário
      const resizedFile = await resizeImage(file, maxWidth, quality)
      
      // Fazer upload
      const result: UploadResult = await uploadImage(resizedFile, bucket, folder)
      
      if (result.error) {
        onError?.(result.error || 'Erro desconhecido')
        return
      }

      const newImage: UploadedImage = {
        url: result.url,
        path: result.path,
        file: resizedFile
      }

      if (multiple) {
        setUploadedImages(prev => [...prev, newImage])
        onImageChange(result.url, result.path)
      } else {
        // Remover imagem anterior se existir
        if (uploadedImages.length > 0 && uploadedImages[0].path) {
          await deleteImage(bucket, uploadedImages[0].path)
        }
        setUploadedImages([newImage])
        onImageChange(result.url, result.path)
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      onError?.('Erro ao fazer upload da imagem')
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = async (index: number) => {
    const image = uploadedImages[index]
    
    if (image.path) {
      try {
        await deleteImage(bucket, image.path)
      } catch (error) {
        console.error('Erro ao deletar imagem:', error)
      }
    }

    const newImages = uploadedImages.filter((_, i) => i !== index)
    setUploadedImages(newImages)
    
    if (multiple) {
      // Para múltiplas imagens, notificar sobre a remoção
      onImageChange('', image.path)
    } else {
      // Para imagem única, limpar
      onImageChange('')
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Área de upload */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-600">Fazendo upload...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Clique para selecionar {multiple ? 'imagens' : 'uma imagem'}
              </p>
              <p className="text-xs text-gray-500">
                ou arraste e solte aqui
              </p>
            </div>
            <p className="text-xs text-gray-400">
              JPEG, PNG, WebP até 5MB
              {multiple && ` (máx. ${maxFiles} imagens)`}
            </p>
          </div>
        )}
      </div>

      {/* Preview das imagens */}
      {uploadedImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            {multiple ? 'Imagens selecionadas:' : 'Imagem selecionada:'}
          </h4>
          <div className={`grid gap-4 ${
            multiple ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'
          }`}>
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {image.url ? (
                    <img
                      src={image.url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(index)
                  }}
                  className="
                    absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full
                    flex items-center justify-center opacity-0 group-hover:opacity-100
                    transition-opacity duration-200 hover:bg-red-600
                  "
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
