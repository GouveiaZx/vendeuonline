import React from 'react';
import { FixedSizeGrid, GridChildComponentProps } from 'react-window';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { Store } from '@/types';
import { useVirtualizedDimensions } from '@/components/virtualized/VirtualizedList';

interface VirtualizedStoreGridProps {
  stores: Store[];
  loading?: boolean;
  onStoreClick?: (store: Store) => void;
  columnCount?: number;
  columnWidth?: number;
  rowHeight?: number;
  gap?: number;
}

const StoreCard: React.FC<{ store: Store; onClick?: (store: Store) => void }> = ({ store, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(store);
    }
  };

  return (
    <Card 
      className={`h-full transition-transform duration-200 ${
        onClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'
      }`}
      onClick={handleClick}
    >
      <img
        className="w-full h-35 object-cover rounded-t-lg"
        src={store.logo || '/placeholder-store.jpg'}
        alt={store.name}
        style={{ height: '140px' }}
      />
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold truncate mb-2">
          {store.name}
        </h3>
        
        <p className="text-sm text-muted-foreground truncate mb-2">
          {store.description}
        </p>

        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(store.rating) 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground ml-2">
          ({store.reviewCount})
        </span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {store.category && (
            <Badge variant="outline">
              {store.category}
            </Badge>
          )}
          <Badge variant="outline">
            {store.productCount} produtos
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

const GridItem: React.FC<GridChildComponentProps<Store[]>> = ({ 
  columnIndex, 
  rowIndex, 
  style, 
  data 
}) => {
  const stores = data;
  const itemIndex = rowIndex * 3 + columnIndex; // 3 columns
  const store = stores[itemIndex];

  if (!store) return null;

  return (
    <div style={{
      ...style,
      padding: '8px',
    }}>
      <StoreCard store={store} />
    </div>
  );
};

export const VirtualizedStoreGrid: React.FC<VirtualizedStoreGridProps> = ({
  stores,
  loading = false,
  onStoreClick,
  columnCount = 3,
  columnWidth = 300,
  rowHeight = 220,
  gap = 16,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dimensions = useVirtualizedDimensions(containerRef);
  
  const itemCount = stores.length;
  const itemsPerRow = Math.floor((dimensions.width - gap) / (columnWidth + gap));
  const actualColumnCount = Math.min(itemsPerRow || columnCount, columnCount);
  const actualColumnWidth = Math.floor((dimensions.width - gap * (actualColumnCount + 1)) / actualColumnCount);
  const rowCount = Math.ceil(itemCount / actualColumnCount);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-muted-foreground">Carregando lojas...</p>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-muted-foreground">Nenhuma loja encontrada</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <FixedSizeGrid
        columnCount={actualColumnCount}
        columnWidth={actualColumnWidth + gap}
        height={dimensions.height}
        rowCount={rowCount}
        rowHeight={rowHeight + gap}
        width={dimensions.width}
        itemData={stores}
        overscanRowCount={2}
      >
        {GridItem}
      </FixedSizeGrid>
    </div>
  );
};

// Hook para gerenciar o estado da grid
export const useVirtualizedStoreGrid = (stores: Store[]) => {
  const [selectedStore, setSelectedStore] = React.useState<Store | null>(null);
  const [filteredStores, setFilteredStores] = React.useState<Store[]>(stores);

  const handleStoreClick = React.useCallback((store: Store) => {
    setSelectedStore(store);
  }, []);

  const filterStores = React.useCallback((
    searchTerm: string,
    category?: string,
    rating?: number
  ) => {
    let filtered = stores;

    if (searchTerm) {
      filtered = filtered.filter(store =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (category) {
      filtered = filtered.filter(store => store.category === category);
    }

    if (rating) {
      filtered = filtered.filter(store => (store.rating || 0) >= rating);
    }

    setFilteredStores(filtered);
  }, [stores]);

  return {
    stores: filteredStores,
    selectedStore,
    handleStoreClick,
    filterStores,
  };
};