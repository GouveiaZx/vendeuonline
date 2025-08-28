'use client';

import React from 'react';
import { Star as StarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  maxStars?: number;
  className?: string;
}

export function Star({ 
  rating, 
  onRatingChange, 
  size = 'md', 
  maxStars = 5, 
  className 
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (starValue: number) => {
    if (onRatingChange) {
      onRatingChange(starValue);
    }
  };

  return (
    <div className={cn('flex gap-1', className)}>
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= (hoverRating || rating);
        const isInteractive = !!onRatingChange;

        return (
          <button
            key={starValue}
            type="button"
            className={cn(
              'transition-colors',
              sizeClasses[size],
              isInteractive && 'cursor-pointer hover:scale-110',
              !isInteractive && 'cursor-default'
            )}
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => isInteractive && setHoverRating(starValue)}
            onMouseLeave={() => isInteractive && setHoverRating(0)}
            disabled={!isInteractive}
          >
            <StarIcon
              className={cn(
                'fill-current',
                isFilled ? 'text-yellow-400' : 'text-gray-300'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}