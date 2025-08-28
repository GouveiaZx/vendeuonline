'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  useSearchQuery,
  useSearchFilters,
  useSearchActions,
  useSearchShowFilters,
  useSearchError
} from '@/store/searchStore';
import SearchBar from '@/components/search/SearchBar';
import SearchFilters from '@/components/search/SearchFilters';
import SearchResults from '@/components/search/SearchResults';
import { X, AlertCircle } from 'lucide-react';

const SearchPageContent: React.FC = () => {
  const searchParams = useSearchParams();
  
  const query = useSearchQuery();
  const filters = useSearchFilters();
  const error = useSearchError();
  const showFilters = useSearchShowFilters();
  const { setQuery, setFilters, search, clearError } = useSearchActions();

  // Sincronizar com URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    const urlCategory = searchParams.get('category');
    const urlMinPrice = searchParams.get('minPrice');
    const urlMaxPrice = searchParams.get('maxPrice');
    const urlType = searchParams.get('type');
    const urlSortBy = searchParams.get('sortBy');
    const urlSortOrder = searchParams.get('sortOrder');
    const urlPage = searchParams.get('page');

    // Construir filtros da URL
    const urlFilters: any = {
      ...filters,
      q: urlQuery
    };

    if (urlCategory) {
      urlFilters.categories = [urlCategory];
    }

    if (urlMinPrice || urlMaxPrice) {
      urlFilters.priceRange = {
        min: urlMinPrice ? Number(urlMinPrice) : undefined,
        max: urlMaxPrice ? Number(urlMaxPrice) : undefined
      };
    }

    if (urlType) {
      urlFilters.type = urlType;
    }

    if (urlSortBy) {
      urlFilters.sortBy = urlSortBy;
    }

    if (urlSortOrder) {
      urlFilters.sortOrder = urlSortOrder;
    }

    if (urlPage) {
      urlFilters.page = Number(urlPage);
    }

    // Atualizar estado se houver diferenças
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }

    if (JSON.stringify(urlFilters) !== JSON.stringify(filters)) {
      setFilters(urlFilters);
    }

    // Executar busca se houver query
    if (urlQuery) {
      search();
    }
  }, [searchParams, query, filters, setQuery, setFilters, search]);

  const handleClearError = () => {
    clearError();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Buscar Produtos
          </h1>
          <SearchBar />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
            <button
              onClick={handleClearError}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Filtros
              </h2>
              <SearchFilters />
            </div>
          </div>

          {/* Results */}
          <div className="lg:w-3/4">
            <SearchResults />
          </div>
        </div>
      </div>
    </div>
  );
};

const SearchPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando busca...</p>
      </div>
    </div>}>
      <SearchPageContent />
    </Suspense>
  );
};

export default SearchPage;