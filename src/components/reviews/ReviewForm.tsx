import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StarRating } from '@/components/reviews/StarRating'
import { useReviewStore, type Review, type CreateReviewData, type UpdateReviewData } from '@/store/reviewStore'
import { toast } from 'sonner'
import { Loader2, X } from 'lucide-react'

interface ReviewFormProps {
  productId?: string
  storeId?: string
  orderId?: string
  existingReview?: Review
  onSuccess?: (review: Review) => void
  onCancel?: () => void
  className?: string
}

export function ReviewForm({
  productId,
  storeId,
  orderId,
  existingReview,
  onSuccess,
  onCancel,
  className
}: ReviewFormProps) {
  const { createReview, updateReview, loading, error, clearError } = useReviewStore()
  
  const [formData, setFormData] = useState({
    rating: existingReview?.rating || 0,
    title: existingReview?.title || '',
    comment: existingReview?.comment || ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const isEditing = !!existingReview

  useEffect(() => {
    if (error) {
      toast.error(error)
      clearError()
    }
  }, [error, clearError])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (formData.rating === 0) {
      newErrors.rating = 'Por favor, selecione uma avaliação'
    }
    
    if (formData.comment.trim().length < 10) {
      newErrors.comment = 'O comentário deve ter pelo menos 10 caracteres'
    }
    
    if (formData.comment.trim().length > 1000) {
      newErrors.comment = 'O comentário deve ter no máximo 1000 caracteres'
    }
    
    if (formData.title && formData.title.trim().length > 100) {
      newErrors.title = 'O título deve ter no máximo 100 caracteres'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      let result: Review | null = null
      
      if (isEditing && existingReview) {
        const updateData: UpdateReviewData = {
          rating: formData.rating,
          title: formData.title.trim() || undefined,
          comment: formData.comment.trim()
        }
        result = await updateReview(existingReview.id, updateData)
      } else {
        const createData: CreateReviewData = {
          productId,
          storeId,
          orderId,
          rating: formData.rating,
          title: formData.title.trim() || undefined,
          comment: formData.comment.trim()
        }
        result = await createReview(createData)
      }

      if (result) {
        toast.success(
          isEditing 
            ? 'Avaliação atualizada com sucesso!' 
            : 'Avaliação criada com sucesso!'
        )
        onSuccess?.(result)
      }
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error)
      toast.error('Erro ao salvar avaliação')
    }
  }

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }))
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: '' }))
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">
          {isEditing ? 'Editar Avaliação' : 'Escrever Avaliação'}
        </CardTitle>
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Avaliação *</Label>
            <div className="flex items-center gap-2">
              <StarRating
                rating={formData.rating}
                interactive
                size="lg"
                onRatingChange={handleRatingChange}
              />
              {formData.rating > 0 && (
                <span className="text-sm text-gray-600">
                  {formData.rating} de 5 estrelas
                </span>
              )}
            </div>
            {errors.rating && (
              <p className="text-sm text-red-600">{errors.rating}</p>
            )}
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título (opcional)</Label>
            <Input
              id="title"
              placeholder="Resumo da sua experiência"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              maxLength={100}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title}</p>
            )}
            <p className="text-xs text-gray-500">
              {formData.title.length}/100 caracteres
            </p>
          </div>

          {/* Comentário */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comentário *</Label>
            <Textarea
              id="comment"
              placeholder="Conte sobre sua experiência com este produto/loja..."
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              rows={4}
              maxLength={1000}
            />
            {errors.comment && (
              <p className="text-sm text-red-600">{errors.comment}</p>
            )}
            <p className="text-xs text-gray-500">
              {formData.comment.length}/1000 caracteres
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Atualizar Avaliação' : 'Publicar Avaliação'}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Componente simplificado para avaliação rápida
interface QuickReviewProps {
  productId?: string
  storeId?: string
  onReviewSubmitted?: () => void
  className?: string
}

export function QuickReview({ 
  productId, 
  storeId, 
  onReviewSubmitted,
  className 
}: QuickReviewProps) {
  const { createReview, loading } = useReviewStore()
  const [rating, setRating] = useState(0)
  const [showFullForm, setShowFullForm] = useState(false)

  const handleQuickRating = async (selectedRating: number) => {
    setRating(selectedRating)
    
    // Se for 4 ou 5 estrelas, criar review rápido
    if (selectedRating >= 4) {
      try {
        const result = await createReview({
          productId,
          storeId,
          rating: selectedRating,
          comment: 'Avaliação rápida'
        })
        
        if (result) {
          toast.success('Obrigado pela sua avaliação!')
          onReviewSubmitted?.()
        }
      } catch (error) {
        console.error('Erro ao criar avaliação rápida:', error)
        setShowFullForm(true)
      }
    } else {
      // Para 1-3 estrelas, mostrar formulário completo
      setShowFullForm(true)
    }
  }

  if (showFullForm) {
    return (
      <ReviewForm
        productId={productId}
        storeId={storeId}
        onSuccess={() => {
          setShowFullForm(false)
          setRating(0)
          onReviewSubmitted?.()
        }}
        onCancel={() => {
          setShowFullForm(false)
          setRating(0)
        }}
        className={className}
      />
    )
  }

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <h3 className="font-medium">Como você avalia este produto?</h3>
          <StarRating
            rating={rating}
            interactive
            size="lg"
            onRatingChange={handleQuickRating}
            className="justify-center"
          />
          <p className="text-sm text-gray-500">
            Clique nas estrelas para avaliar
          </p>
          
          {rating > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullForm(true)}
              disabled={loading}
            >
              Adicionar comentário
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}