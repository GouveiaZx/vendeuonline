import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Review {
  id: string
  userId: string
  productId?: string
  storeId?: string
  orderId?: string
  rating: number
  title?: string
  comment?: string
  isVerified: boolean
  isVisible: boolean
  helpfulCount: number
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    avatar?: string
  }
}

export interface ReviewVote {
  id: string
  reviewId: string
  userId: string
  voteType: 'helpful' | 'not_helpful'
  createdAt: string
}

export interface ReviewStats {
  totalReviews: number
  averageRating: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

export interface CreateReviewData {
  productId?: string
  storeId?: string
  orderId?: string
  rating: number
  title?: string
  comment?: string
}

export interface UpdateReviewData {
  rating?: number
  title?: string
  comment?: string
  isVisible?: boolean
}

interface ReviewStore {
  reviews: Review[]
  reviewStats: ReviewStats | null
  userReview: Review | null
  loading: boolean
  error: string | null

  // Actions
  fetchReviews: (productId?: string, storeId?: string, page?: number, limit?: number) => Promise<void>
  fetchReviewStats: (productId?: string, storeId?: string) => Promise<void>
  fetchUserReview: (userId: string, productId?: string, storeId?: string) => Promise<void>
  createReview: (data: CreateReviewData) => Promise<Review | null>
  updateReview: (reviewId: string, data: UpdateReviewData) => Promise<Review | null>
  deleteReview: (reviewId: string) => Promise<boolean>
  voteReview: (reviewId: string, voteType: 'helpful' | 'not_helpful') => Promise<boolean>
  reportReview: (reviewId: string, reason: string) => Promise<boolean>
  clearError: () => void
  reset: () => void
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  reviews: [],
  reviewStats: null,
  userReview: null,
  loading: false,
  error: null,

  fetchReviews: async (productId, storeId, page = 1, limit = 10) => {
    set({ loading: true, error: null })
    
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          user:users!reviews_userId_fkey(
            id,
            name,
            avatar
          )
        `)
        .eq('isVisible', true)
        .order('createdAt', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (productId) {
        query = query.eq('productId', productId)
      } else if (storeId) {
        query = query.eq('storeId', storeId)
      }

      const { data, error } = await query

      if (error) throw error

      set({ reviews: data || [], loading: false })
    } catch (error) {
      console.error('Erro ao buscar reviews:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao buscar reviews',
        loading: false 
      })
    }
  },

  fetchReviewStats: async (productId, storeId) => {
    set({ loading: true, error: null })
    
    try {
      let query = supabase
        .from('reviews')
        .select('rating')
        .eq('isVisible', true)

      if (productId) {
        query = query.eq('productId', productId)
      } else if (storeId) {
        query = query.eq('storeId', storeId)
      }

      const { data, error } = await query

      if (error) throw error

      if (data && data.length > 0) {
        const totalReviews = data.length
        const averageRating = data.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        
        const ratingDistribution = {
          1: data.filter(r => r.rating === 1).length,
          2: data.filter(r => r.rating === 2).length,
          3: data.filter(r => r.rating === 3).length,
          4: data.filter(r => r.rating === 4).length,
          5: data.filter(r => r.rating === 5).length,
        }

        set({ 
          reviewStats: {
            totalReviews,
            averageRating: Math.round(averageRating * 100) / 100,
            ratingDistribution
          },
          loading: false 
        })
      } else {
        set({ 
          reviewStats: {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          },
          loading: false 
        })
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de reviews:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas',
        loading: false 
      })
    }
  },

  fetchUserReview: async (userId, productId, storeId) => {
    set({ loading: true, error: null })
    
    try {
      let query = supabase
        .from('reviews')
        .select('*')
        .eq('userId', userId)

      if (productId) {
        query = query.eq('productId', productId)
      } else if (storeId) {
        query = query.eq('storeId', storeId)
      }

      const { data, error } = await query.single()

      if (error && error.code !== 'PGRST116') throw error

      set({ userReview: data || null, loading: false })
    } catch (error) {
      console.error('Erro ao buscar review do usuário:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao buscar review do usuário',
        loading: false 
      })
    }
  },

  createReview: async (data) => {
    set({ loading: true, error: null })
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const reviewData = {
        ...data,
        userId: user.id,
        isVerified: false,
        isVisible: true,
        helpfulCount: 0
      }

      const { data: newReview, error } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select()
        .single()

      if (error) throw error

      // Atualizar a lista de reviews
      const { reviews } = get()
      set({ 
        reviews: [newReview, ...reviews],
        userReview: newReview,
        loading: false 
      })

      return newReview
    } catch (error) {
      console.error('Erro ao criar review:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao criar review',
        loading: false 
      })
      return null
    }
  },

  updateReview: async (reviewId, data) => {
    set({ loading: true, error: null })
    
    try {
      const { data: updatedReview, error } = await supabase
        .from('reviews')
        .update(data)
        .eq('id', reviewId)
        .select()
        .single()

      if (error) throw error

      // Atualizar a lista de reviews
      const { reviews } = get()
      const updatedReviews = reviews.map(review => 
        review.id === reviewId ? updatedReview : review
      )
      
      set({ 
        reviews: updatedReviews,
        userReview: updatedReview,
        loading: false 
      })

      return updatedReview
    } catch (error) {
      console.error('Erro ao atualizar review:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao atualizar review',
        loading: false 
      })
      return null
    }
  },

  deleteReview: async (reviewId) => {
    set({ loading: true, error: null })
    
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)

      if (error) throw error

      // Remover da lista de reviews
      const { reviews } = get()
      const filteredReviews = reviews.filter(review => review.id !== reviewId)
      
      set({ 
        reviews: filteredReviews,
        userReview: null,
        loading: false 
      })

      return true
    } catch (error) {
      console.error('Erro ao deletar review:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao deletar review',
        loading: false 
      })
      return false
    }
  },

  voteReview: async (reviewId, voteType) => {
    set({ loading: true, error: null })
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Verificar se já votou
      const { data: existingVote } = await supabase
        .from('review_votes')
        .select('*')
        .eq('reviewId', reviewId)
        .eq('userId', user.id)
        .single()

      if (existingVote) {
        // Atualizar voto existente
        const { error } = await supabase
          .from('review_votes')
          .update({ voteType })
          .eq('id', existingVote.id)

        if (error) throw error
      } else {
        // Criar novo voto
        const { error } = await supabase
          .from('review_votes')
          .insert([{
            reviewId,
            userId: user.id,
            voteType
          }])

        if (error) throw error
      }

      // Atualizar contador de helpful no review
      const { data: votes } = await supabase
        .from('review_votes')
        .select('voteType')
        .eq('reviewId', reviewId)

      const helpfulCount = votes?.filter(vote => vote.voteType === 'helpful').length || 0

      await supabase
        .from('reviews')
        .update({ helpfulCount })
        .eq('id', reviewId)

      // Atualizar estado local
      const { reviews } = get()
      const updatedReviews = reviews.map(review => 
        review.id === reviewId ? { ...review, helpfulCount } : review
      )
      
      set({ reviews: updatedReviews, loading: false })

      return true
    } catch (error) {
      console.error('Erro ao votar no review:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao votar no review',
        loading: false 
      })
      return false
    }
  },

  reportReview: async (reviewId, reason) => {
    set({ loading: true, error: null })
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Criar relatório (pode ser uma tabela separada ou notificação para admins)
      const { error } = await supabase
        .from('review_reports')
        .insert([{
          reviewId,
          reportedBy: user.id,
          reason,
          status: 'pending'
        }])

      if (error) throw error

      set({ loading: false })
      return true
    } catch (error) {
      console.error('Erro ao reportar review:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao reportar review',
        loading: false 
      })
      return false
    }
  },

  clearError: () => set({ error: null }),
  
  reset: () => set({ 
    reviews: [], 
    reviewStats: null, 
    userReview: null, 
    loading: false, 
    error: null 
  })
}))