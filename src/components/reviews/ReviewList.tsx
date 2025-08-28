import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StarRating } from '@/components/reviews/StarRating'
import { useReviewStore, type Review } from '@/store/reviewStore'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Loader2,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

interface ReviewListProps {
  productId?: string
  storeId?: string
  showFilters?: boolean
  showUserActions?: boolean
  onEditReview?: (review: Review) => void
  className?: string
}

export function ReviewList({
  productId,
  storeId,
  showFilters = true,
  showUserActions = true,
  onEditReview,
  className
}: ReviewListProps) {
  const { user } = useAuthStore()
  const { 
    reviews, 
    loading, 
    fetchReviews, 
    deleteReview, 
    voteReview, 
    reportReview 
  } = useReviewStore()
  
  const [currentPage, setCurrentPage] = useState(1)
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful'>('newest')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  const itemsPerPage = 10

  useEffect(() => {
    loadReviews()
  }, [productId, storeId, currentPage, ratingFilter, sortBy])

  const loadReviews = async () => {
    await fetchReviews(productId, storeId, currentPage, itemsPerPage)
  }

  const handleVote = async (reviewId: string, voteType: 'helpful' | 'not_helpful') => {
    if (!user) {
      toast.error('Faça login para votar em avaliações')
      return
    }

    setActionLoading(`vote-${reviewId}`)
    try {
      const success = await voteReview(reviewId, voteType)
      if (success) {
        toast.success('Voto registrado!')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleReport = async (reviewId: string, reason: string) => {
    if (!user) {
      toast.error('Faça login para reportar avaliações')
      return
    }

    setActionLoading(`report-${reviewId}`)
    try {
      const success = await reportReview(reviewId, reason)
      if (success) {
        toast.success('Avaliação reportada. Obrigado pelo feedback!')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) {
      return
    }

    setActionLoading(`delete-${reviewId}`)
    try {
      const success = await deleteReview(reviewId)
      if (success) {
        toast.success('Avaliação excluída com sucesso!')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const filteredReviews = reviews.filter(review => {
    if (ratingFilter === 'all') return true
    return review.rating === parseInt(ratingFilter)
  })

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'rating_high':
        return b.rating - a.rating
      case 'rating_low':
        return a.rating - b.rating
      case 'helpful':
        return b.helpfulCount - a.helpfulCount
      default:
        return 0
    }
  })

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando avaliações...</span>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Filtros e Ordenação */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por nota" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as notas</SelectItem>
                <SelectItem value="5">5 estrelas</SelectItem>
                <SelectItem value="4">4 estrelas</SelectItem>
                <SelectItem value="3">3 estrelas</SelectItem>
                <SelectItem value="2">2 estrelas</SelectItem>
                <SelectItem value="1">1 estrela</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {sortBy.includes('asc') ? (
              <SortAsc className="h-4 w-4 text-gray-500" />
            ) : (
              <SortDesc className="h-4 w-4 text-gray-500" />
            )}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigas</SelectItem>
                <SelectItem value="rating_high">Maior nota</SelectItem>
                <SelectItem value="rating_low">Menor nota</SelectItem>
                <SelectItem value="helpful">Mais úteis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Lista de Reviews */}
      <div className="space-y-4">
        {sortedReviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">
                {ratingFilter === 'all' 
                  ? 'Nenhuma avaliação encontrada.' 
                  : `Nenhuma avaliação com ${ratingFilter} estrela${ratingFilter !== '1' ? 's' : ''} encontrada.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedReviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              currentUser={user}
              showUserActions={showUserActions}
              onVote={handleVote}
              onReport={handleReport}
              onEdit={onEditReview}
              onDelete={handleDelete}
              actionLoading={actionLoading}
            />
          ))
        )}
      </div>

      {/* Paginação */}
      {sortedReviews.length >= itemsPerPage && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Carregar mais avaliações
          </Button>
        </div>
      )}
    </div>
  )
}

// Componente para item individual de review
interface ReviewItemProps {
  review: Review
  currentUser: any
  showUserActions: boolean
  onVote: (reviewId: string, voteType: 'helpful' | 'not_helpful') => void
  onReport: (reviewId: string, reason: string) => void
  onEdit?: (review: Review) => void
  onDelete: (reviewId: string) => void
  actionLoading: string | null
}

function ReviewItem({
  review,
  currentUser,
  showUserActions,
  onVote,
  onReport,
  onEdit,
  onDelete,
  actionLoading
}: ReviewItemProps) {
  const isOwner = currentUser?.id === review.userId
  const timeAgo = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
    locale: ptBR
  })

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={review.user?.avatar} />
                <AvatarFallback>
                  {review.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {review.user?.name || 'Usuário'}
                  </span>
                  {review.isVerified && (
                    <Badge variant="secondary" className="text-xs">
                      Compra verificada
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={review.rating} size="sm" />
                  <span className="text-sm text-gray-500">{timeAgo}</span>
                </div>
              </div>
            </div>

            {/* Menu de ações */}
            {showUserActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isOwner ? (
                    <>
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(review)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => onDelete(review.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem 
                      onClick={() => onReport(review.id, 'inappropriate')}
                    >
                      <Flag className="mr-2 h-4 w-4" />
                      Reportar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Título */}
          {review.title && (
            <h4 className="font-medium text-gray-900">{review.title}</h4>
          )}

          {/* Comentário */}
          {review.comment && (
            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
          )}

          {/* Ações de voto */}
          {showUserActions && !isOwner && currentUser && (
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onVote(review.id, 'helpful')}
                  disabled={actionLoading === `vote-${review.id}`}
                  className="h-8 px-2"
                >
                  {actionLoading === `vote-${review.id}` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onVote(review.id, 'not_helpful')}
                  disabled={actionLoading === `vote-${review.id}`}
                  className="h-8 px-2"
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </div>

              {review.helpfulCount > 0 && (
                <span className="text-sm text-gray-500">
                  {review.helpfulCount} pessoa{review.helpfulCount !== 1 ? 's' : ''} 
                  {review.helpfulCount === 1 ? ' achou' : ' acharam'} útil
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}