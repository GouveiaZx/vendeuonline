import React, { useMemo, useCallback } from 'react';
import {
  Star,
  MapPin,
  Package,
  Store,
  Heart,
  ShoppingCart,
  Eye,
  Filter,
  Grid,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  useSearchResults,
  useSearchFilters,
  useSearchLoading,
  useSearchError,
  useSearchActions
} from '@/hooks/useSSRSafeSearch';
import { SearchProduct, SearchStoreData, SearchFilters as SearchFiltersType } from '@/types';
import { formatters } from '@/utils/formatters';

interface SearchResultsProps {
  className?: string;
}

interface ProductCardProps {
  product: SearchProduct;
  viewMode: 'grid' | 'list';
}

interface StoreCardProps {
  store: SearchStoreData;
  viewMode: 'grid' | 'list';
}

const ProductCard = React.memo<ProductCardProps>(({ product, viewMode }) => {
  // Memoized star rendering function
  const renderStars = useCallback((rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">
          {(Number(rating) || 0).toFixed(1)} ({product.reviewCount || 0})
        </span>
      </div>
    );
  }, []);

  // Memoized computed values
  const computedValues = useMemo(() => ({
    discountPercent: product.originalPrice && product.originalPrice > product.price 
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0,
    placeholderImage: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`product ${product.name}`)}&image_size=square`
  }), [product.originalPrice, product.price, product.name]);

  if (viewMode === 'list') {
    return (
      <div className="flex space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
        {/* Imagem */}
        <div className="flex-shrink-0">
          <img
            src={product.image || computedValues.placeholderImage}
            alt={product.name}
            className="w-24 h-24 object-cover rounded-lg"
          />
        </div>
        
        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {product.description}
              </p>
              
              {/* Loja */}
              <div className="flex items-center space-x-1 mt-2">
                <Store className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-600">{product.storeName}</span>
              </div>
              
              {/* Avaliação */}
              <div className="mt-2">
                {renderStars(product.rating || 0)}
              </div>
            </div>
            
            {/* Preço e ações */}
            <div className="flex flex-col items-end space-y-2 ml-4">
              <div className="text-right">
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="text-sm text-gray-500 line-through">
                    {formatters.formatPrice(product.originalPrice)}
                  </div>
                )}
                <div className="text-xl font-bold text-gray-900">
                  {formatters.formatPrice(product.price)}
                </div>
                {computedValues.discountPercent > 0 && (
                  <div className="text-sm text-green-600 font-medium">
                    {computedValues.discountPercent}% OFF
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button className="p-2 text-gray-400 hover:text-red-500 focus:outline-none">
                  <Heart className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-blue-500 focus:outline-none">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <ShoppingCart className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Imagem */}
      <div className="relative">
        <img
          src={product.image || computedValues.placeholderImage}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        {computedValues.discountPercent > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
            {computedValues.discountPercent}% OFF
          </div>
        )}
        <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md text-gray-400 hover:text-red-500 focus:outline-none">
          <Heart className="h-4 w-4" />
        </button>
      </div>
      
      {/* Conteúdo */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate" title={product.name}>
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {product.description}
        </p>
        
        {/* Loja */}
        <div className="flex items-center space-x-1 mt-2">
          <Store className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-600 truncate">{product.storeName}</span>
        </div>
        
        {/* Avaliação */}
        <div className="mt-2">
          {renderStars(product.rating || 0)}
        </div>
        
        {/* Preço */}
        <div className="mt-3">
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="text-sm text-gray-500 line-through">
              {formatters.formatPrice(product.originalPrice)}
            </div>
          )}
          <div className="text-lg font-bold text-gray-900">
            {formatters.formatPrice(product.price)}
          </div>
        </div>
        
        {/* Ações */}
        <div className="flex items-center justify-between mt-4">
          <button className="p-2 text-gray-400 hover:text-blue-500 focus:outline-none">
            <Eye className="h-4 w-4" />
          </button>
          <button className="flex-1 mx-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium">
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
});

// Display name for debugging
ProductCard.displayName = 'SearchProductCard';

const StoreCard = React.memo<StoreCardProps>(({ store, viewMode }) => {
  const renderStars = useCallback((rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">
          {(Number(rating) || 0).toFixed(1)} ({store.reviewCount || 0})
        </span>
      </div>
    );
  }, []);

  // Memoized computed values
  const computedValues = useMemo(() => ({
    placeholderImage: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`store logo ${store.name}`)}&image_size=square`
  }), [store.name]);

  if (viewMode === 'list') {
    return (
      <div className="flex space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
        {/* Logo */}
        <div className="flex-shrink-0">
          <img
            src={store.logo || computedValues.placeholderImage}
            alt={store.name}
            className="w-16 h-16 object-cover rounded-lg"
          />
        </div>
        
        {/* Conteúdo */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{store.name}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {store.description}
          </p>
          
          <div className="flex items-center space-x-4 mt-2">
            {/* Localização */}
            {store.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-600">{store.location}</span>
              </div>
            )}
            
            {/* Produtos */}
            <div className="flex items-center space-x-1">
              <Package className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600">
                {store.productCount} produto{store.productCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          {/* Avaliação */}
          <div className="mt-2">
            {renderStars(store.rating || 0)}
          </div>
        </div>
        
        {/* Ação */}
        <div className="flex items-center">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium">
            Visitar Loja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Logo */}
      <div className="p-4 text-center">
        <img
          src={store.logo || computedValues.placeholderImage}
          alt={store.name}
          className="w-16 h-16 object-cover rounded-lg mx-auto"
        />
      </div>
      
      {/* Conteúdo */}
      <div className="px-4 pb-4">
        <h3 className="font-semibold text-gray-900 text-center truncate" title={store.name}>
          {store.name}
        </h3>
        <p className="text-sm text-gray-600 mt-1 text-center line-clamp-2">
          {store.description}
        </p>
        
        {/* Informações */}
        <div className="mt-3 space-y-2">
          {store.location && (
            <div className="flex items-center justify-center space-x-1">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600 truncate">{store.location}</span>
            </div>
          )}
          
          <div className="flex items-center justify-center space-x-1">
            <Package className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-600">
              {store.productCount} produto{store.productCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        {/* Avaliação */}
        <div className="mt-3 flex justify-center">
          {renderStars(store.rating || 0)}
        </div>
        
        {/* Ação */}
        <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium">
          Visitar Loja
        </button>
      </div>
    </div>
  );
});

