import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  height?: number | string;
  width?: number | string;
  overscanCount?: number;
  loading?: boolean;
  loadingItems?: number;
  variant?: 'fixed' | 'variable';
  getItemSize?: (index: number) => number;
  emptyState?: React.ReactNode;
  className?: string;
}

interface VirtualizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columnCount: number;
  rowCount: number;
  itemWidth: number;
  itemHeight: number;
  height?: number | string;
  width?: number | string;
  overscanCount?: number;
  loading?: boolean;
  loadingItems?: number;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  height = 400,
  width = '100%',
  loading = false,
  loadingItems = 10,
  emptyState,
  className,
}: VirtualizedListProps<T>) {
  if (loading) {
    return (
      <div className={className}>
        {Array.from({ length: loadingItems }).map((_, index) => (
          <div key={index} className="py-1">
            <Skeleton className="w-full" height={itemHeight} />
          </div>
        ))}
      </div>
    );
  }

  if (!items.length && emptyState) {
    return <div className="flex items-center justify-center" style={{ height }}>{emptyState}</div>;
  }

  return (
    <div 
      className={`overflow-auto ${className || ''}`}
      style={{ height, width }}
    >
      {items.map((item, index) => (
        <div key={index} style={{ height: itemHeight }}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

export function VirtualizedGrid<T>({
  items,
  renderItem,
  columnCount,
  itemHeight,
  height = 400,
  width = '100%',
  loading = false,
  loadingItems = 12,
}: VirtualizedGridProps<T>) {
  if (loading) {
    return (
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}>
        {Array.from({ length: loadingItems }).map((_, index) => (
          <Skeleton key={index} height={itemHeight} />
        ))}
      </div>
    );
  }

  return (
    <div 
      className="grid gap-2 overflow-auto"
      style={{ 
        height, 
        width,
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`
      }}
    >
      {items.map((item, index) => (
        <div key={index} style={{ height: itemHeight }}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

// Hook para calcular dimensões dinamicamente
export const useVirtualizedDimensions = (containerRef: React.RefObject<HTMLDivElement>) => {
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    
    // Proteger acesso ao window para SSR
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, [containerRef]);

  return dimensions;
};

// Hook para detectar se a virtualização é necessária
export const useShouldVirtualize = (itemCount: number, threshold = 50) => {
  return itemCount > threshold;
};