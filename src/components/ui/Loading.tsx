import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <Loader2 
            className={`${sizeClasses[size]} animate-spin text-blue-600 ${className}`}
            aria-label="Carregando"
          />
        );
      
      case 'dots':
        return (
          <div className={`flex space-x-1 ${className}`} aria-label="Carregando">
            <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
            <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
            <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
          </div>
        );
      
      case 'pulse':
        return (
          <div 
            className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-pulse ${className}`}
            aria-label="Carregando"
          ></div>
        );
      
      default:
        return null;
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-2">
      {renderSpinner()}
      {text && (
        <p className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;

// Componente específico para botões
interface ButtonLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <Loader2 
      className={`${sizeClasses[size]} animate-spin ${className}`}
      aria-label="Carregando"
    />
  );
};

// Componente para overlay de loading em cards/containers
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  text = 'Carregando...',
  size = 'md',
}) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm rounded-lg">
          <Loading size={size} text={text} variant="spinner" />
        </div>
      )}
    </div>
  );
};

// Hook para gerenciar estados de loading
export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);
  const toggleLoading = () => setIsLoading(!isLoading);

  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    setIsLoading,
  };
};

// Componente para loading de página inteira
interface PageLoadingProps {
  text?: string;
  showLogo?: boolean;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  text = 'Carregando página...',
  showLogo = true,
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {showLogo && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600">VendeuOnline</h1>
        </div>
      )}
      <Loading size="lg" text={text} variant="spinner" />
    </div>
  );
};