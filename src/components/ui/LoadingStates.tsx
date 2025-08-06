'use client';

import React from 'react';
import { Loader2, Package, Users, Store, ShoppingCart } from 'lucide-react';

// Loading Spinner básico
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600'
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`} 
    />
  );
};

// Loading Button
interface LoadingButtonProps {
  loading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button'
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 border border-gray-300'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading && (
        <LoadingSpinner size="sm" color="gray" className="mr-2 text-current" />
      )}
      {children}
    </button>
  );
};

// Loading Overlay
interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  children,
  message = 'Carregando...',
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="flex flex-col items-center space-y-3">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 text-sm font-medium">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Loading Card Skeleton
interface LoadingCardProps {
  count?: number;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  count = 1, 
  className = '' 
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`bg-white rounded-lg shadow p-6 animate-pulse ${className}`}>
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      ))}
    </>
  );
};

// Loading Table Skeleton
interface LoadingTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const LoadingTable: React.FC<LoadingTableProps> = ({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <div className="animate-pulse">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-3 border-b">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, index) => (
              <div key={index} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 border-b border-gray-100">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Loading Page
interface LoadingPageProps {
  message?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
  message = 'Carregando página...',
  icon,
  className = ''
}) => {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {icon || <LoadingSpinner size="xl" />}
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">{message}</h2>
        <p className="text-gray-600">Por favor, aguarde...</p>
      </div>
    </div>
  );
};

// Loading States específicos para diferentes contextos
export const ProductLoadingCard: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
        <div className="aspect-square bg-gray-200"></div>
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    ))}
  </>
);

export const StoreLoadingCard: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="flex items-center space-x-4 mb-4">
          <div className="rounded-full bg-gray-200 h-16 w-16"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-4/5"></div>
        </div>
      </div>
    ))}
  </>
);

export const UserLoadingCard: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    ))}
  </>
);

// Loading com contexto específico
interface ContextLoadingProps {
  type: 'products' | 'stores' | 'users' | 'orders';
  message?: string;
}

export const ContextLoading: React.FC<ContextLoadingProps> = ({ type, message }) => {
  const getIcon = () => {
    switch (type) {
      case 'products': return <Package className="h-8 w-8 text-blue-600" />;
      case 'stores': return <Store className="h-8 w-8 text-green-600" />;
      case 'users': return <Users className="h-8 w-8 text-purple-600" />;
      case 'orders': return <ShoppingCart className="h-8 w-8 text-orange-600" />;
      default: return <LoadingSpinner size="lg" />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'products': return 'Carregando produtos...';
      case 'stores': return 'Carregando lojas...';
      case 'users': return 'Carregando usuários...';
      case 'orders': return 'Carregando pedidos...';
      default: return 'Carregando...';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-pulse mb-4">
        {getIcon()}
      </div>
      <p className="text-gray-600 font-medium">{message || getDefaultMessage()}</p>
    </div>
  );
};