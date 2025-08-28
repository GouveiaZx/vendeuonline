import { create } from 'zustand'
import { apiRequest as apiRequestLib } from '@/lib/api';

// Utilitário para gerenciar token no localStorage
const getStoredToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth-token')
  }
  return null
}

// Importar wrapper centralizado


// Utilitário para fazer requisições autenticadas
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = getStoredToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...Object.fromEntries(new Headers(options.headers || {}).entries())
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await apiRequestLib(url, {
    ...options,
    headers
  });
  
  if (!response.success) {
    throw new Error(response.error || 'Erro na requisição');
  }
  
  return response.data;
}

// Interfaces para analytics globais
export interface GlobalAnalyticsOverview {
  totalRevenue: number
  totalOrders: number
  totalUsers: number
  totalStores: number
  totalProducts: number
  avgOrderValue: number
  conversionRate: number
  growth: {
    revenue: number
    orders: number
    users: number
    stores: number
  }
}

export interface SalesByDay {
  date: string
  orders: number
  revenue: number
}

export interface TopStore {
  id: string
  name: string
  revenue: number
  orders: number
  products: number
}

export interface TopProduct {
  id: string
  name: string
  storeName: string
  sales: number
  revenue: number
}

export interface UserGrowth {
  date: string
  newUsers: number
}

export interface RevenueByCategory {
  name: string
  revenue: number
  percentage: number
}

export interface GlobalAnalytics {
  period: '7d' | '30d' | '90d' | '1y'
  overview: GlobalAnalyticsOverview
  salesByDay: SalesByDay[]
  topStores: TopStore[]
  topProducts: TopProduct[]
  userGrowth: UserGrowth[]
  ordersByStatus: Record<string, number>
  revenueByCategory: RevenueByCategory[]
}

// Novas interfaces para métricas de analytics
export interface AnalyticsMetrics {
  totalEvents: number
  uniqueUsers: number
  totalSessions: number
  conversionRate: number
  totalRevenue: number
  topEvents: { type: string; count: number }[]
  eventsByDay: { date: string; count: number }[]
}

export interface EventMetrics {
  eventsByType: { type: string; count: number }[]
  eventsByHour: { hour: number; count: number }[]
  conversionFunnel: { name: string; type: string; count: number; conversionRate: number }[]
}

export interface UserMetrics {
  newUsers: { date: string; count: number }[]
  activeUsers: { date: string; count: number }[]
  userSessions: { date: string; count: number }[]
  topUserActions: { type: string; count: number }[]
}

export interface ProductMetrics {
  topViewedProducts: { product_id: string; product_name: string; views: number }[]
  topAddedToCart: { product_id: string; product_name: string; additions: number; total_quantity: number }[]
  topPurchasedProducts: { product_id: string; product_name: string; purchases: number; total_quantity: number }[]
}

export interface StoreMetrics {
  topViewedStores: { store_id: string; store_name: string; views: number }[]
  storeEngagement: { store_id: string; store_name: string; views: number; contacts: number; product_views: number }[]
}

interface AdminAnalyticsState {
  analytics: GlobalAnalytics | null
  analyticsMetrics: AnalyticsMetrics | null
  eventMetrics: EventMetrics | null
  userMetrics: UserMetrics | null
  productMetrics: ProductMetrics | null
  storeMetrics: StoreMetrics | null
  isLoading: boolean
  error: string | null
  period: '7d' | '30d' | '90d' | '1y'
  
  // Actions
  fetchGlobalAnalytics: (period?: '7d' | '30d' | '90d' | '1y') => Promise<void>
  fetchAnalyticsMetrics: (metric: 'overview' | 'events' | 'users' | 'products' | 'stores', period?: '7d' | '30d' | '90d' | '1y') => Promise<void>
  setPeriod: (period: '7d' | '30d' | '90d' | '1y') => void
  clearError: () => void
  exportAnalytics: (format: 'csv' | 'pdf') => Promise<void>
  exportMetrics: (metric: string, format: 'csv' | 'pdf') => Promise<void>
}

