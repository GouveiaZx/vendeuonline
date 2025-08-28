import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200';
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Pode ser customizado para uma animação de onda
    none: '',
  };

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-md',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  // Para múltiplas linhas de texto
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]}`}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : '100%', // Última linha menor
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

export { Skeleton };

// Componentes pré-configurados para casos comuns

// Skeleton para avatar
export const AvatarSkeleton: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return <Skeleton variant="circular" className={sizeClasses[size]} />;
};

// Skeleton para card de produto
export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
      {/* Imagem */}
      <Skeleton variant="rounded" className="w-full h-48" />
      
      {/* Título */}
      <Skeleton variant="text" lines={2} />
      
      {/* Preço */}
      <Skeleton variant="text" width="40%" />
      
      {/* Botão */}
      <Skeleton variant="rounded" className="w-full h-10" />
    </div>
  );
};

// Skeleton para lista de produtos
export const ProductListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Skeleton para perfil de usuário
export const UserProfileSkeleton: React.FC = () => {
  return (
    <div className="flex items-center space-x-4 p-4">
      <AvatarSkeleton size="lg" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="80%" />
      </div>
    </div>
  );
};

// Skeleton para comentário/review
export const CommentSkeleton: React.FC = () => {
  return (
    <div className="flex space-x-3 p-4 border-b border-gray-200">
      <AvatarSkeleton size="sm" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center space-x-2">
          <Skeleton variant="text" width="30%" />
          <Skeleton variant="text" width="20%" />
        </div>
        <Skeleton variant="text" lines={3} />
      </div>
    </div>
  );
};

// Skeleton para tabela
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} variant="text" height={20} />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" height={16} />
          ))}
        </div>
      ))}
    </div>
  );
};

// Skeleton para formulário
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton variant="text" width="30%" height={16} />
          <Skeleton variant="rounded" className="w-full h-10" />
        </div>
      ))}
      <Skeleton variant="rounded" className="w-32 h-10" />
    </div>
  );
};

// Skeleton para dashboard/estatísticas
export const StatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow space-y-3">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={32} />
          <Skeleton variant="text" width="80%" height={16} />
        </div>
      ))}
    </div>
  );
};

// Hook para controlar quando mostrar skeleton
export const useSkeleton = (isLoading: boolean, delay = 200) => {
  const [showSkeleton, setShowSkeleton] = React.useState(false);

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isLoading) {
      timeoutId = setTimeout(() => {
        setShowSkeleton(true);
      }, delay);
    } else {
      setShowSkeleton(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, delay]);

  return showSkeleton;
};