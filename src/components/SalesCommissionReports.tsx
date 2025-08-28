'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Calendar, Download, Filter, Eye } from 'lucide-react';
import { useCommissionStore } from '@/store/commissionStore';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ExportReports from '@/components/ExportReports';

interface SalesData {
  period: string;
  totalSales: number;
  totalCommission: number;
  transactionCount: number;
  averageCommissionRate: number;
  topStores: {
      storeId: string;
      storeName: string;
      sales: number;
      commission: number;
      transactionCount: number;
    }[];
  topCategories: {
      categoryId: string;
      categoryName: string;
      sales: number;
      commission: number;
      transactionCount: number;
    }[];
}

interface SalesCommissionReportsProps {
  storeId?: string;
  storeName?: string;
}

const SalesCommissionReports: React.FC<SalesCommissionReportsProps> = ({
  storeId,
  storeName
}) => {
  const { transactions, loading, fetchTransactions } = useCommissionStore();
  const [reportData, setReportData] = useState<SalesData | null>(null);
  const [filters, setFilters] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    storeId: storeId || '',
    groupBy: 'day' as 'day' | 'week' | 'month'
  });
  const [showExportModal, setShowExportModal] = useState(false);

  // Buscar dados quando filtros mudarem
  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    try {
      await fetchTransactions({
        startDate: filters.startDate,
        endDate: filters.endDate,
        storeId: filters.storeId || undefined
      });
      
      // Processar dados para o relatório
      processReportData();
    } catch (error) {
      console.error('Erro ao buscar dados do relatório:', error);
      toast.error('Erro ao carregar dados do relatório');
    }
  };

  const processReportData = () => {
    if (!transactions.length) {
      setReportData(null);
      return;
    }

    // Calcular totais
    const totalSales = transactions.reduce((sum, t) => sum + t.orderAmount, 0);
    const totalCommission = transactions.reduce((sum, t) => sum + t.commissionAmount, 0);
    const transactionCount = transactions.length;
    const averageCommissionRate = totalSales > 0 ? (totalCommission / totalSales) * 100 : 0;

    // Agrupar por loja
    const storeGroups = transactions.reduce((acc, t) => {
      const key = t.storeId;
      if (!acc[key]) {
        acc[key] = {
          storeId: t.storeId,
          storeName: t.storeName || 'Loja não encontrada',
          sales: 0,
          commission: 0,
          transactionCount: 0
        };
      }
      acc[key].sales += t.orderAmount;
      acc[key].commission += t.commissionAmount;
      acc[key].transactionCount += 1;
      return acc;
    }, {} as Record<string, any>);

    // Agrupar por categoria
    const categoryGroups = transactions.reduce((acc, t) => {
      const key = t.categoryId || 'outros';
      if (!acc[key]) {
        acc[key] = {
          categoryId: key,
          categoryName: 'Categoria ' + key,
          sales: 0,
          commission: 0,
          transactionCount: 0
        };
      }
      acc[key].sales += t.orderAmount;
      acc[key].commission += t.commissionAmount;
      acc[key].transactionCount += 1;
      return acc;
    }, {} as Record<string, any>);

    const topStores = Object.values(storeGroups)
      .sort((a: any, b: any) => b.sales - a.sales)
      .slice(0, 10);

    const topCategories = Object.values(categoryGroups)
      .sort((a: any, b: any) => b.sales - a.sales)
      .slice(0, 10);

    setReportData({
      period: `${filters.startDate} a ${filters.endDate}`,
      totalSales,
      totalCommission,
      averageCommissionRate,
      transactionCount,
      topStores,
      topCategories
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const setQuickPeriod = (period: 'today' | 'week' | 'month' | 'quarter') => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (period) {
      case 'today':
        startDate = now;
        break;
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'quarter':
        startDate = subMonths(startOfMonth(now), 3);
        break;
    }

    setFilters(prev => ({
      ...prev,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            
            {!storeId && (
              <div className="space-y-2">
                <Label htmlFor="storeFilter">Loja (Opcional)</Label>
                <Input
                  id="storeFilter"
                  placeholder="ID da loja..."
                  value={filters.storeId}
                  onChange={(e) => handleFilterChange('storeId', e.target.value)}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="groupBy">Agrupar por</Label>
              <Select value={filters.groupBy} onValueChange={(value) => handleFilterChange('groupBy', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Dia</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Períodos rápidos */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setQuickPeriod('today')}>
              Hoje
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickPeriod('week')}>
              Últimos 7 dias
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickPeriod('month')}>
              Este mês
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickPeriod('quarter')}>
              Últimos 3 meses
            </Button>
            <Button 
              className="ml-auto" 
              onClick={() => setShowExportModal(true)}
              disabled={!reportData}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando relatório...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !reportData && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum dado encontrado para o período selecionado</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && reportData && (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Vendas Totais</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(reportData.totalSales)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Comissões Totais</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(reportData.totalCommission)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Taxa Média</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.averageCommissionRate.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total de Pedidos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.transactionCount}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <ShoppingCart className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Lojas */}
          <Card>
            <CardHeader>
              <CardTitle>Top Lojas por Vendas</CardTitle>
              <CardDescription>Lojas com maior volume de vendas no período</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.topStores}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="storeName" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'sales' ? formatCurrency(Number(value)) : formatCurrency(Number(value)),
                      name === 'sales' ? 'Vendas' : 'Comissão'
                    ]}
                  />
                  <Bar dataKey="sales" fill={chartColors[0]} name="sales" />
                  <Bar dataKey="commission" fill={chartColors[1]} name="commission" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Categorias */}
          <Card>
            <CardHeader>
              <CardTitle>Top Categorias por Vendas</CardTitle>
              <CardDescription>Categorias com maior volume de vendas no período</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.topCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="sales"
                  >
                    {reportData.topCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Modal de Exportação */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <ExportReports
              showTransactions={true}
              showPayouts={false}
              showSalesReport={true}
              defaultStoreId={filters.storeId}
              defaultStoreName={storeName}
              onFetchData={async (exportFilters) => {
                // Buscar dados específicos para exportação
                await fetchTransactions({
                  startDate: exportFilters.startDate,
                  endDate: exportFilters.endDate,
                  storeId: exportFilters.storeId || undefined
                });
                
                return {
                  transactions,
                  payouts: [],
                  salesData: reportData ? [{
                    period: reportData.period,
                    totalSales: reportData.totalSales,
                    totalCommission: reportData.totalCommission,
                    transactionCount: reportData.transactionCount,
                    averageCommissionRate: reportData.averageCommissionRate,
                    topStores: reportData.topStores,
                    topCategories: reportData.topCategories
                  }] : []
                };
              }}
            />
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setShowExportModal(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesCommissionReports;