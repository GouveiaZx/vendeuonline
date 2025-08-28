'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './loading-spinner';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:scale-[1.02] active:scale-[0.98]',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98]',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:scale-[1.02] active:scale-[0.98]',
        ghost: 'hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98]',
        link: 'text-primary underline-offset-4 hover:underline',
        gradient: 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg hover:from-primary/90 hover:to-blue-600/90 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl',
        shimmer: 'bg-gradient-to-r from-gray-200 via-white to-gray-200 bg-[length:400%_100%] animate-shimmer border shadow-sm hover:scale-[1.02] active:scale-[0.98]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        xl: 'h-12 rounded-lg px-10 text-base',
        icon: 'h-9 w-9',
      },
      animation: {
        none: '',
        bounce: 'hover:animate-bounce',
        pulse: 'animate-pulse hover:animate-none',
        spin: 'hover:animate-spin',
        wiggle: 'hover:animate-wiggle',
        float: 'animate-float',
        glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-shadow duration-300',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      animation: 'none',
    },
  }
);

export interface AnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingText?: string;
  ripple?: boolean;
  children: React.ReactNode;
}

const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, variant, size, animation, loading, loadingText, ripple = true, disabled, children, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;

      // Efeito ripple
      if (ripple) {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const rippleElement = document.createElement('span');
        rippleElement.style.cssText = `
          position: absolute;
          border-radius: 50%;
          transform: scale(0);
          animation: ripple 0.6s linear;
          background-color: rgba(255, 255, 255, 0.6);
          left: ${x - 10}px;
          top: ${y - 10}px;
          width: 20px;
          height: 20px;
          pointer-events: none;
        `;

        button.appendChild(rippleElement);

        setTimeout(() => {
          rippleElement.remove();
        }, 600);
      }

      onClick?.(e);
    };

    return (
      <button
        className={cn(buttonVariants({ variant, size, animation, className }))}
        ref={ref}
        disabled={loading || disabled}
        onClick={handleClick}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            {loadingText || 'Carregando...'}
          </>
        ) : (
          children
        )}
        
        <style jsx>{`
          @keyframes ripple {
            to {
              transform: scale(4);
              opacity: 0;
            }
          }
          
          @keyframes shimmer {
            0% { background-position: -400% 0; }
            100% { background-position: 400% 0; }
          }
          
          @keyframes wiggle {
            0%, 7% { transform: rotateZ(0deg); }
            15% { transform: rotateZ(-15deg); }
            20% { transform: rotateZ(10deg); }
            25% { transform: rotateZ(-10deg); }
            30% { transform: rotateZ(6deg); }
            35% { transform: rotateZ(-4deg); }
            40%, 100% { transform: rotateZ(0deg); }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }
        `}</style>
      </button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

export { AnimatedButton, buttonVariants };

// Componentes específicos para casos comuns
export const SubmitButton = forwardRef<HTMLButtonElement, Omit<AnimatedButtonProps, 'type'>>(
  ({ children, loading, ...props }, ref) => (
    <AnimatedButton
      ref={ref}
      type="submit"
      variant="default"
      animation="glow"
      loading={loading}
      loadingText="Enviando..."
      {...props}
    >
      {children}
    </AnimatedButton>
  )
);

SubmitButton.displayName = 'SubmitButton';

export const CancelButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, ...props }, ref) => (
    <AnimatedButton
      ref={ref}
      variant="outline"
      {...props}
    >
      {children}
    </AnimatedButton>
  )
);

CancelButton.displayName = 'CancelButton';

export const DeleteButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, loading, ...props }, ref) => (
    <AnimatedButton
      ref={ref}
      variant="destructive"
      animation="wiggle"
      loading={loading}
      loadingText="Excluindo..."
      {...props}
    >
      {children}
    </AnimatedButton>
  )
);

DeleteButton.displayName = 'DeleteButton';

export const GradientButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, ...props }, ref) => (
    <AnimatedButton
      ref={ref}
      variant="gradient"
      animation="float"
      {...props}
    >
      {children}
    </AnimatedButton>
  )
);

GradientButton.displayName = 'GradientButton';