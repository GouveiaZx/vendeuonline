import React, { useEffect, useState } from 'react';
import { VirtualizedStoreList } from '@/components/virtualized/VirtualizedStoreList';
import { VirtualizedStoreGrid, useVirtualizedStoreGrid } from '@/components/virtualized/VirtualizedStoreGrid';
import { Store, StoreWithCounts } from '@/types';
import { generateSSRSafeRandom, getSSRSafeTimestamp } from '@/lib/ssrUtils';
import { useSearchStore } from '@/store/searchStore';
import { useStoreStore } from '@/store/storeStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VirtualizedStoreListExampleProps {
  viewMode?: 'list' | 'grid';
}

export const VirtualizedStoreListExample: React.FC<VirtualizedStoreListExampleProps> = ({
  viewMode = 'list',
}) => {
  const {
    query: searchQuery,
    filters: { sortBy, sortOrder },
    setQuery: setSearchQuery,
    setFilters
  } = useSearchStore();

  const setSortBy = (value: 'relevance' | 'name' | 'price' | 'rating' | 'newest' | 'oldest' | 'sales' | 'popularity' | 'distance') => {
    setFilters({ sortBy: value });
  };

  const setSortOrder = (value: 'asc' | 'desc') => {
    setFilters({ sortOrder: value });
  };
  
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [category, setCategory] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [itemCount, setItemCount] = useState(1000); // Para demonstração
  
  // Gerar dados de demonstração com virtualização
  const [demoStores, setDemoStores] = useState<Store[]>([]);
  
  const {
    stores: filteredStores,
    selectedStore,
    handleStoreClick,
    filterStores
  } = useVirtualizedStoreGrid(demoStores);

  useEffect(() => {
    // Gerar dados de demonstração para testar virtualização
    const generateDemoStores = () => {
      const categories = ['Eletrônicos', 'Moda', 'Casa', 'Esportes', 'Livros', 'Beleza', 'Alimentos', 'Automóveis'];
      const regions = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre'];
      
      const stores: Store[] = Array.from({ length: itemCount }, (_, index) => ({
          id: `store-${index}`,
          sellerId: `seller-${index}`,
          name: `Loja ${String(index + 1).padStart(4, '0')}`,
          slug: `loja-${String(index + 1).padStart(4, '0')}`,
          description: `Descrição da loja ${index + 1}. Esta é uma loja especializada em ${categories[index % categories.length]} localizada em ${regions[index % regions.length]}.`,
          logo: `https://picsum.photos/300/200?random=${index}`,
          banner: `https://picsum.photos/800/300?random=${index + 1000}`,
          address: `Rua ${index + 1}, ${index * 10}`,
          city: regions[index % regions.length],
          state: 'SP',
          zipCode: `${String(Math.floor(generateSSRSafeRandom() * 90000) + 10000)}-${String(Math.floor(generateSSRSafeRandom() * 900) + 100)}`,
          phone: `(11) 9${String(index).padStart(4, '0')}-${String(index).padStart(4, '0')}`,
          email: `loja${index}@exemplo.com`,
          whatsapp: undefined,
          website: undefined,
          socialMedia: undefined,
          category: categories[index % categories.length],
          isActive: generateSSRSafeRandom() > 0.1,
          isVerified: generateSSRSafeRandom() > 0.3,
          rating: Math.round((generateSSRSafeRandom() * 2 + 3) * 10) / 10,
          reviewCount: Math.floor(generateSSRSafeRandom() * 1000),
          productCount: Math.floor(generateSSRSafeRandom() * 1000),
          salesCount: Math.floor(generateSSRSafeRandom() * 500),
          plan: 'GRATUITO' as const,
          features: undefined,
          theme: undefined,
          seoTitle: undefined,
          seoDescription: undefined,
          createdAt: new Date(getSSRSafeTimestamp() - generateSSRSafeRandom() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      
      setDemoStores(stores);
    };

    generateDemoStores();
  }, [itemCount]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchTerm);
      filterStores(searchTerm, category, minRating);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, category, minRating, setSearchQuery, filterStores]);

  const handleStoreSelect = (store: StoreWithCounts) => {
    handleStoreClick(store);
    console.log('Store selected:', store);
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">
          Virtualização de Lojas - Demonstração
        </h1>
        
        <p className="text-muted-foreground mb-6">
          Esta demonstração mostra a virtualização de listas com {demoStores.length} lojas. 
          Use os filtros para testar a performance.
        </p>

        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="min-w-[200px]">
            <Label htmlFor="search">Buscar lojas</Label>
            <Input
              id="search"
              placeholder="Buscar lojas"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="min-w-[120px]">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="Eletrônicos">Eletrônicos</SelectItem>
                <SelectItem value="Moda">Moda</SelectItem>
                <SelectItem value="Casa">Casa</SelectItem>
                <SelectItem value="Esportes">Esportes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[200px]">
            <Label>Avaliação mínima: {minRating}</Label>
            <Slider
              value={[minRating]}
              onValueChange={(value) => setMinRating(value[0])}
              min={0}
              max={5}
              step={0.5}
              className="mt-2"
            />
          </div>

          <div className="min-w-[120px]">
            <Label htmlFor="sort">Ordenar por</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Nome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="rating">Avaliação</SelectItem>
                <SelectItem value="productCount">Produtos</SelectItem>
                <SelectItem value="createdAt">Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[120px]">
            <Label htmlFor="order">Ordem</Label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger>
                <SelectValue placeholder="Crescente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Crescente</SelectItem>
                <SelectItem value="desc">Decrescente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Exibindo {filteredStores.length} de {demoStores.length} lojas
            {selectedStore && ` • Loja selecionada: ${selectedStore.name}`}
          </p>
        </div>
      </div>

      <div className="h-[600px] border border-border rounded-lg p-4">
        {viewMode === 'list' ? (
          <VirtualizedStoreList
            stores={filteredStores}
            onStoreClick={handleStoreSelect}
          />
        ) : (
          <VirtualizedStoreGrid
            stores={filteredStores}
            onStoreClick={handleStoreSelect}
            columnCount={3}
            columnWidth={300}
            rowHeight={220}
          />
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs text-muted-foreground">
          Dica: Role a lista para ver a virtualização em ação. A renderização otimizada garante 
          performance mesmo com milhares de itens.
        </p>
      </div>
    </div>
  );
};

// Hook para alternar entre modos de visualização
export const useViewMode = () => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'grid' : 'list');
  };

  return {
    viewMode,
    toggleViewMode,
    setViewMode,
  };
};

// Componente de performance metrics
export const PerformanceMetrics: React.FC<{ stores: Store[] }> = ({ stores }) => {
  const [renderTime, setRenderTime] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

    const timer = setTimeout(() => {
      const endTime = performance.now();
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      setRenderTime(Math.round(endTime - startTime));
      setMemoryUsage(Math.round((finalMemory - initialMemory) / 1024 / 1024));
    }, 100);

    return () => clearTimeout(timer);
  }, [stores]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Métricas de Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-8">
          <div>
            <p className="text-sm text-muted-foreground">
              Tempo de renderização
            </p>
            <p className="text-xl font-semibold text-primary">
              {renderTime}ms
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Uso de memória
            </p>
            <p className="text-xl font-semibold text-primary">
              {memoryUsage}MB
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Total de lojas
            </p>
            <p className="text-xl font-semibold text-primary">
              {stores.length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};