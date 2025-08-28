import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getAnalytics } from '@/lib/analytics-consolidated';

// Hook para rastrear mudanças de página automaticamente
export const usePageTracking = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Inicializar analytics na primeira execução
    const analytics = getAnalytics();
    analytics.init();
  }, []);

  useEffect(() => {
    // Rastrear mudança de página
    const pageTitle = document.title;
    const pagePath = pathname + (searchParams ? '?' + searchParams.toString() : '');
    
    const analytics = getAnalytics();
    analytics.trackPageView(pagePath, pageTitle);
  }, [pathname, searchParams]);
};

// Hook consolidado para analytics
export const useAnalytics = () => {
  const analytics = getAnalytics();

  return {
    // E-commerce events
    trackViewItem: (product: any) => analytics.trackProductView(product),
    trackAddToCart: (product: any) => analytics.trackEvent('add_to_cart', { product }),
    trackRemoveFromCart: (product: any) => analytics.trackEvent('remove_from_cart', { product }),
    trackBeginCheckout: () => analytics.trackEvent('begin_checkout'),
    trackPurchase: (purchase: any) => analytics.trackPurchase(purchase),
    trackSelectItem: (item: any) => analytics.trackEvent('select_item', { item }),

    // Engagement events
    trackSearch: (query: string) => analytics.trackEvent('search', { query }),
    trackShare: (content: any) => analytics.trackEvent('share', { content }),
    trackLogin: (method: string) => analytics.trackEvent('login', { method }),
    trackSignUp: (method: string) => analytics.trackEvent('sign_up', { method }),
    trackCustomEvent: (name: string, data?: any) => analytics.trackEvent(name, data),

    // Marketplace events
    trackViewStore: (store: any) => analytics.trackEvent('view_store', { store }),
    trackContactSeller: (store: any) => analytics.trackEvent('contact_seller', { store }),
    trackFilterProducts: (filters: any) => analytics.trackEvent('filter_products', { filters }),
    trackViewCategory: (category: string) => analytics.trackEvent('view_category', { category }),
    trackPaymentError: (error: any) => analytics.trackEvent('payment_error', { error }),
    trackPaymentSuccess: (payment: any) => analytics.trackEvent('payment_success', { payment }),
  };
};

// Re-export for backward compatibility
export const useEcommerceTracking = useAnalytics;
export const useEngagementTracking = useAnalytics;
export const useMarketplaceTracking = useAnalytics;