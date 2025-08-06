import { create } from 'zustand'

// Utilitário para gerenciar token no localStorage
const getStoredToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth-token')
  }
  return null
}

// Utilitário para fazer requisições autenticadas
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = getStoredToken()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...Object.fromEntries(new Headers(options.headers || {}).entries())
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Erro na requisição' }))
    throw new Error(errorData.message || `Erro ${response.status}`)
  }
  
  return response.json()
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

interface AdminAnalyticsState {
  analytics: GlobalAnalytics | null
  isLoading: boolean
  error: string | null
  period: '7d' | '30d' | '90d' | '1y'
  
  // Actions
  fetchGlobalAnalytics: (period?: '7d' | '30d' | '90d' | '1y') => Promise<void>
  setPeriod: (period: '7d' | '30d' | '90d' | '1y') => void
  clearError: () => void
  exportAnalytics: (format: 'csv' | 'pdf') => Promise<void>
}

export const useAdminAnalyticsStore = create<AdminAnalyticsState>((set, get) => ({
  analytics: null,
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
      console.error('Erro ao exportar analytics:', error)
      set({ error: error.message || 'Erro ao exportar dados' })
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