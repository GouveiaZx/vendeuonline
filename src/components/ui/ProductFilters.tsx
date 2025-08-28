'use client';

import { useState, useEffect, useRef } from 'react';
import { Star, X, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { formatters } from '@/utils/formatters';
import { useRegionSearch } from '@/hooks/useRegions';

interface ProductFiltersProps {
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  selectedBrands: string[];
  onBrandsChange: (brands: string[]) => void;
  availableBrands: string[];
  selectedConditions: string[];
  onConditionsChange: (conditions: string[]) => void;
  availableConditions: string[];
  freeShippingOnly: boolean;
  onFreeShippingChange: (value: boolean) => void;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
  selectedCity: string;
  selectedState: string;
  onRegionChange: (city: string, state: string) => void;
}

export function ProductFilters({
  priceRange,
  onPriceRangeChange,
  selectedBrands,
  onBrandsChange,
  availableBrands,
  selectedConditions,
  onConditionsChange,
  availableConditions,
  freeShippingOnly,
  onFreeShippingChange,
  minRating,
  onMinRatingChange,
  selectedCity,
  selectedState,
  onRegionChange
}: ProductFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    brands: true,
    conditions: true,
    shipping: true,
    rating: true,
    region: true
  });

  const [showRegionSearch, setShowRegionSearch] = useState(false);
  const regionSearchRef = useRef<HTMLDivElement>(null);
  const { searchTerm, setSearchTerm, regions, loading: regionsLoading } = useRegionSearch();



  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleBrandToggle = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      onBrandsChange(selectedBrands.filter(b => b !== brand));
    } else {
      onBrandsChange([...selectedBrands, brand]);
    }
  };

  const handleConditionToggle = (condition: string) => {
    if (selectedConditions.includes(condition)) {
      onConditionsChange(selectedConditions.filter(c => c !== condition));
    } else {
      onConditionsChange([...selectedConditions, condition]);
    }
  };

  const handleRegionChange = (city: string, state: string) => {
    onRegionChange(city, state);
    setShowRegionSearch(false);
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (regionSearchRef.current && !regionSearchRef.current.contains(event.target as Node)) {
        setShowRegionSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderStars = (rating: number, interactive = false, onClick?: () => void) => {
    return (
      <div 
        className={`flex items-center gap-1 ${interactive ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const clearAllFilters = () => {
    onPriceRangeChange([0, 10000]);
    onBrandsChange([]);
    onConditionsChange([]);
    onFreeShippingChange(false);
    onMinRatingChange(0);
    onRegionChange('', '');
  };

  const hasActiveFilters = 
    priceRange[0] > 0 || 
    priceRange[1] < 10000 || 
    selectedBrands.length > 0 || 
    selectedConditions.length > 0 || 
    freeShippingOnly || 
    minRating > 0 ||
    selectedCity || 
    selectedState;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Limpar
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Price Range */}
        <div>
          <button
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="font-medium text-gray-900">Faixa de Preço</h4>
            {expandedSections.price ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          
          {expandedSections.price && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Mínimo</label>
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => onPriceRangeChange([Number(e.target.value), priceRange[1]])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Máximo</label>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10000"
                  />
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                {formatters.formatPrice(priceRange[0])} - {formatters.formatPrice(priceRange[1])}
              </div>
              
              {/* Quick price ranges */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  [0, 100],
                  [100, 500],
                  [500, 1000],
                  [1000, 5000]
                ].map(([min, max]) => (
                  <button
                    key={`${min}-${max}`}
                    onClick={() => onPriceRangeChange([min, max])}
                    className={`text-xs px-3 py-2 rounded-md border transition-colors ${
                      priceRange[0] === min && priceRange[1] === max
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {formatters.formatPrice(min)} - {formatters.formatPrice(max)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Brands */}
        <div>
          <button
            onClick={() => toggleSection('brands')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="font-medium text-gray-900">Marcas</h4>
            {expandedSections.brands ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          
          {expandedSections.brands && (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              {availableBrands.map(brand => (
                <label key={brand} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => handleBrandToggle(brand)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{brand}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Conditions */}
        <div>
          <button
            onClick={() => toggleSection('conditions')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="font-medium text-gray-900">Condição</h4>
            {expandedSections.conditions ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          
          {expandedSections.conditions && (
            <div className="mt-4 space-y-2">
              {availableConditions.map(condition => (
                <label key={condition} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedConditions.includes(condition)}
                    onChange={() => handleConditionToggle(condition)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{condition}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Shipping */}
        <div>
          <button
            onClick={() => toggleSection('shipping')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="font-medium text-gray-900">Entrega</h4>
            {expandedSections.shipping ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          
          {expandedSections.shipping && (
            <div className="mt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeShippingOnly}
                  onChange={(e) => onFreeShippingChange(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Apenas frete grátis</span>
              </label>
            </div>
          )}
        </div>

        {/* Rating */}
        <div>
          <button
            onClick={() => toggleSection('rating')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="font-medium text-gray-900">Avaliação</h4>
            {expandedSections.rating ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          
          {expandedSections.rating && (
            <div className="mt-4 space-y-2">
              {[4, 3, 2, 1].map(rating => (
                <button
                  key={rating}
                  onClick={() => onMinRatingChange(rating)}
                  className={`flex items-center gap-2 w-full text-left p-2 rounded-md transition-colors ${
                    minRating === rating
                      ? 'bg-blue-50 border border-blue-300'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {renderStars(rating)}
                  <span className="text-sm text-gray-700">e acima</span>
                </button>
              ))}
              
              {minRating > 0 && (
                <button
                  onClick={() => onMinRatingChange(0)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Limpar filtro de avaliação
                </button>
              )}
            </div>
          )}
        </div>

        {/* Region Filter */}
        <div>
          <button
            onClick={() => toggleSection('region')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="font-medium text-gray-900">Região</h4>
            {expandedSections.region ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          
          {expandedSections.region && (
            <div className="mt-4 space-y-3">
              {/* Active Region Filters */}
              {(selectedCity || selectedState) && (
                <div className="space-y-2">
                  {selectedCity && (
                    <div className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-md">
                      <span className="text-sm text-blue-700">Cidade: {selectedCity}</span>
                      <button
                        onClick={() => handleRegionChange('', selectedState)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {selectedState && (
                    <div className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-md">
                      <span className="text-sm text-blue-700">Estado: {selectedState}</span>
                      <button
                        onClick={() => handleRegionChange(selectedCity, '')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Region Search */}
              <div className="relative" ref={regionSearchRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar cidade ou estado..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowRegionSearch(true)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Search Results */}
                {showRegionSearch && searchTerm && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {regionsLoading ? (
                      <div className="p-3 text-sm text-gray-500">Buscando...</div>
                    ) : (
                      <>
                        {/* States */}
                        {regions.states.length > 0 && (
                          <div>
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">Estados</div>
                            {regions.states.map((state) => (
                              <button
                                key={`state-${state}`}
                                onClick={() => handleRegionChange('', state)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex justify-between items-center">
                                  <span>{state}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Cities */}
                        {regions.cities.length > 0 && (
                          <div>
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">Cidades</div>
                            {regions.cities.map((city) => (
                              <button
                                key={`city-${city.city}-${city.state}`}
                                onClick={() => handleRegionChange(city.city, city.state)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex justify-between items-center">
                                  <span>{city.city}, {city.state}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {regions.states.length === 0 && regions.cities.length === 0 && (
                          <div className="p-3 text-sm text-gray-500">Nenhuma região encontrada</div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Popular Regions */}
              {!searchTerm && regions.stats.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Regiões populares</h5>
                  <div className="space-y-1">
                    {regions.stats.slice(0, 5).map((stat) => (
                      <button
                        key={`${stat.city}-${stat.state}`}
                        onClick={() => handleRegionChange(stat.city || '', stat.state || '')}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-md transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span>{stat.city ? `${stat.city}, ${stat.state}` : stat.state}</span>
                          <span className="text-xs text-gray-500">{stat.storeCount} lojas</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h5 className="text-sm font-medium text-gray-900 mb-3">Filtros ativos:</h5>
          <div className="space-y-2">
            {(priceRange[0] > 0 || priceRange[1] < 10000) && (
              <div className="text-xs text-gray-600">
                Preço: {formatters.formatPrice(priceRange[0])} - {formatters.formatPrice(priceRange[1])}
              </div>
            )}
            {selectedBrands.length > 0 && (
              <div className="text-xs text-gray-600">
                Marcas: {selectedBrands.join(', ')}
              </div>
            )}
            {selectedConditions.length > 0 && (
              <div className="text-xs text-gray-600">
                Condição: {selectedConditions.join(', ')}
              </div>
            )}
            {freeShippingOnly && (
              <div className="text-xs text-gray-600">
                Apenas frete grátis
              </div>
            )}
            {minRating > 0 && (
              <div className="text-xs text-gray-600">
                Avaliação: {minRating}+ estrelas
              </div>
            )}
            {selectedCity && (
              <div className="text-xs text-gray-600">
                Cidade: {selectedCity}
              </div>
            )}
            {selectedState && (
              <div className="text-xs text-gray-600">
                Estado: {selectedState}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductFilters;