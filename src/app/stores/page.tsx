'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Users, Package, Filter, Grid, List, Loader2 } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import Link from 'next/link';
import { useStoreStoreSafe } from '@/hooks/useAuthStoreSafe';
import OptimizedImage from '@/components/ui/OptimizedImage';



export default function StoresPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('rating');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    stores,
    loading,
    error,
    pagination,
    fetchStores
  } = useStoreStoreSafe();

  // Carregar lojas quando o componente monta ou filtros mudam
  useEffect(() => {
    const filters = {
      search: searchTerm || undefined,
      category: selectedCategory === 'all' ? undefined : selectedCategory
    };
    
    const sortMapping: Record<string, string> = {
      'rating': 'rating',
      'products': 'salesCount',
      'reviews': 'rating',
      'name': 'name'
    };

    fetchStores(filters, currentPage, 12).catch(console.error);
  }, [searchTerm, selectedCategory, sortBy, currentPage, fetchStores]);

  // Função para lidar com mudanças de filtro
  const handleFilterChange = (newFilters: any) => {
    setCurrentPage(1); // Reset para primeira página
    if (newFilters.search !== undefined) setSearchTerm(newFilters.search);
    if (newFilters.category !== undefined) setSelectedCategory(newFilters.category);
  };

  const filteredStores = stores;

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'BÃ¡sico': return 'bg-gray-100 text-gray-700';
      case 'Profissional': return 'bg-blue-100 text-blue-700';
      case 'Premium': return 'bg-purple-100 text-purple-700';
      case 'Empresarial': return 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Lojas Parceiras
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Descubra as melhores lojas e vendedores de {APP_CONFIG.region.fullName}
            </p>
          </div>
        </div>
      </div>

      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters and Search */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar lojas..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="all">Todas as Categorias</option>
                  {APP_CONFIG.categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="rating">Melhor Avaliação</option>
                  <option value="products">Mais Produtos</option>
                  <option value="reviews">Mais Avaliações</option>
                  <option value="name">Nome A-Z</option>
                </select>
              </div>
            </div>

            {/* View Mode and Results */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Carregando lojas...</span>
                  </span>
                ) : (
                  `${pagination.total || 0} loja${(pagination.total || 0) !== 1 ? 's' : ''} encontrada${(pagination.total || 0) !== 1 ? 's' : ''}`
                )}
              </p>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-sm">!</span>
                  </div>
                  <div>
                    <h3 className="text-red-800 font-medium">Erro ao carregar lojas</h3>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    fetchStores({}, currentPage, 12);
                  }}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Carregando lojas...
              </h3>
              <p className="text-gray-600">
                Aguarde enquanto buscamos as melhores lojas para você.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredStores.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma loja encontrada
              </h3>
              <p className="text-gray-600">
                Tente ajustar seus filtros de busca ou explore outras categorias.
              </p>
            </div>
          )}

          {/* Stores Grid/List */}
          {!loading && !error && filteredStores.length > 0 && (
            <div className={viewMode === 'grid' 
              ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-8' 
              : 'space-y-6'
            }>
              {filteredStores.map(store => (
                <Link key={store.id} href={`/stores/${store.id}`}>
                  <div className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}>
                    <div className={viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}>
                      <OptimizedImage
                        src={store.logo || store.banner || `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('modern store front ' + store.category)}&image_size=square`}
                        alt={store.name}
                        className={`w-full object-cover ${
                          viewMode === 'list' ? 'h-full' : 'h-48'
                        }`}
                        fallback={`https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('modern store front ' + store.category)}&image_size=square`}
                      />
                    </div>
                    
                    <div className="p-6 flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                              {store.name}
                            </h3>
                            {store.isVerified && (
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">âœ“</span>
                              </div>
                            )}
                          </div>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            getPlanBadgeColor((store as any).seller?.plan || 'Básico')
                          }`}>
                            {(store as any).seller?.plan || 'Básico'}
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {store.description}
                      </p>

                      <div className="space-y-3">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="font-medium">
                                {((store as any).averageRating || (store as any).seller?.rating || 0).toFixed(1)}
                              </span>
                              <span>({(store as any).totalReviews || (store as any)._count?.reviews || 0})</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Package className="h-4 w-4" />
                              <span>{(store as any)._count?.products || 0} produtos</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{store.city}, {store.state}</span>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-gray-500">
                              Desde {new Date(store.createdAt).toLocaleDateString('pt-BR', {
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                              {store.category}
                            </span>
                          </div>
                        </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-12">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(
                    pagination.totalPages - 4,
                    Math.max(1, currentPage - 2)
                  )) + i;
                  
                  if (pageNum > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                PrÃ³xima
              </button>
            </div>
          )}

          {/* Call to Action */}
          <div className="mt-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">
              Quer vender no {APP_CONFIG.name}?
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Junte-se Ã s melhores lojas de {APP_CONFIG.region.fullName} e alcance milhares de clientes. 
              Comece com 30 dias grÃ¡tis!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Ver Planos
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
