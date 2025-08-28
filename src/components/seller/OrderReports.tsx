import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, Package, DollarSign, Users, ShoppingCart } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/types';

interface OrderReportsProps {
  orders: Order[];
  isLoading?: boolean;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const OrderReports: React.FC<OrderReportsProps> = ({ orders, isLoading }) => {
  const [dateRange, setDateRange] = useState('30');
  const [reportType, setReportType] = useState('overview');

  const dateRangeInDays = parseInt(dateRange);

  const filteredOrders = useMemo(() => {
    const cutoffDate = subDays(new Date(), dateRangeInDays);
    return orders.filter(order => new Date(order.createdAt) >= cutoffDate);
  }, [orders, dateRangeInDays]);

  const reportData = useMemo(() => {
    const salesByDate = filteredOrders.reduce((acc, order) => {
      const date = format(new Date(order.createdAt), 'dd/MM', { locale: ptBR });
      if (!acc[date]) {
        acc[date] = { date, sales: 0, orders: 0 };
      }
      acc[date].sales += order.total;
      acc[date].orders += 1;
      return acc;
    }, {} as Record<string, { date: string; sales: number; orders: number }>);

    const salesByProduct = filteredOrders.reduce((acc, order) => {
      order.items.forEach(item => {
        const key = item.product?.name || 'Produto não encontrado';
        if (!acc[key]) {
          acc[key] = { name: key, sales: 0, quantity: 0, revenue: 0 };
        }
        acc[key].sales += item.quantity;
        acc[key].revenue += item.price * item.quantity;
      });
      return acc;
    }, {} as Record<string, { name: string; sales: number; quantity: number; revenue: number }>);

    const statusDistribution = filteredOrders.reduce((acc, order) => {
      const status = order.status;
      if (!acc[status]) {
        acc[status] = { name: status, value: 0 };
      }
      acc[status].value += 1;
      return acc;
    }, {} as Record<string, { name: string; value: number }>);

    const paymentMethodStats = filteredOrders.reduce((acc, order) => {
      const method = order.paymentMethod;
      if (!acc[method]) {
        acc[method] = { name: method, value: 0, revenue: 0 };
      }
      acc[method].value += 1;
      acc[method].revenue += order.total;
      return acc;
    }, {} as Record<string, { name: string; value: number; revenue: number }>);

    return {
      salesByDate: Object.values(salesByDate).sort((a, b) => 
        new Date(a.date.split('/').reverse().join('/')).getTime() - 
        new Date(b.date.split('/').reverse().join('/')).getTime()
      ),
      salesByProduct: Object.values(salesByProduct).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
      statusDistribution: Object.values(statusDistribution),
      paymentMethodStats: Object.values(paymentMethodStats),
      totalRevenue: filteredOrders.reduce((sum, order) => sum + order.total, 0),
      totalOrders: filteredOrders.length,
      averageOrderValue: filteredOrders.length > 0 ? filteredOrders.reduce((sum, order) => sum + order.total, 0) / filteredOrders.length : 0,
      topProducts: Object.values(salesByProduct).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      dailyAverage: filteredOrders.length > 0 ? filteredOrders.reduce((sum, order) => sum + order.total, 0) / dateRangeInDays : 0,
    };
  }, [filteredOrders, dateRangeInDays]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios de Vendas</h2>
          <p className="text-gray-600 mt-1">Análise detalhada do desempenho de vendas</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="365">1 ano</SelectItem>
            </SelectContent>
          </Select>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Visão Geral</SelectItem>
              <SelectItem value="products">Produtos</SelectItem>
              <SelectItem value="customers">Clientes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Últimos {dateRangeInDays} dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Média diária: {Math.round(reportData.totalOrders / dateRangeInDays)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Por pedido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredOrders.map(order => order.buyer?.id).filter(Boolean)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Clientes únicos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tendência de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.salesByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.salesByProduct.slice(0, 5)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Produto: ${label}`}
                />
                <Bar dataKey="revenue" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Métodos de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.paymentMethodStats.map((method, index) => (
                <div key={method.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{method.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatCurrency(method.revenue)}</div>
                    <div className="text-xs text-gray-500">{method.value} pedidos</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhes dos Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Produto</th>
                  <th className="text-right py-3 px-4 font-semibold">Quantidade</th>
                  <th className="text-right py-3 px-4 font-semibold">Receita</th>
                  <th className="text-right py-3 px-4 font-semibold">Ticket Médio</th>
                </tr>
              </thead>
              <tbody>
                {reportData.salesByProduct.map((product, index) => (
                  <tr key={product.name} className="border-b">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">{product.sales}</td>
                    <td className="text-right py-3 px-4 font-semibold">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="text-right py-3 px-4">
                      {formatCurrency(product.revenue / product.sales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderReports;