import React, { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  showValue?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  showValue = false,
  onRatingChange,
  className
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating)
    }
  }

  const handleStarHover = (starRating: number) => {
    if (interactive) {
      setHoverRating(starRating)
      setIsHovering(true)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setIsHovering(false)
      setHoverRating(0)
    }
  }

  const getStarFill = (starIndex: number) => {
    const currentRating = isHovering ? hoverRating : rating
    
    if (starIndex <= currentRating) {
      return 'fill-yellow-400 text-yellow-400'
    } else if (starIndex - 0.5 <= currentRating) {
      return 'fill-yellow-400/50 text-yellow-400'
    } else {
      return 'fill-gray-200 text-gray-200'
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div 
        className="flex items-center gap-0.5"
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: maxRating }, (_, index) => {
          const starIndex = index + 1
          return (
            <button
              key={starIndex}
              type="button"
              disabled={!interactive}
              className={cn(
                'transition-all duration-200',
                interactive && 'hover:scale-110 cursor-pointer',
                !interactive && 'cursor-default'
              )}
              onClick={() => handleStarClick(starIndex)}
              onMouseEnter={() => handleStarHover(starIndex)}
              aria-label={`${starIndex} estrela${starIndex > 1 ? 's' : ''}`}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  getStarFill(starIndex),
                  'transition-colors duration-200'
                )}
              />
            </button>
          )
        })}
      </div>
      
      {showValue && (
        <span className="text-sm text-gray-600 ml-1">
          {(() => {
            const safeValue = rating != null && !isNaN(Number(rating)) ? Number(rating) : 0;
            return safeValue.toFixed(1);
          })()}
        </span>
      )}
    </div>
  )
}

// Componente para exibir distribuição de ratings
interface RatingDistributionProps {
  distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  totalReviews: number
  className?: string
}

export function RatingDistribution({ 
  distribution, 
  totalReviews, 
  className 
}: RatingDistributionProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = distribution[rating as keyof typeof distribution]
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
        
        return (
          <div key={rating} className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 w-12">
              <span className="text-gray-600">{rating}</span>
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            </div>
            
            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-yellow-400 transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            
            <span className="text-gray-500 w-8 text-right">
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// Componente para resumo de rating
interface RatingSummaryProps {
  averageRating: number
  totalReviews: number
  size?: 'sm' | 'md' | 'lg'
  showDistribution?: boolean
  distribution?: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  className?: string
}

export function RatingSummary({
  averageRating,
  totalReviews,
  size = 'md',
  showDistribution = false,
  distribution,
  className
}: RatingSummaryProps) {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-3">
        <div className="text-center">
          <div className={cn('font-bold text-gray-900', textSizes[size])}>
            {(() => {
              const safeValue = averageRating != null && !isNaN(Number(averageRating)) ? Number(averageRating) : 0;
              return safeValue.toFixed(1);
            })()}
          </div>
          <StarRating 
            rating={averageRating} 
            size={size} 
            className="justify-center"
          />
          <div className="text-xs text-gray-500 mt-1">
            {totalReviews} avaliação{totalReviews !== 1 ? 'ões' : ''}
          </div>
        </div>
        
        {showDistribution && distribution && (
          <div className="flex-1">
            <RatingDistribution 
              distribution={distribution}
              totalReviews={totalReviews}
            />
          </div>
        )}
      </div>
    </div>
  )
}