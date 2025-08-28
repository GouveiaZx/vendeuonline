import { PageLayout } from '@/components/layout/PageLayout';
import HeroSection from '@/components/ui/HeroSection';
import BannerDisplay from '@/components/banners/BannerDisplay';
import InteractiveHomePage from '@/components/home/InteractiveHomePage';
import { ClientOnly } from '@/components/ClientOnly';

/**
 * Página inicial otimizada para SSR
 * Separação entre conteúdo estático (SSR) e interativo (client-side)
 */
export default function HomePage() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header Banners - Client-side por serem interativos */}
        <ClientOnly fallback={<div className="h-24 bg-gradient-to-r from-blue-600 to-purple-600" />}>
          <BannerDisplay position="HEADER" />
        </ClientOnly>
        
        {/* Hero Section - Pode ser SSR */}
        <HeroSection />

        {/* Conteúdo interativo - Client-side */}
        <InteractiveHomePage />

        {/* Sidebar Banners */}
        <div className="py-8 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ClientOnly fallback={<div className="h-16 bg-gray-200 rounded-lg animate-pulse" />}>
              <BannerDisplay position="SIDEBAR" />
            </ClientOnly>
          </div>
        </div>

        {/* Category Banners */}
        <div className="py-8">
          <ClientOnly fallback={<div className="h-32 bg-gray-100 rounded-lg animate-pulse mx-4" />}>
            <BannerDisplay position="CATEGORY" />
          </ClientOnly>
        </div>
        
        {/* Footer Banners */}
        <div className="py-8 bg-white">
          <ClientOnly fallback={<div className="h-20 bg-gray-50 rounded-lg mx-4" />}>
            <BannerDisplay position="FOOTER" />
          </ClientOnly>
        </div>
      </div>
    </PageLayout>
  );
}