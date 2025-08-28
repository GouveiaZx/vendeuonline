'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Store, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Download, 
  Calendar,
  Loader2,
  AlertCircle,
  Eye,
  Target,
  BarChart3
} from 'lucide-react'
import { 
  useAdminAnalyticsStore, 
  transformSalesData, 
  transformUserGrowthData, 
  transformRevenueByCategory 
} from '@/store/adminAnalyticsStore'
import { useAuthStore, usePermissions } from '@/store/authStore'
import { toast } from 'sonner'

export default function AdminAnalyticsPage() {
  const [selectedMetric, setSelectedMetric] = useState<'overview' | 'events' | 'users' | 'products' | 'stores'>('overview')
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'events' | 'metrics'>('dashboard')
  
  const { 
    analytics, 
    analyticsMetrics,
    eventMetrics,
    userMetrics,
    productMetrics,
    storeMetrics,
    isLoading, 
    error, 
    period, 
    fetchGlobalAnalytics, 
    fetchAnalyticsMetrics,
    setPeriod, 
    clearError,
    exportAnalytics,
    exportMetrics 
  } = useAdminAnalyticsStore()
  
  const { user } = useAuthStore()
  const { isAdmin } = usePermissions()

  useEffect(() => {
    if (isAdmin) {
      fetchGlobalAnalytics()
      fetchAnalyticsMetrics('overview')
    }
  }, [isAdmin, fetchGlobalAnalytics, fetchAnalyticsMetrics])

  const handlePeriodChange = async (newPeriod: '7d' | '30d' | '90d' | '1y') => {
    setPeriod(newPeriod)
    await fetchGlobalAnalytics(newPeriod)
  }

  const handleRetryFetch = () => {
    clearError()
    fetchGlobalAnalytics()
  }

  const handleExport = async () => {
    try {
      if (activeTab === 'dashboard') {
        await exportAnalytics(exportFormat)
      } else {
        await exportMetrics(selectedMetric, exportFormat)
      }
      toast.success(`Relatório exportado como ${exportFormat.toUpperCase()}`)
    } catch (error) {
      toast.error('Erro ao exportar relatório')
    }
  }

  const handleMetricChange = async (metric: 'overview' | 'events' | 'users' | 'products' | 'stores') => {
    setSelectedMetric(metric)
    await fetchAnalyticsMetrics(metric)
  }

  const getChangeIcon = (change: number) => {
    return change >= 0 ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />
  }

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600'
  }

  // Verificar permissões
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Acesso negado. Apenas administradores podem ver esta página.</p>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando analytics...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRetryFetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum dado disponível</p>
        </div>
      </div>
    )
  }

  // Transformar dados para gráficos
  const salesData = transformSalesData(analytics.salesByDay)
  const userGrowthData = transformUserGrowthData(analytics.userGrowth)
  const categoryData = transformRevenueByCategory(analytics.revenueByCategory)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Globais</h1>
            <p className="text-gray-600">Visão geral do desempenho do marketplace</p>
          </div>
          <div className="flex gap-3">
            <select 
              value={period} 
              onChange={(e) => handlePeriodChange(e.target.value as '7d' | '30d' | '90d' | '1y')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="1y">Último ano</option>
            </select>
            {activeTab !== 'dashboard' && (
              <select 
                value={selectedMetric} 
                onChange={(e) => handleMetricChange(e.target.value as 'overview' | 'events' | 'users' | 'products' | 'stores')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="overview">Visão Geral</option>
                <option value="events">Eventos</option>
                <option value="users">Usuários</option>
                <option value="products">Produtos</option>
                <option value="stores">Lojas</option>
              </select>
            )}
            <select 
              value={exportFormat} 
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
            <button 
              onClick={handleExport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Dashboard Geral
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'events'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Eventos de Analytics
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'metrics'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Métricas Detalhadas
          </button>
        </div>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {analytics.overview.totalRevenue.toLocaleString('pt-BR')}
                </p>
                <div className={`flex items-center mt-1 ${getChangeColor(analytics.overview.growth.revenue)}`}>
                  {getChangeIcon(analytics.overview.growth.revenue)}
                  <span className="text-sm font-medium ml-1">
                    {Math.abs(analytics.overview.growth.revenue).toFixed(1)}% vs período anterior
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total de Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalOrders}</p>
                <div className={`flex items-center mt-1 ${getChangeColor(analytics.overview.growth.orders)}`}>
                  {getChangeIcon(analytics.overview.growth.orders)}
                  <span className="text-sm font-medium ml-1">
                    {Math.abs(analytics.overview.growth.orders).toFixed(1)}% vs período anterior
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Usuários Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalUsers}</p>
                <div className={`flex items-center mt-1 ${getChangeColor(analytics.overview.growth.users)}`}>
                  {getChangeIcon(analytics.overview.growth.users)}
                  <span className="text-sm font-medium ml-1">
                    {Math.abs(analytics.overview.growth.users).toFixed(1)}% vs período anterior
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Lojas Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalStores}</p>
                <div className={`flex items-center mt-1 ${getChangeColor(analytics.overview.growth.stores)}`}>
                  {getChangeIcon(analytics.overview.growth.stores)}
                  <span className="text-sm font-medium ml-1">
                    {Math.abs(analytics.overview.growth.stores).toFixed(1)}% vs período anterior
                  </span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Store className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Métricas Secundárias */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {analytics.overview.avgOrderValue.toFixed(2)}
                </p>
              </div>
              <Target className="h-8 w-8 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.overview.conversionRate.toFixed(2)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Produtos Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Vendas por Dia */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vendas por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? `R$ ${Number(value).toLocaleString('pt-BR')}` : value,
                    name === 'revenue' ? 'Receita' : 'Pedidos'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="1" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Crescimento de Usuários */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Novos Usuários</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Novos Usuários']} />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Receita por Categoria e Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Receita por Categoria */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Receita por Categoria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Participação']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Lojas */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Lojas</h3>
            <div className="space-y-4">
              {analytics.topStores.map((store, index) => (
                <div key={store.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{store.name}</p>
                      <p className="text-sm text-gray-500">{store.orders} pedidos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      R$ {store.revenue.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm text-gray-500">{store.products} produtos</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Produtos */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Produtos</h3>
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-medium text-sm mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.storeName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      R$ {product.revenue.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm text-gray-500">{product.sales} vendas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

            {/* Status dos Pedidos */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Status dos Pedidos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(analytics.ordersByStatus).map(([status, count]) => {
                  const statusLabels: Record<string, string> = {
                    PENDING: 'Pendente',
                    CONFIRMED: 'Confirmado',
                    SHIPPED: 'Enviado',
                    DELIVERED: 'Entregue',
                    CANCELLED: 'Cancelado'
                  }
                  
                  const statusColors: Record<string, string> = {
                    PENDING: 'bg-yellow-100 text-yellow-800',
                    CONFIRMED: 'bg-blue-100 text-blue-800',
                    SHIPPED: 'bg-purple-100 text-purple-800',
                    DELIVERED: 'bg-green-100 text-green-800',
                    CANCELLED: 'bg-red-100 text-red-800'
                  }
                  
                  return (
                    <div key={status} className="text-center">
                      <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[status] || status}
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{count}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
         )}

         {/* Events Analytics Tab */}
         {activeTab === 'events' && (
           <div className="space-y-8">
             {/* Events Overview */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-lg shadow-sm border">
                 <div className="flex items-center justify-between">
                   <div>
                     <p className="text-sm font-medium text-gray-500">Total de Eventos</p>
                     <p className="text-2xl font-bold text-gray-900">
                       {analyticsMetrics?.totalEvents?.toLocaleString('pt-BR') || '0'}
                     </p>
                   </div>
                   <Eye className="h-8 w-8 text-blue-600" />
                 </div>
               </div>
               <div className="bg-white p-6 rounded-lg shadow-sm border">
                 <div className="flex items-center justify-between">
                   <div>
                     <p className="text-sm font-medium text-gray-500">Usuários Únicos</p>
                     <p className="text-2xl font-bold text-gray-900">
                       {analyticsMetrics?.uniqueUsers?.toLocaleString('pt-BR') || '0'}
                     </p>
                   </div>
                   <Users className="h-8 w-8 text-green-600" />
                 </div>
               </div>
               <div className="bg-white p-6 rounded-lg shadow-sm border">
                 <div className="flex items-center justify-between">
                   <div>
                     <p className="text-sm font-medium text-gray-500">Sessões</p>
                     <p className="text-2xl font-bold text-gray-900">
                       {analyticsMetrics?.totalSessions?.toLocaleString('pt-BR') || '0'}
                     </p>
                   </div>
                   <BarChart3 className="h-8 w-8 text-purple-600" />
                 </div>
               </div>
             </div>

             {/* Events by Type */}
             {eventMetrics?.eventsByType && (
               <div className="bg-white p-6 rounded-lg shadow-sm border">
                 <h3 className="text-lg font-medium text-gray-900 mb-4">Eventos por Tipo</h3>
                 <ResponsiveContainer width="100%" height={300}>
                   <BarChart data={eventMetrics.eventsByType}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="type" />
                     <YAxis />
                     <Tooltip />
                     <Bar dataKey="count" fill="#3B82F6" />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
             )}

             {/* Conversion Funnel */}
             {eventMetrics?.conversionFunnel && (
               <div className="bg-white p-6 rounded-lg shadow-sm border">
                 <h3 className="text-lg font-medium text-gray-900 mb-4">Funil de Conversão</h3>
                 <div className="space-y-4">
                   {eventMetrics.conversionFunnel.map((step: any, index: number) => (
                     <div key={step.step} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                       <div className="flex items-center">
                         <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm mr-3">
                           {index + 1}
                         </div>
                         <span className="font-medium text-gray-900">{step.step}</span>
                       </div>
                       <div className="text-right">
                         <p className="font-bold text-gray-900">{step.count.toLocaleString('pt-BR')}</p>
                         <p className="text-sm text-gray-500">{step.rate.toFixed(1)}%</p>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </div>
         )}

         {/* Detailed Metrics Tab */}
         {activeTab === 'metrics' && (
           <div className="space-y-8">
             {/* Metrics based on selected type */}
             {selectedMetric === 'users' && userMetrics && (
               <>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white p-6 rounded-lg shadow-sm border">
                     <h3 className="text-lg font-medium text-gray-900 mb-4">Novos Usuários</h3>
                     <ResponsiveContainer width="100%" height={300}>
                       <LineChart data={userMetrics.newUsers}>
                         <CartesianGrid strokeDasharray="3 3" />
                         <XAxis dataKey="date" />
                         <YAxis />
                         <Tooltip />
                         <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} />
                       </LineChart>
                     </ResponsiveContainer>
                   </div>
                   <div className="bg-white p-6 rounded-lg shadow-sm border">
                     <h3 className="text-lg font-medium text-gray-900 mb-4">Usuários Ativos</h3>
                     <ResponsiveContainer width="100%" height={300}>
                       <LineChart data={userMetrics.activeUsers}>
                         <CartesianGrid strokeDasharray="3 3" />
                         <XAxis dataKey="date" />
                         <YAxis />
                         <Tooltip />
                         <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
                       </LineChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
               </>
             )}

             {selectedMetric === 'products' && productMetrics && (
               <>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="bg-white p-6 rounded-lg shadow-sm border">
                     <h3 className="text-lg font-medium text-gray-900 mb-4">Produtos Mais Visualizados</h3>
                     <div className="space-y-3">
                       {productMetrics.topViewedProducts?.slice(0, 5).map((product: any, index: number) => (
                         <div key={product.product_id} className="flex items-center justify-between">
                           <div className="flex items-center">
                             <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-medium mr-2">
                               {index + 1}
                             </span>
                             <span className="text-sm text-gray-900 truncate">{product.product_name}</span>
                           </div>
                           <span className="text-sm font-medium text-gray-600">{product.views}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                   <div className="bg-white p-6 rounded-lg shadow-sm border">
                     <h3 className="text-lg font-medium text-gray-900 mb-4">Mais Adicionados ao Carrinho</h3>
                     <div className="space-y-3">
                       {productMetrics.topAddedToCart?.slice(0, 5).map((product: any, index: number) => (
                         <div key={product.product_id} className="flex items-center justify-between">
                           <div className="flex items-center">
                             <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs font-medium mr-2">
                               {index + 1}
                             </span>
                             <span className="text-sm text-gray-900 truncate">{product.product_name}</span>
                           </div>
                           <span className="text-sm font-medium text-gray-600">{product.additions}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                   <div className="bg-white p-6 rounded-lg shadow-sm border">
                     <h3 className="text-lg font-medium text-gray-900 mb-4">Produtos Mais Comprados</h3>
                     <div className="space-y-3">
                       {productMetrics.topPurchasedProducts?.slice(0, 5).map((product: any, index: number) => (
                         <div key={product.product_id} className="flex items-center justify-between">
                           <div className="flex items-center">
                             <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs font-medium mr-2">
                               {index + 1}
                             </span>
                             <span className="text-sm text-gray-900 truncate">{product.product_name}</span>
                           </div>
                           <span className="text-sm font-medium text-gray-600">{product.purchases}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               </>
             )}

             {selectedMetric === 'stores' && storeMetrics && (
               <>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="bg-white p-6 rounded-lg shadow-sm border">
                     <h3 className="text-lg font-medium text-gray-900 mb-4">Lojas Mais Visualizadas</h3>
                     <div className="space-y-3">
                       {storeMetrics.topViewedStores?.slice(0, 8).map((store: any, index: number) => (
                         <div key={store.store_id} className="flex items-center justify-between">
                           <div className="flex items-center">
                             <span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-xs font-medium mr-2">
                               {index + 1}
                             </span>
                             <span className="text-sm text-gray-900 truncate">{store.store_name}</span>
                           </div>
                           <span className="text-sm font-medium text-gray-600">{store.views}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                   <div className="bg-white p-6 rounded-lg shadow-sm border">
                     <h3 className="text-lg font-medium text-gray-900 mb-4">Engajamento das Lojas</h3>
                     <div className="space-y-3">
                       {storeMetrics.storeEngagement?.slice(0, 8).map((store: any, index: number) => (
                         <div key={store.store_id} className="flex items-center justify-between">
                           <div className="flex items-center">
                             <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-medium mr-2">
                               {index + 1}
                             </span>
                             <span className="text-sm text-gray-900 truncate">{store.store_name}</span>
                           </div>
                           <div className="text-right">
                             <p className="text-sm font-medium text-gray-600">{store.contacts} contatos</p>
                             <p className="text-xs text-gray-500">{store.product_views} visualizações</p>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               </>
             )}

             {/* Default overview metrics */}
             {selectedMetric === 'overview' && analyticsMetrics && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="bg-white p-6 rounded-lg shadow-sm border">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-gray-500">Total de Eventos</p>
                       <p className="text-2xl font-bold text-gray-900">
                         {analyticsMetrics.totalEvents?.toLocaleString('pt-BR') || '0'}
                       </p>
                     </div>
                     <Eye className="h-8 w-8 text-blue-600" />
                   </div>
                 </div>
                 <div className="bg-white p-6 rounded-lg shadow-sm border">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-gray-500">Usuários Únicos</p>
                       <p className="text-2xl font-bold text-gray-900">
                         {analyticsMetrics.uniqueUsers?.toLocaleString('pt-BR') || '0'}
                       </p>
                     </div>
                     <Users className="h-8 w-8 text-green-600" />
                   </div>
                 </div>
                 <div className="bg-white p-6 rounded-lg shadow-sm border">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-gray-500">Taxa de Conversão</p>
                       <p className="text-2xl font-bold text-gray-900">
                         {analyticsMetrics.conversionRate?.toFixed(2) || '0.00'}%
                       </p>
                     </div>
                     <Target className="h-8 w-8 text-purple-600" />
                   </div>
                 </div>
                 <div className="bg-white p-6 rounded-lg shadow-sm border">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-gray-500">Receita Total</p>
                       <p className="text-2xl font-bold text-gray-900">
                         R$ {(analyticsMetrics.totalRevenue || 0).toLocaleString('pt-BR')}
                       </p>
                     </div>
                     <DollarSign className="h-8 w-8 text-green-600" />
                   </div>
                 </div>
               </div>
             )}
           </div>
         )}
       </div>
     </div>
   )
 }