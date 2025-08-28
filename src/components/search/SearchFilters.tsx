import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Star,
  DollarSign,
  Tag,
  Store,
  Package,
  Search,
  Loader2
} from 'lucide-react';
import { useRegionSearch } from '@/hooks/useRegions';
import {
  useSearchFilters,
  useSearchActions,
  useSearchResults,
  useSearchShowFilters,
  useSearchLoading
} from '@/hooks/useSSRSafeSearch';
import type { SearchFilters } from '@/types';

interface SearchFiltersProps {
  className?: string;
  onClose?: () => void;
}

interface AggregatedFilters {
  categories?: Array<{
    id: string;
    name: string;
    count: number;
  }>;
}

interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  icon,
  children,
  defaultOpen = true
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-200"
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <div className={`transform transition-transform duration-200 ${
          isOpen ? 'rotate-0' : 'rotate-180'
        }`}>
          <ChevronUp className="h-4 w-4 text-gray-500" />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
};

const SearchFiltersPanel: React.FC<SearchFiltersProps> = ({
  className = "",
  onClose
}) => {
  const filters = useSearchFilters();
  const results = useSearchResults();
  const showFilters = useSearchShowFilters();
  const loading = useSearchLoading();
  const { setFilters, clearFilters, toggleFilters } = useSearchActions();
  const { searchTerm, setSearchTerm, regions, loading: regionsLoading } = useRegionSearch();

  const [localFilters, setLocalFilters] = useState<Partial<SearchFilters>>(filters);
  const [showRegionSearch, setShowRegionSearch] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const regionSearchRef = useRef<HTMLDivElement>(null);

  // Calcular filtros agregados dos resultados
  const rawFilters = results?.aggregations || results?.filters;
  const aggregatedFilters: AggregatedFilters | undefined = rawFilters ? {
    categories: Array.isArray(rawFilters.categories) 
      ? rawFilters.categories.map((cat: string | {id: string; name: string; count: number}) => 
          typeof cat === 'string' ? { id: cat, name: cat, count: 0 } : cat
        )
      : undefined
  } : undefined;

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (regionSearchRef.current && !regionSearchRef.current.contains(event.target as Node)) {
        setShowRegionSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounce para busca de região
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Sincronizar filtros locais com o store
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = useCallback(async (key: keyof SearchFilters, value: any) => {
    setIsApplyingFilters(true);
    
    const newFilters = {
      ...localFilters,
      [key]: value
    };
    
    setLocalFilters(newFilters);
    
    // Aplicar filtros com debounce
    setTimeout(() => {
      setFilters(newFilters);
      setIsApplyingFilters(false);
    }, 300);
  }, [localFilters, setFilters]);

  const handleArrayFilterChange = (key: keyof SearchFilters, value: string, checked: boolean) => {
    const currentValue = localFilters[key];
    const currentArray = Array.isArray(currentValue) ? currentValue : [];
    let newArray: string[];
    
    if (checked) {
      newArray = [...currentArray.map(String), value];
    } else {
      newArray = currentArray.map(String).filter(item => item !== value);
    }
    
    handleFilterChange(key, newArray.length > 0 ? newArray : undefined);
  };

  const handlePriceRangeChange = (min?: number, max?: number) => {
    const newFilters = { ...localFilters };
    if (min !== undefined || max !== undefined) {
      newFilters.priceRange = [min || 0, max || 999999];
    } else {
      delete newFilters.priceRange;
    }
    setLocalFilters(newFilters);
  };

  const handleLocationChange = (lat?: number, lng?: number, radius?: number) => {
    if (lat !== undefined && lng !== undefined) {
      handleFilterChange('location', { lat, lng, radius: radius || 10 });
    } else {
      handleFilterChange('location', undefined);
    }
  };

  const handleRegionChange = (city?: string, state?: string) => {
    const newFilters = { ...localFilters };
    if (city) newFilters.city = city;
    if (state) newFilters.state = state;
    if (!city && !state) {
      delete newFilters.city;
      delete newFilters.state;
    }
    setLocalFilters(newFilters);
  };

  const handleClearFilters = () => {
    clearFilters();
    setLocalFilters(filters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.category) count++;
    if (localFilters.priceRange) count++;
    if (localFilters.location) count++;
    if (localFilters.city || localFilters.state) count++;
    if (localFilters.rating) count++;
    if (localFilters.inStock !== undefined) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();



  if (!showFilters) {
    return null;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtros</h3>
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
              {activeFiltersCount}
            </span>
          )}
          {isApplyingFilters && (
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              Limpar
            </button>
          )}
          <button
            onClick={onClose || toggleFilters}
            className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="max-h-96 overflow-y-auto">
        {/* Tipo de Busca */}
        <FilterSection
          title="Tipo"
          icon={<Package className="h-4 w-4 text-gray-600" />}
        >
          <div className="space-y-2">
            {[
              { value: 'all', label: 'Todos' },
              { value: 'products', label: 'Produtos' },
              { value: 'stores', label: 'Lojas' }
            ].map(option => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={option.value}
                  checked={localFilters.type === option.value}
                  onChange={(e) => handleFilterChange('type', e.target.value as 'products' | 'stores' | 'all')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Categorias */}
        <FilterSection
          title="Categorias"
          icon={<Tag className="h-4 w-4 text-gray-600" />}
        >
          <div className="space-y-2">
            {aggregatedFilters?.categories?.map(category => (
              <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.categories?.includes(category.id) || false}
                  onChange={(e) => handleArrayFilterChange('categories', category.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex-1">{category.name}</span>
                <span className="text-xs text-gray-500">({category.count})</span>
              </label>
            )) || [
              'Eletrônicos',
              'Roupas',
              'Casa e Jardim',
              'Esportes',
              'Livros',
              'Beleza'
            ].map(category => (
              <label key={category} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.categories?.includes(category) || false}
                  onChange={(e) => handleArrayFilterChange('categories', category, e.target.checked)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{category}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Faixa de Preço */}
        <FilterSection
          title="Preço"
          icon={<DollarSign className="h-4 w-4 text-gray-600" />}
        >
          <div className="space-y-3">
            {/* Faixas predefinidas */}
            <div className="space-y-2">
              {[
                { label: 'Até R$ 50', max: 50 },
                { label: 'R$ 50 - R$ 100', min: 50, max: 100 },
                { label: 'R$ 100 - R$ 200', min: 100, max: 200 },
                { label: 'R$ 200 - R$ 500', min: 200, max: 500 },
                { label: 'Acima de R$ 500', min: 500 }
              ].map(range => {
                const priceRange = localFilters.priceRange;
                const isObjectRange = priceRange && typeof priceRange === 'object' && !Array.isArray(priceRange);
                const isSelected = 
                  (isObjectRange ? priceRange.min : undefined) === range.min &&
                  (isObjectRange ? priceRange.max : undefined) === range.max;
                
                return (
                  <label key={range.label} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={isSelected}
                      onChange={() => handlePriceRangeChange(range.min, range.max)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{range.label}</span>
                  </label>
                );
              })}
            </div>
            
            {/* Inputs customizados */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={(() => {
                    const priceRange = localFilters.priceRange;
                    const isObjectRange = priceRange && typeof priceRange === 'object' && !Array.isArray(priceRange);
                    return isObjectRange ? priceRange.min || '' : '';
                  })()}
                  onChange={(e) => {
                    const min = e.target.value ? Number(e.target.value) : undefined;
                    const priceRange = localFilters.priceRange;
                    const isObjectRange = priceRange && typeof priceRange === 'object' && !Array.isArray(priceRange);
                    const currentMax = isObjectRange ? priceRange.max : undefined;
                    handlePriceRangeChange(min, currentMax);
                  }}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={(() => {
                    const priceRange = localFilters.priceRange;
                    const isObjectRange = priceRange && typeof priceRange === 'object' && !Array.isArray(priceRange);
                    return isObjectRange ? priceRange.max || '' : '';
                  })()}
                  onChange={(e) => {
                    const max = e.target.value ? Number(e.target.value) : undefined;
                    const priceRange = localFilters.priceRange;
                    const isObjectRange = priceRange && typeof priceRange === 'object' && !Array.isArray(priceRange);
                    const currentMin = isObjectRange ? priceRange.min : undefined;
                    handlePriceRangeChange(currentMin, max);
                  }}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </FilterSection>

        {/* Avaliação */}
        <FilterSection
          title="Avaliação"
          icon={<Star className="h-4 w-4 text-gray-600" />}
        >
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => (
                <label key={rating} className={`flex items-center space-x-2 cursor-pointer p-2 rounded-md transition-colors duration-200 hover:bg-gray-50 ${
                  localFilters.rating === rating ? 'bg-blue-50 border border-blue-200' : ''
                }`}>
                  <input
                    type="radio"
                    name="rating"
                    checked={localFilters.rating === rating}
                    onChange={() => handleFilterChange('rating', rating)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 transition-colors duration-200 ${
                        i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-700 ml-1">
                    {rating === 5 ? '5 estrelas' : `${rating}+ estrelas`}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Região */}
        <FilterSection
          title="Região"
          icon={<MapPin className="h-4 w-4 text-gray-600" />}
        >
          <div className="space-y-3">
            {/* Filtros atuais de região */}
            {(localFilters.city || localFilters.state) && (
              <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {localFilters.city && localFilters.state 
                        ? `${localFilters.city}, ${localFilters.state}`
                        : localFilters.city || localFilters.state
                      }
                    </span>
                  </div>
                  <button
                    onClick={() => handleRegionChange()}
                    className="text-blue-600 hover:text-blue-800 transition-colors duration-200 p-1 rounded-full hover:bg-blue-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Busca de região */}
            <div className="relative" ref={regionSearchRef}>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar cidade ou estado..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowRegionSearch(true)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Resultados da busca */}
              {showRegionSearch && debouncedSearchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {regionsLoading ? (
                    <div className="p-3 text-sm text-gray-500 text-center flex items-center justify-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Buscando regiões...</span>
                    </div>
                  ) : (
                    <>
                      {/* Estados */}
                      {regions.states.length > 0 && (
                        <div>
                          <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                            Estados
                          </div>
                          {regions.states.map(state => (
                            <button
                              key={`state-${state}`}
                              onClick={() => {
                                handleRegionChange(undefined, state);
                                setShowRegionSearch(false);
                                setSearchTerm('');
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                            >
                              {state}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Cidades */}
                      {regions.cities.length > 0 && (
                        <div>
                          <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                            Cidades
                          </div>
                          {regions.cities.map(region => (
                            <button
                              key={`city-${region.city}-${region.state}`}
                              onClick={() => {
                                handleRegionChange(region.city, region.state);
                                setShowRegionSearch(false);
                                setSearchTerm('');
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                            >
                              {region.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {regions.states.length === 0 && regions.cities.length === 0 && (
                        <div className="p-3 text-sm text-gray-500 text-center">
                          Nenhuma região encontrada
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Regiões populares */}
            {!showRegionSearch && regions.stats.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">
                  Regiões populares
                </div>
                <div className="space-y-1">
                  {regions.stats.slice(0, 5).map(stat => (
                    <button
                      key={`stat-${stat.city}-${stat.state}`}
                      onClick={() => handleRegionChange(stat.city, stat.state)}
                      className="w-full flex items-center justify-between px-2 py-1 text-sm text-left hover:bg-gray-50 rounded"
                    >
                      <span>{stat.label}</span>
                      <span className="text-xs text-gray-500">
                        {stat.storeCount} {stat.storeCount === 1 ? 'loja' : 'lojas'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </FilterSection>

        {/* Localização */}
        <FilterSection
          title="Localização GPS"
          icon={<MapPin className="h-4 w-4 text-gray-600" />}
        >
          <div className="space-y-3">
            {/* Raio de busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Raio de busca
              </label>
              <select
                value={typeof localFilters.location === 'object' && localFilters.location ? localFilters.location.radius || 10 : 10}
                onChange={(e) => {
                  const radius = Number(e.target.value);
                  if (localFilters.location && typeof localFilters.location === 'object') {
                    handleLocationChange(
                      localFilters.location.lat,
                      localFilters.location.lng,
                      radius
                    );
                  }
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
              </select>
            </div>
            
            {/* Botão para usar localização atual */}
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      handleLocationChange(
                        position.coords.latitude,
                        position.coords.longitude,
                        typeof localFilters.location === 'object' && localFilters.location ? localFilters.location.radius || 10 : 10
                      );
                    },
                    (error) => {
                      console.error('Erro ao obter localização:', error);
                    }
                  );
                }
              }}
              className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              Usar minha localização
            </button>
            
            {localFilters.location && (
              <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <div className="text-xs text-green-800">
                      <div className="font-medium">Localização GPS</div>
                      <div>
                        {typeof localFilters.location === 'object' && localFilters.location ? localFilters.location.lat.toFixed(4) : '0.0000'}, {typeof localFilters.location === 'object' && localFilters.location ? localFilters.location.lng.toFixed(4) : '0.0000'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLocationChange()}
                    className="text-red-500 hover:text-red-700 transition-colors duration-200 p-1 rounded-full hover:bg-red-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </FilterSection>

        {/* Outras opções */}
        <FilterSection
          title="Outras opções"
          icon={<Filter className="h-4 w-4 text-gray-600" />}
        >
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.inStock || false}
                onChange={(e) => handleFilterChange('inStock', e.target.checked || undefined)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Apenas em estoque</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.hasDiscount || false}
                onChange={(e) => handleFilterChange('hasDiscount', e.target.checked || undefined)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Com desconto</span>
            </label>
          </div>
        </FilterSection>
      </div>
    </div>
  );
};

export default SearchFiltersPanel;
