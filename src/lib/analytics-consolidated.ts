/**
 * SISTEMA DE ANALYTICS CONSOLIDADO
 * 
 * Esta é a única implementação de analytics do projeto, unificando:
 * - Google Analytics tracking
 * - Métricas internas do dashboard
 * - Sistema de eventos personalizados
 * 
 * Estrutura hierárquica:
 * - GoogleAnalytics: Tracking externo (GA4)
 * - InternalAnalytics: Métricas do dashboard
 * - EventTracking: Sistema de eventos personalizado
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TIPOS E INTERFACES CONSOLIDADOS
// ============================================================================

// Tipos base para eventos
interface BaseEvent {
  event_category?: string;
  event_label?: string;
  value?: number;
}

interface ProductEvent extends BaseEvent {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_brand?: string;
  price?: number;
  quantity?: number;
}

interface PurchaseEvent extends BaseEvent {
  transaction_id: string;
  value: number;
  currency: string;
  items: ProductEvent[];
}

// Interfaces para analytics internos
export interface AnalyticsFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  stores: string[];
  categories: string[];
  regions: string[];
}

export interface AnalyticsMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalStores: number;
  totalProducts: number;
  avgOrderValue: number;
  conversionRate: number;
  topProducts: Array<{
    id: string;
    name: string;
    revenue: number;
    quantity: number;
  }>;
  topStores: Array<{
    id: string;
    name: string;
    revenue: number;
    orderCount: number;
  }>;
  revenueByCategory: Array<{
    category: string;
    revenue: number;
  }>;
}

// Interface para eventos personalizados
export interface CustomEventData {
  type: string;
  data: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
  userAgent?: string;
}

// Declaração global para gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}

// ============================================================================
// GOOGLE ANALYTICS (EXTERNO)
// ============================================================================

class GoogleAnalytics {
  private measurementId: string;
  private isInitialized = false;

  constructor(measurementId?: string) {
    this.measurementId = measurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';
  }

  init() {
    if (this.isInitialized || !this.measurementId || typeof window === 'undefined') {
      return;
    }

    // Carregar Google Analytics
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    script.async = true;
    document.head.appendChild(script);

    // Inicializar gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      page_title: document.title,
      page_location: window.location.href,
    });

    this.isInitialized = true;
  }

  // Tracking de produtos
  trackProductView(product: ProductEvent) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_item', {
        currency: 'BRL',
        value: product.price,
        items: [product]
      });
    }
  }

  trackAddToCart(product: ProductEvent) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'BRL',
        value: product.price,
        items: [product]
      });
    }
  }

  trackPurchase(purchase: PurchaseEvent) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: purchase.transaction_id,
        value: purchase.value,
        currency: purchase.currency,
        items: purchase.items
      });
    }
  }

  // Eventos personalizados
  trackCustomEvent(eventName: string, parameters: Record<string, unknown>) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, parameters);
    }
  }
}

// ============================================================================
// ANALYTICS INTERNO (DASHBOARD)
// ============================================================================

class InternalAnalytics {
  private apiEndpoint = '/api/analytics';

  // Obter métricas do dashboard
  async getMetrics(filters: AnalyticsFilters): Promise<AnalyticsMetrics> {
    try {
      const response = await fetch(`${this.apiEndpoint}/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics metrics');
      }

      return await response.json();
    } catch (error) {
      console.error('Analytics metrics error:', error);
      throw error;
    }
  }

  // Registrar evento interno
  async recordEvent(eventData: CustomEventData): Promise<void> {
    try {
      await fetch(`${this.apiEndpoint}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          timestamp: eventData.timestamp || new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to record analytics event:', error);
      // Não lançar erro para não interromper fluxo principal
    }
  }
}

// ============================================================================
// SISTEMA DE EVENTOS PERSONALIZADOS
// ============================================================================

class EventTracking {
  private sessionId: string;
  private userId?: string;
  private eventQueue: CustomEventData[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 5000; // 5 segundos
  private readonly MAX_QUEUE_SIZE = 50;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.startAutoFlush();
  }

  private getOrCreateSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('analytics_session_id');
      if (!sessionId) {
        sessionId = uuidv4();
        sessionStorage.setItem('analytics_session_id', sessionId);
      }
      return sessionId;
    }
    return uuidv4();
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  // Adicionar evento à fila
  track(type: string, data: Record<string, unknown>) {
    const event: CustomEventData = {
      type,
      data,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
    };

    this.eventQueue.push(event);

    if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
      this.flush();
    }
  }

  // Enviar eventos acumulados
  private async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-adicionar eventos à fila para retry
      this.eventQueue.unshift(...events);
    }
  }

  private startAutoFlush() {
    if (typeof window !== 'undefined') {
      this.flushInterval = setInterval(() => {
        this.flush();
      }, this.FLUSH_INTERVAL);

      // Flush ao sair da página
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush(); // Flush final
  }
}

// ============================================================================
// CLASSE PRINCIPAL CONSOLIDADA
// ============================================================================

class Analytics {
  private googleAnalytics: GoogleAnalytics;
  private internalAnalytics: InternalAnalytics;
  private eventTracking: EventTracking;

  constructor(measurementId?: string) {
    this.googleAnalytics = new GoogleAnalytics(measurementId);
    this.internalAnalytics = new InternalAnalytics();
    this.eventTracking = new EventTracking();
  }

  // Inicializar todos os sistemas
  init() {
    this.googleAnalytics.init();
  }

  // Definir usuário para tracking
  setUser(userId: string) {
    this.eventTracking.setUserId(userId);
  }

  // Métodos de tracking unificados
  trackPageView(path: string, title?: string) {
    this.googleAnalytics.trackCustomEvent('page_view', {
      page_path: path,
      page_title: title,
    });
    
    this.eventTracking.track('page_view', {
      path,
      title,
    });
  }

  trackProductView(product: ProductEvent) {
    this.googleAnalytics.trackProductView(product);
    this.eventTracking.track('product_view', product as unknown as Record<string, unknown>);
  }

  trackAddToCart(product: ProductEvent) {
    this.googleAnalytics.trackAddToCart(product);
    this.eventTracking.track('add_to_cart', product as unknown as Record<string, unknown>);
  }

  trackPurchase(purchase: PurchaseEvent) {
    this.googleAnalytics.trackPurchase(purchase);
    this.eventTracking.track('purchase', purchase as unknown as Record<string, unknown>);
  }

  trackEvent(eventName: string, data?: Record<string, unknown>) {
    this.googleAnalytics.trackCustomEvent(eventName, data || {});
    this.eventTracking.track(eventName, data || {});
  }

  trackCustomEvent(eventName: string, data: Record<string, unknown>) {
    this.trackEvent(eventName, data);
  }

  // Métricas internas
  async getMetrics(filters: AnalyticsFilters): Promise<AnalyticsMetrics> {
    return this.internalAnalytics.getMetrics(filters);
  }

  // Cleanup
  destroy() {
    this.eventTracking.destroy();
  }
}

// ============================================================================
// EXPORTAÇÃO E INSTÂNCIA SINGLETON
// ============================================================================

// Instância global singleton
let analyticsInstance: Analytics | null = null;

export function getAnalytics(): Analytics {
  if (!analyticsInstance) {
    analyticsInstance = new Analytics();
  }
  return analyticsInstance;
}

// Exports para compatibilidade
export { Analytics, GoogleAnalytics, InternalAnalytics, EventTracking };

// Hook para uso em React
export function useAnalytics() {
  return getAnalytics();
}