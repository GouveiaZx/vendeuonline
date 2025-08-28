'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

export default function LoadingSpinner({ 
  size = 'md', 
  className, 
  text,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn(
      'flex flex-col items-center justify-center gap-2',
      fullScreen && 'min-h-screen',
      className
    )}>
      <Loader2 className={cn(
        'animate-spin text-primary',
        sizeClasses[size]
      )} />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}

// Componente para loading de página
export function PageLoading({ text = 'Carregando...' }: { text?: string }) {
  return (
    <LoadingSpinner 
      size="lg" 
      text={text} 
      fullScreen 
      className="bg-background"
    />
  );
}

// Componente para loading de botão
export function ButtonLoading({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <Loader2 className={cn(
      'animate-spin',
      sizeClasses[size]
    )} />
  );
}

// Componente para loading de card/seção
export function SectionLoading({ 
  text = 'Carregando...', 
  className 
}: { 
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn(
      'flex items-center justify-center p-8 rounded-lg border border-dashed',
      className
    )}>
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}