export const useAdminAnalyticsStore = create<AdminAnalyticsState>((set, get) => ({
  analytics: null,
  analyticsMetrics: null,
  eventMetrics: null,
  userMetrics: null,
  productMetrics: null,
  storeMetrics: null,
  isLoading: false,
  error: null,
  period: '30d',

  fetchGlobalAnalytics: async (period?: '7d' | '30d' | '90d' | '1y') => {
    try {
      set({ isLoading: true, error: null })
      
      const currentPeriod = period || get().period
      const response = await apiRequest(`/api/admin/analytics?period=${currentPeriod}`)
      
      set({ 
        analytics: response, 
        isLoading: false,
        period: currentPeriod
      })
    } catch (error: any) {
      console.error('Erro ao carregar analytics globais:', error)
      set({ 
        error: error.message || 'Erro ao carregar analytics',
        isLoading: false 
      })
    }
  },

  fetchAnalyticsMetrics: async (metric: 'overview' | 'events' | 'users' | 'products' | 'stores', period?: '7d' | '30d' | '90d' | '1y') => {
    try {
      set({ isLoading: true, error: null })
      
      const currentPeriod = period || get().period
      const response = await apiRequest(`/api/analytics/metrics?metric=${metric}&period=${currentPeriod}`)
      
      // Atualizar o estado baseado no tipo de métrica
      const updateData: Partial<AdminAnalyticsState> = {
        isLoading: false,
        period: currentPeriod
      }
      
      switch (metric) {
        case 'overview':
          updateData.analyticsMetrics = response.data
          break
        case 'events':
          updateData.eventMetrics = response.data
          break
        case 'users':
          updateData.userMetrics = response.data
          break
        case 'products':
          updateData.productMetrics = response.data
          break
        case 'stores':
          updateData.storeMetrics = response.data
          break
      }
      
      set(updateData)
    } catch (error: any) {
      // Log apenas em desenvolvimento para debug
      if (process.env.NODE_ENV === 'development') {
        console.error(`Erro ao carregar métricas de ${metric}:`, error)
      }
      set({ 
        error: error.message || `Erro ao carregar métricas de ${metric}`,
        isLoading: false 
      })
    }
  },

  setPeriod: (period: '7d' | '30d' | '90d' | '1y') => {
    set({ period })
  },

  clearError: () => {
    set({ error: null })
  },

  exportAnalytics: async (format: 'csv' | 'pdf') => {
    try {
      const { analytics } = get()
      if (!analytics) {
        throw new Error('Nenhum dado para exportar')
      }

      if (format === 'csv') {
        // Exportar como CSV
        const csvData = generateCSV(analytics)
        downloadFile(csvData, `analytics-${analytics.period}.csv`, 'text/csv')
      } else if (format === 'pdf') {
        // Para PDF, seria necessário uma biblioteca como jsPDF
        console.log('Exportação PDF não implementada ainda')
      }
    } catch (error: any) {
      // Log apenas em desenvolvimento para debug
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao exportar analytics:', error)
      }
      set({ error: error.message || 'Erro ao exportar dados' })
    }
  },

  exportMetrics: async (metric: string, format: 'csv' | 'pdf') => {
    try {
      const state = get()
      let data: any = null
      
      switch (metric) {
        case 'overview':
          data = state.analyticsMetrics
          break
        case 'events':
          data = state.eventMetrics
          break
        case 'users':
          data = state.userMetrics
          break
        case 'products':
          data = state.productMetrics
          break
        case 'stores':
          data = state.storeMetrics
          break
      }
      
      if (!data) {
        throw new Error(`Nenhum dado de ${metric} para exportar`)
      }

      if (format === 'csv') {
        const csvData = generateMetricsCSV(metric, data)
        downloadFile(csvData, `${metric}-metrics-${state.period}.csv`, 'text/csv')
      } else if (format === 'pdf') {
        console.log('Exportação PDF não implementada ainda')
      }
    } catch (error: any) {
      console.error('Erro ao exportar métricas:', error)
      set({ error: error.message || 'Erro ao exportar métricas' })
    }
  }
}))

// Função auxiliar para gerar CSV
function generateCSV(analytics: GlobalAnalytics): string {
  const lines: string[] = []
  
  // Cabeçalho
  lines.push('Relatório de Analytics - ' + analytics.period)
  lines.push('')
  
  // Overview
  lines.push('RESUMO GERAL')
  lines.push('Métrica,Valor,Crescimento (%)')
  lines.push(`Receita Total,R$ ${analytics.overview.totalRevenue.toLocaleString('pt-BR')},${analytics.overview.growth.revenue.toFixed(1)}%`)
  lines.push(`Total de Pedidos,${analytics.overview.totalOrders},${analytics.overview.growth.orders.toFixed(1)}%`)
  lines.push(`Total de Usuários,${analytics.overview.totalUsers},${analytics.overview.growth.users.toFixed(1)}%`)
  lines.push(`Total de Lojas,${analytics.overview.totalStores},${analytics.overview.growth.stores.toFixed(1)}%`)
  lines.push(`Ticket Médio,R$ ${analytics.overview.avgOrderValue.toFixed(2)},`)
  lines.push(`Taxa de Conversão,${analytics.overview.conversionRate.toFixed(2)}%,`)
  lines.push('')
  
  // Top Lojas
  lines.push('TOP LOJAS')
  lines.push('Nome,Receita,Pedidos,Produtos')
  analytics.topStores.forEach(store => {
    lines.push(`${store.name},R$ ${store.revenue.toLocaleString('pt-BR')},${store.orders},${store.products}`)
  })
  lines.push('')
  
  // Top Produtos
  lines.push('TOP PRODUTOS')
  lines.push('Nome,Loja,Vendas,Receita')
  analytics.topProducts.forEach(product => {
    lines.push(`${product.name},${product.storeName},${product.sales},R$ ${product.revenue.toLocaleString('pt-BR')}`)
  })
  lines.push('')
  
  // Vendas por dia
  lines.push('VENDAS POR DIA')
  lines.push('Data,Pedidos,Receita')
  analytics.salesByDay.forEach(day => {
    lines.push(`${day.date},${day.orders},R$ ${day.revenue.toLocaleString('pt-BR')}`)
  })
  
  return lines.join('\n')
}

