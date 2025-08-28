'use client';

import { Suspense, useEffect } from 'react';
import ProductCard from '@/components/ui/ProductCard';
import { FeaturedStores } from '@/components/ui/FeaturedStores';
import { useProductStoreSafe, useStoreStoreSafe } from '@/hooks/useAuthStoreSafe';
import { ClientOnly } from '@/components/ClientOnly';

/**
 * Componente client-side para a página inicial
 * Contém toda a lógica interativa que precisa do lado do cliente
 */
export default function InteractiveHomePage() {
  const { products, fetchProducts } = useProductStoreSafe();
  const { stores, fetchStores, loading: storesLoading } = useStoreStoreSafe();
  
  const featuredProducts = (products || []).filter(p => p.isFeatured).slice(0, 12);
  const allProducts = (products || []).slice(0, 20);
  const featuredStores = (stores || []).slice(0, 6).map(store => ({
    id: store.id,
    name: store.name,
    logo: store.logo,
    products: store.productCount || 0,
    rating: store.rating,
    city: store.city,
    description: store.description,
    category: store.category,
    isVerified: store.isVerified
  }));
  
  useEffect(() => {
    // Atrasar fetch para após hidratação completa
    const timer = setTimeout(() => {
      if (fetchProducts && typeof fetchProducts === 'function') {
        fetchProducts();
      }
      if (fetchStores && typeof fetchStores === 'function') {
        fetchStores();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <>
      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Produtos em Destaque</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Descubra os produtos mais populares e bem avaliados da nossa plataforma
            </p>
          </div>
          
          <ClientOnly 
            fallback={
              <div className="text-center py-12 text-gray-500">Carregando produtos...</div>
            }
            showFallback={true}
          >
            <Suspense fallback={
              <div className="text-center py-12 text-gray-500">Carregando produtos...</div>
            }>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </Suspense>
          </ClientOnly>
        </div>
      </section>

      {/* All Products */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Explore Todos os Produtos</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Navegue por nossa ampla seleção de produtos de qualidade
            </p>
          </div>
          
          <ClientOnly 
            fallback={
              <div className="text-center py-12 text-gray-500">Carregando produtos...</div>
            }
            showFallback={true}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </ClientOnly>
        </div>
      </section>

      {/* Featured Stores */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Lojas Parceiras</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Conheça as melhores lojas da nossa plataforma
            </p>
          </div>
          
          <ClientOnly 
            fallback={
              <div className="text-center py-12 text-gray-500">Carregando lojas...</div>
            }
            showFallback={true}
          >
            {storesLoading ? (
              <div className="text-center py-12 text-gray-500">Carregando lojas...</div>
            ) : (
              <FeaturedStores stores={featuredStores} />
            )}
          </ClientOnly>
        </div>
      </section>
    </>
  );
}