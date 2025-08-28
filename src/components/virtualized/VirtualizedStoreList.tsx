import React from 'react';
import { VirtualizedList } from '@/components/virtualized/VirtualizedList';
import type { StoreWithCounts } from '@/types';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface VirtualizedStoreListProps {
  stores: StoreWithCounts[];
  loading?: boolean;
  height?: number | string;
  onStoreClick?: (store: StoreWithCounts) => void;
}

export function VirtualizedStoreList({
  stores,
  loading = false,
  height = 600,
  onStoreClick,
}: VirtualizedStoreListProps) {
  const router = useRouter();

  const handleStoreClick = (store: StoreWithCounts) => {
    if (onStoreClick) {
      onStoreClick(store);
    } else {
      router.push(`/stores/${store.slug}`);
    }
  };

  const renderStoreItem = (store: StoreWithCounts, index: number) => (
    <Card
      key={store.id}
      className="mb-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      onClick={() => handleStoreClick(store)}
    >
      <div className="flex">
        <img
          className="w-30 h-30 object-cover rounded-l-lg"
          src={store.logo || '/placeholder-store.jpg'}
          alt={store.name}
        />
        <CardContent className="flex-1 py-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold truncate">
                {store.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {store.description}
              </p>
            </div>
            {store.category && (
              <Badge variant="outline">
                {store.category}
              </Badge>
            )}
          </div>

          <div className="flex items-center mt-2">
            {store.rating && (
              <div className="flex items-center mr-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(store.rating!) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm ml-1">
                  {(() => {
                    const safeRating = store.rating != null && !isNaN(Number(store.rating)) ? Number(store.rating) : 0;
                    return safeRating.toFixed(1);
                  })()}
                </span>
              </div>
            )}
            
            <span className="text-sm text-muted-foreground">
              {store._count?.products || store.productCount || 0} produtos
            </span>
            
            {(store._count?.reviews || store.reviewCount) && (
              <span className="text-sm text-muted-foreground ml-4">
                {store._count?.reviews || store.reviewCount} avaliações
              </span>
            )}
          </div>

          {store.address && (
            <p className="text-sm text-muted-foreground mt-2">
              📍 {store.address}
            </p>
          )}
        </CardContent>
      </div>
    </Card>
  );

  const emptyState = (
    <div className="text-center py-16">
      <h3 className="text-lg font-medium text-muted-foreground mb-2">
        Nenhuma loja encontrada
      </h3>
      <p className="text-sm text-muted-foreground">
        Tente ajustar seus filtros de busca
      </p>
    </div>
  );

  return (
    <VirtualizedList
      items={stores}
      renderItem={renderStoreItem}
      itemHeight={140} // Altura do Card + margin
      height={height}
      loading={loading}
      loadingItems={8}
      emptyState={emptyState}
    />
  );
}

// Componente para grid virtualizado de stores
export function VirtualizedStoreGrid({
  stores,
  loading = false,
  height = 600,
  onStoreClick,
}: VirtualizedStoreListProps) {
  const router = useRouter();

  const handleStoreClick = (store: StoreWithCounts) => {
    if (onStoreClick) {
      onStoreClick(store);
    } else {
      router.push(`/stores/${store.slug}`);
    }
  };

  const renderStoreCard = (store: StoreWithCounts, index: number) => (
    <Card
      key={store.id}
      className="h-full cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      onClick={() => handleStoreClick(store)}
    >
      <img
        className="w-full h-40 object-cover rounded-t-lg"
        src={store.logo || '/placeholder-store.jpg'}
        alt={store.name}
      />
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold truncate mb-2">
          {store.name}
        </h3>
        
        <p className="text-sm text-muted-foreground truncate mb-2">
          {store.description}
        </p>

        {store.category && (
          <Badge variant="outline" className="mb-2">
            {store.category}
          </Badge>
        )}

        <div className="flex items-center justify-between">
          {store.rating && (
            <div className="flex items-center">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(store.rating!) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm ml-1">
                {(() => {
                  const safeRating = store.rating != null && !isNaN(Number(store.rating)) ? Number(store.rating) : 0;
                  return safeRating.toFixed(1);
                })()}
              </span>
            </div>
          )}
          
          <span className="text-sm text-muted-foreground">
            {store._count?.products || store.productCount || 0} produtos
          </span>
        </div>
      </CardContent>
    </Card>
  );

  // Calcular número de colunas baseado na largura
  const getColumnCount = (width: number) => {
    if (width < 600) return 1;
    if (width < 900) return 2;
    if (width < 1200) return 3;
    return 4;
  };

  // Hook para obter largura do container
  const [containerWidth, setContainerWidth] = React.useState(1200);

  React.useEffect(() => {
    const updateWidth = () => {
      const width = window.innerWidth - 48; // Considerar padding
      setContainerWidth(width);
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const columnCount = getColumnCount(containerWidth);
  const itemWidth = Math.floor((containerWidth - (columnCount - 1) * 16) / columnCount);
  const itemHeight = 280;
  const rowCount = Math.ceil(stores.length / columnCount);

  if (loading) {
    return (
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}>
        {Array.from({ length: 12 }).map((_, index) => (
          <Card key={index}>
            <div className="w-full h-40 bg-gray-200 animate-pulse rounded-t-lg" />
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 animate-pulse rounded mb-2" style={{ width: '80%' }} />
              <div className="h-3 bg-gray-200 animate-pulse rounded mb-2" style={{ width: '60%' }} />
              <div className="h-3 bg-gray-200 animate-pulse rounded" style={{ width: '40%' }} />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stores.length) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-medium text-muted-foreground">
          Nenhuma loja encontrada
        </h3>
      </div>
    );
  }

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}>
      {stores.map((store, index) => renderStoreCard(store, index))}
    </div>
  );
}