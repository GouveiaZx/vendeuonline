'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, TrendingUp, DollarSign, Calendar, Users, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCommissionStore } from '@/store/commissionStore';
import SalesCommissionReports from '@/components/SalesCommissionReports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function CommissionFinancialReportsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    transactions, 
    payouts, 
    loading, 
    error, 
    fetchTransactions, 
    fetchPayouts,
    clearError 
  } = useCommissionStore();
  
  const [activeTab, setActiveTab] = useState('sales-reports');
  const [summaryStats, setSummaryStats] = useState({
    totalRevenue: 0,
    totalCommissions: 0,
    totalPayouts: 0,
    pendingPayouts: 0,
    averageCommissionRate: 0,
    totalStores: 0,
    transactionCount: 0
  });

  // Verificar autenticação e permissões
  useEffect(() => {
    if (!user) {
      toast.error('Acesso negado. Faça login para acessar esta página.');
      router.push('/login');
      return;
    }
  }, [user, router]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async () => {
    try {
      // Buscar dados dos últimos 30 dias
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      await Promise.all([
        fetchTransactions({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }),
        fetchPayouts()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      toast.error('Erro ao carregar dados. Tente novamente.');
    }
  };

  // Calcular estatísticas resumidas
  useEffect(() => {
    if (transactions.length > 0 || payouts.length > 0) {
      calculateSummaryStats();
    }
  }, [transactions, payouts]);

  const calculateSummaryStats = () => {
    // Calcular totais das transações
    const totalRevenue = transactions.reduce((sum, t) => sum + t.orderAmount, 0);
    const totalCommissions = transactions.reduce((sum, t) => sum + t.commissionAmount, 0);
    const averageCommissionRate = totalRevenue > 0 ? (totalCommissions / totalRevenue) * 100 : 0;
    
    // Calcular totais dos repasses
    const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);
    const pendingPayouts = payouts
      .filter(p => ['pending', 'processing'].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0);
    
    // Contar lojas únicas
    const uniqueStores = new Set(transactions.map(t => t.storeId));
    const totalStores = uniqueStores.size;

    setSummaryStats({
      totalRevenue,
      totalCommissions,
      totalPayouts,
      pendingPayouts,
      averageCommissionRate,
      totalStores,
      transactionCount: transactions.length
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleRetry = () => {
    clearError();
    loadInitialData();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Relatórios Financeiros de Comissões</h1>
              <p className="text-gray-600 mt-1">Análise detalhada de vendas, comissões e repasses</p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <div className="flex-1">
                  <h3 className="text-red-800 font-medium">Erro ao carregar dados</h3>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
                <Button onClick={handleRetry} variant="outline" size="sm">
                  Tentar novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo Executivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Receita Total (30d)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summaryStats.totalRevenue)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {summaryStats.totalStores} lojas ativas
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
                  <p className="text-sm font-medium text-gray-500">Comissões Geradas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summaryStats.totalCommissions)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Taxa média: {summaryStats.averageCommissionRate.toFixed(2)}%
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
                  <p className="text-sm font-medium text-gray-500">Repasses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summaryStats.totalPayouts)}
                  </p>
                  <p className="text-sm text-yellow-600 mt-1">
                    Pendente: {formatCurrency(summaryStats.pendingPayouts)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Relatórios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Relatórios Detalhados
            </CardTitle>
            <CardDescription>
              Análise aprofundada de vendas e comissões por diferentes perspectivas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sales-reports">Relatórios de Vendas</TabsTrigger>
                <TabsTrigger value="commission-analysis">Análise de Comissões</TabsTrigger>
                <TabsTrigger value="payout-tracking">Controle de Repasses</TabsTrigger>
              </TabsList>
              
              <TabsContent value="sales-reports" className="mt-6">
                <SalesCommissionReports />
              </TabsContent>
              
              <TabsContent value="commission-analysis" className="mt-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Análise de Comissões por Período</CardTitle>
                      <CardDescription>
                        Visualize a evolução das comissões ao longo do tempo
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>Análise de comissões em desenvolvimento</p>
                        <p className="text-sm">Em breve: gráficos de tendência e comparações</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="payout-tracking" className="mt-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Controle de Repasses</CardTitle>
                      <CardDescription>
                        Acompanhe o status dos repasses para vendedores
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>Controle de repasses em desenvolvimento</p>
                        <p className="text-sm">Em breve: dashboard de repasses e processamento em lote</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Links Rápidos */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/admin/commission')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Dashboard Principal</h3>
                  <p className="text-sm text-gray-600">Visão geral do sistema</p>
                </div>
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/admin/commission-rates')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Configurar Taxas</h3>
                  <p className="text-sm text-gray-600">Gerenciar taxas de comissão</p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/admin/payouts')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Gestão de Repasses</h3>
                  <p className="text-sm text-gray-600">Processar repasses</p>
                </div>
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}