// Função auxiliar para gerar CSV de métricas específicas
function generateMetricsCSV(metric: string, data: any): string {
  let headers: string[] = []
  let rows: string[][] = []
  
  switch (metric) {
    case 'overview':
      headers = ['Métrica', 'Valor']
      rows = [
        ['Total de Eventos', data.totalEvents?.toString() || '0'],
        ['Usuários Únicos', data.uniqueUsers?.toString() || '0']
      ]
      if (data.topEvents) {
        rows.push(['', ''])
        rows.push(['Top Eventos', 'Quantidade'])
        data.topEvents.forEach((event: any) => {
          rows.push([event.type || 'N/A', event.count?.toString() || '0'])
        })
      }
      break
    case 'events':
      headers = ['Tipo de Evento', 'Quantidade']
      if (data.eventsByType) {
        rows = data.eventsByType.map((event: any) => [
          event.type || 'N/A',
          event.count?.toString() || '0'
        ])
      }
      break
    case 'users':
      headers = ['Data', 'Novos Usuários', 'Usuários Ativos']
      if (data.newUsers && data.activeUsers) {
        const dates = data.newUsers.map((item: any) => item.date)
        dates.forEach((date: string) => {
          const newUser = data.newUsers.find((item: any) => item.date === date)
          const activeUser = data.activeUsers.find((item: any) => item.date === date)
          rows.push([
            date,
            newUser?.count?.toString() || '0',
            activeUser?.count?.toString() || '0'
          ])
        })
      }
      break
    case 'products':
      headers = ['Produto ID', 'Nome do Produto', 'Visualizações', 'Adições ao Carrinho', 'Compras']
      if (data.topViewedProducts) {
        rows = data.topViewedProducts.map((product: any) => [
          product.product_id || 'N/A',
          product.product_name || 'N/A',
          product.views?.toString() || '0',
          '0',
          '0'
        ])
      }
      if (data.topAddedToCart) {
        data.topAddedToCart.forEach((product: any) => {
          const existingRow = rows.find(row => row[0] === product.product_id)
          if (existingRow) {
            existingRow[3] = product.additions?.toString() || '0'
          } else {
            rows.push([
              product.product_id || 'N/A',
              product.product_name || 'N/A',
              '0',
              product.additions?.toString() || '0',
              '0'
            ])
          }
        })
      }
      if (data.topPurchasedProducts) {
        data.topPurchasedProducts.forEach((product: any) => {
          const existingRow = rows.find(row => row[0] === product.product_id)
          if (existingRow) {
            existingRow[4] = product.purchases?.toString() || '0'
          } else {
            rows.push([
              product.product_id || 'N/A',
              product.product_name || 'N/A',
              '0',
              '0',
              product.purchases?.toString() || '0'
            ])
          }
        })
      }
      break
    case 'stores':
      headers = ['Loja ID', 'Nome da Loja', 'Visualizações', 'Contatos', 'Visualizações de Produtos']
      if (data.topViewedStores) {
        rows = data.topViewedStores.map((store: any) => [
          store.store_id || 'N/A',
          store.store_name || 'N/A',
          store.views?.toString() || '0',
          '0',
          '0'
        ])
      }
      if (data.storeEngagement) {
        data.storeEngagement.forEach((store: any) => {
          const existingRow = rows.find(row => row[0] === store.store_id)
          if (existingRow) {
            existingRow[3] = store.contacts?.toString() || '0'
            existingRow[4] = store.product_views?.toString() || '0'
          } else {
            rows.push([
              store.store_id || 'N/A',
              store.store_name || 'N/A',
              store.views?.toString() || '0',
              store.contacts?.toString() || '0',
              store.product_views?.toString() || '0'
            ])
          }
        })
      }
      break
    default:
      headers = ['Dados']
      rows = [['Nenhum dado disponível']]
  }
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

// Função auxiliar para download de arquivo
function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// Helper functions para transformar dados em formatos de gráfico
export const transformSalesData = (salesByDay: SalesByDay[]) => {
  return salesByDay.map(day => ({
    date: new Date(day.date).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short' 
    }),
    orders: day.orders,
    revenue: day.revenue
  }))
}

export const transformUserGrowthData = (userGrowth: UserGrowth[]) => {
  return userGrowth.map(day => ({
    date: new Date(day.date).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short' 
    }),
    users: day.newUsers
  }))
}

export const transformRevenueByCategory = (revenueByCategory: RevenueByCategory[]) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
  
  return revenueByCategory.map((category, index) => ({
    name: category.name,
    value: category.percentage,
    revenue: category.revenue,
    color: colors[index % colors.length]
  }))
}