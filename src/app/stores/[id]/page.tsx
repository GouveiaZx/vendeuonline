'use client';

import { useState, useEffect } from 'react';
import { Star, MapPin, Phone, Mail, MessageCircle, Package, Users, Calendar, Shield, Filter, Grid, List, Heart, Loader2, AlertCircle } from 'lucide-react';
import { useStoreStore } from '@/store/storeStore';
import { useProductStore } from '@/store/productStore';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import ProductCard from '@/components/ui/ProductCard';
import { ReviewList, ReviewForm, RatingSummary } from '@/components/reviews';
import { useReviewStore } from '@/store/reviewStore';
import { useAuthStore } from '@/store/authStore';







export default function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const [activeTab, setActiveTab] = useState('products');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('popular');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  // Store hooks
  const { 
    currentStore, 
    loading: storeLoading, 
    error: storeError, 
    fetchStoreById,
    clearError: clearStoreError 
  } = useStoreStore();
  
  const { getProductsByStore } = useProductStore();
  const { user } = useAuthStore();
  const { reviews, reviewStats, fetchReviews, fetchReviewStats } = useReviewStore();

  // Resolver parâmetros
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
    };
    resolveParams();
  }, [params]);

  // Carregar dados da loja e produtos
  useEffect(() => {
    if (!resolvedParams?.id) return;
    
    const loadStoreData = async () => {
      try {
        await fetchStoreById(resolvedParams.id);
      } catch (error) {
        console.error('Erro ao carregar loja:', error);
      }
    };

    const loadStoreProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError(null);
        const products = await getProductsByStore(resolvedParams.id);
        setStoreProducts(products);
      } catch (error) {
        setProductsError(error instanceof Error ? error.message : 'Erro ao carregar produtos');
      } finally {
        setProductsLoading(false);
      }
    };

    const loadStoreReviews = () => {
      fetchReviews(undefined, resolvedParams.id);
      fetchReviewStats(undefined, resolvedParams.id);
    };

    loadStoreData();
    loadStoreProducts();
    loadStoreReviews();
  }, [resolvedParams?.id, fetchStoreById, getProductsByStore, fetchReviews, fetchReviewStats]);

  // Filtrar e ordenar produtos
  const filteredProducts = storeProducts
    .filter(product => categoryFilter === 'all' || product.category?.name === categoryFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return (b.reviewCount || 0) - (a.reviewCount || 0);
      }
    });

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'Básico': return 'bg-gray-100 text-gray-700';
      case 'Profissional': return 'bg-blue-100 text-blue-700';
      case 'Premium': return 'bg-purple-100 text-purple-700';
      case 'Empresarial': return 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Estados de carregamento e erro
  if (storeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando loja...</p>
        </div>
      </div>
    );
  }

  if (storeError || !currentStore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar loja</h2>
          <p className="text-gray-600 mb-4">{storeError || 'Loja não encontrada'}</p>
          <button
            onClick={() => {
              clearStoreError();
              window.location.reload();
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store Header */}
      <div className="relative">
        <div className="h-64 bg-gradient-to-br from-blue-600 to-purple-600">
          {currentStore.banner && (
            <img
              src={currentStore.banner}
              alt={currentStore.name}
              className="w-full h-full object-cover opacity-30"
            />
          )}
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
              <div className="w-24 h-24 bg-white rounded-2xl p-2 shadow-lg">
                <OptimizedImage
                  src={currentStore.logo || `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('store logo ' + currentStore.category)}&image_size=square`}
                  alt={currentStore.name}
                  className="w-full h-full object-cover rounded-xl"
                  fallback={`https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('store logo ' + currentStore.category)}&image_size=square`}
                />
              </div>
              
              <div className="flex-1 text-white">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold">{currentStore.name}</h1>
                  {currentStore.isVerified && (
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getPlanBadgeColor((currentStore as any).plan || 'Básico')
                  }`}>
                    {(currentStore as any).plan || 'Básico'}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-medium">{currentStore.rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-gray-300">({currentStore.reviewCount || 0} avaliações)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Package className="h-4 w-4" />
                    <span>{currentStore.productCount || storeProducts.length} produtos</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{currentStore.city}, {currentStore.state}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações da Loja</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Descrição</h4>
                    <p className="text-gray-600 text-sm">{currentStore.description || 'Nenhuma descrição disponível.'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Contato</h4>
                    <div className="space-y-2 text-sm">
                      {currentStore.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{currentStore.phone}</span>
                        </div>
                      )}
                      {currentStore.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{currentStore.email}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{currentStore.address || `${currentStore.city}, ${currentStore.state}`}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Membro desde</h4>
                    <p className="text-gray-600 text-sm">
                      {new Date(currentStore.createdAt).toLocaleDateString('pt-BR', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                {/* Contact Buttons */}
                <div className="mt-6 space-y-3">
                  {(currentStore.socialMedia as any)?.whatsapp && (
                    <a
                      href={`https://wa.me/${(currentStore.socialMedia as any).whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  
                  {currentStore.email && (
                    <a
                      href={`mailto:${currentStore.email}`}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Mail className="h-5 w-5" />
                      <span>Enviar E-mail</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Tabs */}
              <div className="bg-white rounded-2xl shadow-lg mb-8">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6">
                    {[
                      { id: 'products', name: 'Produtos', count: currentStore.productCount || storeProducts.length },
                      { id: 'about', name: 'Sobre' },
                      { id: 'reviews', name: 'Avaliações', count: currentStore.reviewCount || 0 },
                      { id: 'policies', name: 'Políticas' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab.name}
                        {tab.count && (
                          <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-6">
                  {/* Products Tab */}
                  {activeTab === 'products' && (
                    <div>
                      {/* Filters */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
                        <div className="flex items-center space-x-4">
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={productsLoading}
                          >
                            <option value="popular">Mais Popular</option>
                            <option value="price-low">Menor Preço</option>
                            <option value="price-high">Maior Preço</option>
                            <option value="rating">Melhor Avaliação</option>
                            <option value="name">Nome A-Z</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-colors ${
                              viewMode === 'grid' 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                            disabled={productsLoading}
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
                            disabled={productsLoading}
                          >
                            <List className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {/* Products Loading State */}
                      {productsLoading && (
                        <div className="flex justify-center items-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                          <span className="ml-3 text-gray-600">Carregando produtos...</span>
                        </div>
                      )}

                      {/* Products Error State */}
                      {productsError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                          <div className="flex items-center space-x-3">
                            <AlertCircle className="h-6 w-6 text-red-600" />
                            <div>
                              <h3 className="text-red-800 font-medium">Erro ao carregar produtos</h3>
                              <p className="text-red-600 text-sm mt-1">{productsError}</p>
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  setProductsLoading(true);
                                  setProductsError(null);
                                  if (resolvedParams?.id) {
                                    const products = await getProductsByStore(resolvedParams.id);
                                    setStoreProducts(products);
                                  }
                                } catch (error) {
                                  setProductsError(error instanceof Error ? error.message : 'Erro ao carregar produtos');
                                } finally {
                                  setProductsLoading(false);
                                }
                              }}
                              className="ml-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Tentar novamente
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Products Grid */}
                      {!productsLoading && !productsError && (
                        <>
                          <div className={viewMode === 'grid' 
                            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                            : 'space-y-4'
                          }>
                            {filteredProducts.map((product) => (
                              <ProductCard
                                key={product.id}
                                product={{
                                  ...product,
                                  category: product.category || 'geral'
                                }}
                              />
                            ))}
                          </div>

                          {filteredProducts.length === 0 && storeProducts.length > 0 && (
                            <div className="text-center py-12">
                              <p className="text-gray-500">Nenhum produto encontrado com os filtros aplicados.</p>
                            </div>
                          )}

                          {storeProducts.length === 0 && (
                            <div className="text-center py-12">
                              <p className="text-gray-500">Esta loja ainda não possui produtos cadastrados.</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* About Tab */}
                  {activeTab === 'about' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sobre a Loja</h3>
                        <p className="text-gray-700 leading-relaxed">
                          {currentStore.description || 'Nenhuma descrição disponível para esta loja.'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Informações da Loja</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <MapPin className="h-5 w-5 text-gray-500" />
                              <div>
                                <p className="font-medium text-gray-900">Localização</p>
                                <p className="text-gray-600">
                                  {currentStore.city && currentStore.state 
                                    ? `${currentStore.city}, ${currentStore.state}`
                                    : 'Localização não informada'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Calendar className="h-5 w-5 text-gray-500" />
                              <div>
                                <p className="font-medium text-gray-900">Membro desde</p>
                                <p className="text-gray-600">
                                  {currentStore.createdAt 
                                    ? new Date(currentStore.createdAt).toLocaleDateString('pt-BR', {
                                        year: 'numeric',
                                        month: 'long'
                                      })
                                    : 'Data não disponível'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Package className="h-5 w-5 text-gray-500" />
                              <div>
                                <p className="font-medium text-gray-900">Total de Produtos</p>
                                <p className="text-gray-600">
                                  {currentStore.productCount || storeProducts.length} produtos
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Star className="h-5 w-5 text-gray-500" />
                              <div>
                                <p className="font-medium text-gray-900">Avaliação</p>
                                <p className="text-gray-600">
                                  {currentStore.rating?.toFixed(1) || '0.0'} ({currentStore.reviewCount || 0} avaliações)
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reviews Tab */}
                  {activeTab === 'reviews' && (
                    <div className="space-y-6">
                      {/* Resumo das Avaliações */}
                      <RatingSummary 
                        averageRating={reviewStats?.averageRating || 0}
                        totalReviews={reviewStats?.totalReviews || 0}
                        distribution={reviewStats?.ratingDistribution}
                        showDistribution={true}
                        className="mb-6"
                      />
                      
                      {/* Formulário de Avaliação */}
                      {user && (
                        <div className="border-b border-gray-200 pb-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Deixe sua avaliação sobre a loja
                          </h3>
                          <ReviewForm
                              storeId={resolvedParams?.id || ''}
                              onSuccess={() => {
                                if (resolvedParams?.id) {
                                  fetchReviews(undefined, resolvedParams.id);
                                  fetchReviewStats(undefined, resolvedParams.id);
                                }
                              }}
                            />
                        </div>
                      )}
                      
                      {/* Lista de Avaliações */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Avaliações dos Clientes
                        </h3>
                        <ReviewList
                            storeId={resolvedParams?.id || ''}
                            onEditReview={() => {
                              if (resolvedParams?.id) {
                                fetchReviews(undefined, resolvedParams.id);
                                fetchReviewStats(undefined, resolvedParams.id);
                              }
                            }}
                          />
                      </div>
                    </div>
                  )}

                  {/* Policies Tab */}
                  {activeTab === 'policies' && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Política de Devolução</h4>
                        <p className="text-gray-700">
                          Política de devolução não informada. Entre em contato com a loja para mais informações.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Garantia</h4>
                        <p className="text-gray-700">
                          Informações de garantia não disponíveis. Entre em contato com a loja para mais detalhes.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Entrega</h4>
                        <p className="text-gray-700">
                          Informações de entrega não disponíveis. Entre em contato com a loja para mais detalhes.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}