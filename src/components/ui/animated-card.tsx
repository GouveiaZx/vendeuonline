'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { FadeIn } from './fade-in';

const cardVariants = cva(
  'rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'hover:shadow-lg hover:-translate-y-1',
        interactive: 'hover:shadow-xl hover:-translate-y-2 cursor-pointer hover:border-primary/50',
        glass: 'backdrop-blur-sm bg-background/80 border-white/20 hover:bg-background/90',
        gradient: 'bg-gradient-to-br from-background to-muted hover:from-background/90 hover:to-muted/90',
        floating: 'shadow-lg hover:shadow-2xl hover:scale-105',
        neon: 'border-primary/20 shadow-lg shadow-primary/5 hover:shadow-primary/10 hover:border-primary/40',
      },
      size: {
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
      animation: {
        none: '',
        fade: 'animate-fade-in',
        slide: 'animate-slide-up',
        scale: 'animate-scale-in',
        rotate: 'hover:animate-wiggle',
        pulse: 'animate-pulse hover:animate-none',
        bounce: 'hover:animate-bounce',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      animation: 'none',
    },
  }
);

export interface AnimatedCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  hover3d?: boolean;
  fadeIn?: boolean;
  fadeDelay?: number;
  ripple?: boolean;
}

const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ 
    className, 
    variant, 
    size, 
    animation, 
    hover3d = false, 
    fadeIn = false, 
    fadeDelay = 0,
    ripple = false,
    children, 
    onClick,
    onMouseMove,
    onMouseLeave,
    ...props 
  }, ref) => {
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (hover3d) {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
      }
      onMouseMove?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      if (hover3d) {
        const card = e.currentTarget;
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
      }
      onMouseLeave?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (ripple) {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const rippleElement = document.createElement('span');
        rippleElement.style.cssText = `
          position: absolute;
          border-radius: 50%;
          transform: scale(0);
          animation: ripple-card 0.6s linear;
          background-color: rgba(var(--primary), 0.1);
          left: ${x - 15}px;
          top: ${y - 15}px;
          width: 30px;
          height: 30px;
          pointer-events: none;
        `;

        card.appendChild(rippleElement);

        setTimeout(() => {
          rippleElement.remove();
        }, 600);
      }
      onClick?.(e);
    };

    const cardContent = (
      <div
        className={cn(
          cardVariants({ variant, size, animation }),
          'relative overflow-hidden',
          hover3d && 'transition-transform duration-200 ease-out',
          className
        )}
        ref={ref}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
        
        <style jsx>{`
          @keyframes ripple-card {
            to {
              transform: scale(4);
              opacity: 0;
            }
          }
          
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateY(40px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes scale-in {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes wiggle {
            0%, 7% { transform: rotateZ(0deg); }
            15% { transform: rotateZ(-5deg); }
            20% { transform: rotateZ(3deg); }
            25% { transform: rotateZ(-3deg); }
            30% { transform: rotateZ(2deg); }
            35% { transform: rotateZ(-1deg); }
            40%, 100% { transform: rotateZ(0deg); }
          }
        `}</style>
      </div>
    );

    return fadeIn ? (
      <FadeIn delay={fadeDelay} direction="up">
        {cardContent}
      </FadeIn>
    ) : (
      cardContent
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

// Componentes específicos
export const InteractiveCard = forwardRef<HTMLDivElement, Omit<AnimatedCardProps, 'variant'>>(
  ({ children, ...props }, ref) => (
    <AnimatedCard
      ref={ref}
      variant="interactive"
      hover3d
      ripple
      {...props}
    >
      {children}
    </AnimatedCard>
  )
);

InteractiveCard.displayName = 'InteractiveCard';

export const GlassCard = forwardRef<HTMLDivElement, Omit<AnimatedCardProps, 'variant'>>(
  ({ children, ...props }, ref) => (
    <AnimatedCard
      ref={ref}
      variant="glass"
      fadeIn
      {...props}
    >
      {children}
    </AnimatedCard>
  )
);

GlassCard.displayName = 'GlassCard';

export const FloatingCard = forwardRef<HTMLDivElement, Omit<AnimatedCardProps, 'variant'>>(
  ({ children, ...props }, ref) => (
    <AnimatedCard
      ref={ref}
      variant="floating"
      animation="scale"
      hover3d
      {...props}
    >
      {children}
    </AnimatedCard>
  )
);

FloatingCard.displayName = 'FloatingCard';

export const NeonCard = forwardRef<HTMLDivElement, Omit<AnimatedCardProps, 'variant'>>(
  ({ children, ...props }, ref) => (
    <AnimatedCard
      ref={ref}
      variant="neon"
      animation="fade"
      {...props}
    >
      {children}
    </AnimatedCard>
  )
);

NeonCard.displayName = 'NeonCard';

// Header e Footer para cards
export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex-1', className)}
      {...props}
    />
  )
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

export { AnimatedCard, cardVariants };