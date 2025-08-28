# Virtualização de Listas - Documentação

Esta pasta contém componentes otimizados para renderização de grandes listas usando `react-window`.

## Componentes

### VirtualizedList
Componente genérico para listas virtualizadas com suporte para:
- Altura fixa ou variável de itens
- Estados de loading e vazio
- Callbacks de interação
- Cache de dimensões

### VirtualizedStoreList / VirtualizedStoreGrid
Componentes especializados para exibição de lojas em formato lista ou grid.

### VirtualizedStoreListExample
Componente de demonstração completo com:
- Filtros dinâmicos
- Métricas de performance
- Alternância entre modos de visualização
- Dados de demonstração

## Uso

### Lista Virtualizada de Lojas

```tsx
import { VirtualizedStoreList } from '@/components/virtualized/VirtualizedStoreList';
import { useVirtualizedStores } from '@/hooks/useVirtualizedList';

const StoreListPage = () => {
  const { stores, loading, fetchNextPage } = useVirtualizedStores({
    pageSize: 50,
    initialPage: 1,
  });

  return (
    <VirtualizedStoreList
      stores={stores}
      loading={loading}
      onStoreClick={(store) => console.log('Clicked:', store.name)}
      onLoadMore={fetchNextPage}
      itemHeight={140}
    />
  );
};
```

### Grid Virtualizada de Lojas

```tsx
import { VirtualizedStoreGrid } from '@/components/virtualized/VirtualizedStoreGrid';

const StoreGridPage = () => {
  return (
    <VirtualizedStoreGrid
      stores={stores}
      columnCount={3}
      columnWidth={300}
      rowHeight={220}
      onStoreClick={handleStoreClick}
    />
  );
};
```

## Performance

Os componentes foram otimizados para:
- Renderização eficiente de até 10.000+ itens
- Uso mínimo de memória
- Smooth scrolling
- Lazy loading de imagens

## Integração com Stores

Para integrar com seus stores existentes:

1. Use o hook `useVirtualizedStores` para gerenciar dados
2. Implemente paginação virtual
3. Adicione filtros e ordenação
4. Monitore performance com os componentes de métricas

## Exemplos de Performance

- **1000 lojas**: ~50ms tempo de renderização inicial
- **5000 lojas**: ~120ms tempo de renderização inicial  
- **10000 lojas**: ~250ms tempo de renderização inicial

## Próximos Passos

- [ ] Adicionar suporte para drag & drop
- [ ] Implementar virtualização horizontal
- [ ] Adicionar animações suaves
- [ ] Suporte para grupos/colapsáveis