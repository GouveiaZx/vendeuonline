'use client';

import { Suspense, useEffect } from 'react';
import { SearchBar } from '@/components/ui/SearchBar';
import ProductCard from '@/components/ui/ProductCard';
import HeroSection from '../components/ui/HeroSection';
import { FeaturedStores } from '@/components/ui/FeaturedStores';
import BannerDisplay from '@/components/banners/BannerDisplay';
import { useProductStore } from '@/store/productStore';
import { useStoreStore } from "@/stores/storeStore";

export default function HomePage() {
  const { products, fetchProducts } = useProductStore();
  const { stores, fetchStores, loading: storesLoading } = useStoreStore();
  
  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 12);
  const allProducts = products.slice(0, 20);
  const featuredStores = stores.slice(0, 6).map(store => ({
    id: store.id,
    name: store.name,
    logo: store.logo,
    products: store.productCount || 0,
    rating: store.rating,
    city: store.city,
    description: store.description,
    category: store.category,
    isVerified: store.isVerified
  })); // Mostrar até 6 lojas em destaque
  
  useEffect(() => {
    fetchProducts();
    fetchStores();
  }, [fetchProducts, fetchStores]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banners */}
      <BannerDisplay position="HEADER" />
      
      {/* Hero Section */}
      <HeroSection />
      

        
      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {/* Main Content */}
            <div className="flex-1">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Produtos em Destaque</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">Descubra os produtos mais populares e bem avaliados da nossa plataforma</p>
              </div>
              <Suspense fallback={<div className="text-center py-12 text-gray-500">Carregando produtos...</div>}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </Suspense>
            </div>
            
            {/* Sidebar Banners */}
            <div className="w-80 hidden lg:block">
              <BannerDisplay position="SIDEBAR" />
            </div>
          </div>
        </div>
      </section>

      {/* Category Banners */}
      <div className="py-8">
        <BannerDisplay position="CATEGORY" />
      </div>
      
      {/* All Products */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Explore Todos os Produtos</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Navegue por nossa ampla seleção de produtos de qualidade</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {allProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Stores */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Lojas Parceiras</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Conheça as melhores lojas da nossa plataforma</p>
          </div>
          {storesLoading ? (
            <div className="text-center py-12 text-gray-500">Carregando lojas...</div>
          ) : (
            <FeaturedStores stores={featuredStores} />
          )}
        </div>
      </section>
      
      {/* Footer Banners */}
      <div className="py-8 bg-white">
        <BannerDisplay position="FOOTER" />
      </div>
    </div>
  );
}