// Display name for debugging
StoreCard.displayName = 'SearchStoreCard';

export const SearchResults: React.FC<SearchResultsProps> = ({ className = "" }) => {
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = React.useState(1);
  
  const results = useSearchResults();
  const filters = useSearchFilters();
  const loading = useSearchLoading();
  const error = useSearchError();
  const { setFilters } = useSearchActions();

  // Sincronizar página com filtros
  React.useEffect(() => {
    setCurrentPage(filters.page || 1);
  }, [filters.page]);

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters({ 
      sortBy: sortBy as SearchFiltersType['sortBy'], 
      sortOrder, 
      page: 1 
    });
  };

  const handlePageChange = (page: number) => {
    setFilters({ page });
    setCurrentPage(page);
    // Scroll para o topo dos resultados
    document.getElementById('search-results-top')?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (!results?.pagination) return null;

    const { currentPage, totalPages, hasNext, hasPrev } = results?.pagination || { currentPage: 1, totalPages: 1, hasNext: false, hasPrev: false };
    const page = currentPage || 1;
    const pages = [];
    
    // Calcular páginas a mostrar
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages || 1, page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={!hasPrev}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded focus:outline-none"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-400">...</span>}
          </>
        )}
        
        {pages.map(pageNum => (
          <button
            key={pageNum}
            onClick={() => handlePageChange(pageNum)}
            className={`px-3 py-2 text-sm rounded focus:outline-none ${
              pageNum === page
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {pageNum}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded focus:outline-none"
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={!hasNext}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Buscando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="text-red-600 mb-2">Erro na busca</div>
          <div className="text-gray-600">{error || 'Erro desconhecido'}</div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="text-gray-600">Digite algo para buscar</div>
        </div>
      </div>
    );
  }

  const totalResults = (results?.products?.length || 0) + (results?.stores?.length || 0);

  if (totalResults === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="text-gray-600 mb-2">Nenhum resultado encontrado</div>
          <div className="text-sm text-gray-500">Tente ajustar os filtros ou usar termos diferentes</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div id="search-results-top" />
      
      {/* Cabeçalho dos resultados */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {totalResults} resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
          </h2>
          
          {results.pagination && (
            <span className="text-sm text-gray-600">
              Página {results.pagination.currentPage || 1} de {results.pagination.totalPages || 1}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Ordenação */}
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleSortChange(sortBy, sortOrder as 'asc' | 'desc');
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="relevance-desc">Mais relevantes</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="rating-desc">Melhor avaliação</option>
            <option value="name-asc">Nome A-Z</option>
            <option value="name-desc">Nome Z-A</option>
          </select>
          
          {/* Modo de visualização */}
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 focus:outline-none ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 focus:outline-none ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Resultados de Lojas */}
      {results.stores && results.stores.length > 0 && (
        <div className="mb-8">
          <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Store className="h-4 w-4" />
            <span>Lojas ({results.stores.length})</span>
          </h3>
          <div className={`${
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-4'
          }`}>
            {results.stores.map(store => (
              <StoreCard key={store.id} store={store} viewMode={viewMode} />
            ))}
          </div>
        </div>
      )}
      
      {/* Resultados de Produtos */}
      {results.products && results.products.length > 0 && (
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Produtos ({results.products.length})</span>
          </h3>
          <div className={`${
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-4'
          }`}>
            {results.products.map(product => (
              <ProductCard key={product.id} product={product} viewMode={viewMode} />
            ))}
          </div>
        </div>
      )}
      
      {/* Paginação */}
      {renderPagination()}
    </div>
  );
};

export default SearchResults;