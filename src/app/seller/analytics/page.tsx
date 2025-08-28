'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Eye, ShoppingCart, DollarSign, Package, Calendar, Download, Loader2, AlertCircle, BarChart3 } from 'lucide-react';
import { useAnalyticsStore, transformStatsToAnalyticsData, transformProductsToPerformance, generateCategoryData } from '@/store/analyticsStore';
import { useStoreData } from '@/store/authStore';
import { toast } from 'sonner';

interface AnalyticsData {
  period: string;
  views: number;
  sales: number;
  revenue: number;
  orders: number;
}

interface ProductPerformance {
  name: string;
  views: number;
  sales: number;
  revenue: number;
  conversion: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export default function SellerAnalyticsPage() {
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const { stats, isLoading, error, period, fetchStoreStats, setPeriod, clearError } = useAnalyticsStore();
  const { sellerId } = useStoreData();

  useEffect(() => {
    if (sellerId) {
      fetchStoreStats(sellerId);
    }
  }, [sellerId, fetchStoreStats]);

  const handlePeriodChange = async (newPeriod: '7d' | '30d' | '90d' | '1y') => {
    if (sellerId) {
      setPeriod(newPeriod);
      await fetchStoreStats(sellerId, newPeriod);
    }
  };

  const handleRetryFetch = () => {
    if (sellerId) {
      clearError();
      fetchStoreStats(sellerId);
    }
  };

  // Transformar dados da API para o formato dos gráficos
  const analyticsData = stats ? transformStatsToAnalyticsData(stats) : [];
  const productsData = stats ? transformProductsToPerformance(stats.topProducts) : [];
  const categoriesData = generateCategoryData();

  // Calcular métricas
  const totalRevenue = stats?.summary.totalRevenue || 0;
  const totalSales = stats?.summary.totalOrders || 0;
  const totalViews = analyticsData.reduce((sum, item) => sum + item.views, 0);
  const avgConversion = totalViews > 0 ? (totalSales / totalViews) * 100 : 0;
  const totalProducts = stats?.summary.totalProducts || 0;
  const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
  const topSellingProduct = stats?.topProducts?.[0];
  const bestCategory = categoriesData.length > 0 ? categoriesData.reduce((prev, current) => (prev.value > current.value) ? prev : current) : null;

  // Calcular mudanças (comparação simples com dados disponíveis)
  const revenueChange = 0; // Placeholder - API não retorna comparação ainda
  const salesChange = 0;
  const viewsChange = 0;
  const ordersChange = 0;
  const conversionChange = 0;

  const getChangeIcon = (change: number) => {
    return change >= 0 ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const handleExport = () => {
    // Implementar exportação
    console.log('Exportando dados...');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando analytics...</p>
        </div>
      </div>
    );
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Relatórios</h1>
            <p className="text-gray-600">Acompanhe o desempenho da sua loja</p>
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
            <button 
              onClick={handleExport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {totalRevenue.toLocaleString('pt-BR')}
                </p>
                <div className={`flex items-center mt-1 ${getChangeColor(revenueChange)}`}>
                  {getChangeIcon(revenueChange)}
                  <span className="text-sm font-medium ml-1">
                    {Math.abs(revenueChange).toFixed(1)}% vs mês anterior
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
                <p className="text-sm font-medium text-gray-500">Total de Vendas</p>
                <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
                <div className={`flex items-center mt-1 ${getChangeColor(salesChange)}`}>
                  {getChangeIcon(salesChange)}
                  <span className="text-sm font-medium ml-1">
                    {Math.abs(salesChange).toFixed(1)}% vs mês anterior
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
                <p className="text-sm font-medium text-gray-500">Visualizações</p>
                <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString('pt-BR')}</p>
                <div className={`flex items-center mt-1 ${getChangeColor(viewsChange)}`}>
                  {getChangeIcon(viewsChange)}
                  <span className="text-sm font-medium ml-1">
                    {Math.abs(viewsChange).toFixed(1)}% vs mês anterior
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-gray-900">{avgConversion.toFixed(2)}%</p>
                <div className="flex items-center mt-1 text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium ml-1">Média do período</span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Package className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {avgOrderValue.toFixed(2)}
                </p>
                <div className={`flex items-center mt-1 ${getChangeColor(revenueChange)}`}>
                  {getChangeIcon(revenueChange)}
                  <span className="text-sm font-medium ml-1">
                    Baseado em {totalSales} vendas
                  </span>
                </div>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Produtos Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
                <div className="flex items-center mt-1 text-gray-500">
                  <Package className="h-4 w-4" />
                  <span className="text-sm font-medium ml-1">
                    No catálogo
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Produto Top</p>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {topSellingProduct?.name || 'N/A'}
                </p>
                <div className="flex items-center mt-1 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium ml-1">
                    {topSellingProduct?.sales || 0} vendas
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Categoria Top</p>
                <p className="text-lg font-bold text-gray-900">
                  {bestCategory?.name || 'N/A'}
                </p>
                <div className="flex items-center mt-1 text-blue-600">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-medium ml-1">
                    {bestCategory?.value || 0}% das vendas
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                 <BarChart3 className="h-6 w-6 text-blue-600" />
               </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Receita por Período</h3>
              <select 
                value={selectedMetric} 
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="revenue">Receita</option>
                <option value="sales">Vendas</option>
                <option value="views">Visualizações</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    selectedMetric === 'revenue' ? `R$ ${value}` : value,
                    selectedMetric === 'revenue' ? 'Receita' : 
                    selectedMetric === 'sales' ? 'Vendas' : 'Visualizações'
                  ]}
                />
                <Bar 
                  dataKey={selectedMetric} 
                  fill={selectedMetric === 'revenue' ? '#10B981' : 
                        selectedMetric === 'sales' ? '#3B82F6' : '#8B5CF6'} 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas por Categoria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoriesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoriesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Participação']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-4 mt-4">
              {categoriesData.map((category, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {category.name} ({category.value}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendência de Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="views" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                name="Visualizações"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="sales" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Vendas"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Product Performance Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h3>
            <div className="space-y-4">
              {stats?.topProducts?.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium mr-3">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 truncate max-w-[200px]">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sales} vendas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">R$ {product.revenue.toLocaleString('pt-BR')}</p>
                    <p className="text-sm text-gray-500">{((product.sales / totalSales) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">Nenhum produto encontrado</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Conversão</h3>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Taxa de Conversão Geral</p>
                    <p className="text-2xl font-bold text-green-900">{avgConversion.toFixed(2)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Visualizações por Venda</p>
                    <p className="text-2xl font-bold text-blue-900">{totalViews > 0 ? (totalViews / totalSales).toFixed(1) : '0'}</p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-800">Receita por Produto</p>
                    <p className="text-2xl font-bold text-purple-900">R$ {totalProducts > 0 ? (totalRevenue / totalProducts).toFixed(0) : '0'}</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Produtos</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Produto</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Visualizações</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Vendas</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Receita</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Conversão</th>
                </tr>
              </thead>
              <tbody>
                {productsData.length > 0 ? productsData.map((product, index) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{product.name}</td>
                    <td className="py-3 px-4 text-gray-600">{product.views}</td>
                    <td className="py-3 px-4 text-gray-600">{product.sales}</td>
                    <td className="py-3 px-4 text-gray-600">
                      R$ {product.revenue.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.conversion >= 2.5 ? 'bg-green-100 text-green-800' :
                        product.conversion >= 2.0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.conversion.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-gray-500">
                      Nenhum produto encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}