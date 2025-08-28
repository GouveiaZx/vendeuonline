import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Download, FileText, Table } from 'lucide-react'
import { toast } from 'sonner'
import {
  exportCommissionTransactionsExcel,
  exportPayoutsExcel,
  exportSalesReportExcel,
  type CommissionTransaction,
  type CommissionPayout,
  type SalesReport
} from '@/utils/exportUtils'

interface ExportReportsProps {
  // Dados para exportação
  transactions?: CommissionTransaction[]
  payouts?: CommissionPayout[]
  salesData?: SalesReport[]
  
  // Configurações
  showTransactions?: boolean
  showPayouts?: boolean
  showSalesReport?: boolean
  
  // Filtros pré-definidos
  defaultStoreId?: string
  defaultStoreName?: string
  
  // Callback para buscar dados com filtros
  onFetchData?: (filters: ExportFilters) => Promise<{
    transactions: CommissionTransaction[]
    payouts: CommissionPayout[]
    salesData: SalesReport[]
  }>
}

export interface ExportFilters {
  startDate?: string
  endDate?: string
  storeId?: string
  storeName?: string
  reportType: 'transactions' | 'payouts' | 'sales'
}

const ExportReports: React.FC<ExportReportsProps> = ({
  transactions = [],
  payouts = [],
  salesData = [],
  showTransactions = true,
  showPayouts = true,
  showSalesReport = true,
  defaultStoreId,
  defaultStoreName,
  onFetchData
}) => {
  const [filters, setFilters] = useState<ExportFilters>({
    startDate: '',
    endDate: '',
    storeId: defaultStoreId || '',
    storeName: defaultStoreName || '',
    reportType: 'transactions'
  })
  
  const [isLoading, setIsLoading] = useState(false)

  // Função para atualizar filtros
  const updateFilter = (key: keyof ExportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Função para exportar dados
  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      setIsLoading(true)
      
      let dataToExport = {
        transactions,
        payouts,
        salesData
      }

      // Se há callback para buscar dados, usar ele
      if (onFetchData) {
        dataToExport = await onFetchData(filters)
      }

      const exportFilters = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        storeId: filters.storeId,
        storeName: filters.storeName
      }

      // Exportar baseado no tipo de relatório
      switch (filters.reportType) {
        case 'transactions':
          exportCommissionTransactionsExcel(dataToExport.transactions || [], exportFilters)
          break
          
        case 'payouts':
          exportPayoutsExcel(dataToExport.payouts || [], exportFilters)
          break
          
        case 'sales':
          exportSalesReportExcel(dataToExport.salesData || [], exportFilters)
          break
      }

      toast.success(`Relatório exportado em ${format.toUpperCase()} com sucesso!`)
    } catch (error) {
      console.error('Erro ao exportar relatório:', error)
      toast.error('Erro ao exportar relatório. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Função para definir datas padrão
  const setDateRange = (range: 'week' | 'month' | 'quarter' | 'year') => {
    const now = new Date()
    const endDate = now.toISOString().split('T')[0]
    let startDate: string

    switch (range) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        startDate = weekAgo.toISOString().split('T')[0]
        break
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        startDate = monthAgo.toISOString().split('T')[0]
        break
      case 'quarter':
        const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        startDate = quarterAgo.toISOString().split('T')[0]
        break
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        startDate = yearAgo.toISOString().split('T')[0]
        break
    }

    setFilters(prev => ({ ...prev, startDate, endDate }))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exportar Relatórios
        </CardTitle>
        <CardDescription>
          Configure os filtros e exporte relatórios de comissões em PDF ou Excel
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Tipo de Relatório */}
        <div className="space-y-2">
          <Label htmlFor="reportType">Tipo de Relatório</Label>
          <Select
            value={filters.reportType}
            onValueChange={(value) => updateFilter('reportType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de relatório" />
            </SelectTrigger>
            <SelectContent>
              {showTransactions && (
                <SelectItem value="transactions">Transações de Comissão</SelectItem>
              )}
              {showPayouts && (
                <SelectItem value="payouts">Repasses de Comissão</SelectItem>
              )}
              {showSalesReport && (
                <SelectItem value="sales">Relatório de Vendas</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Filtros de Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Data Inicial</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => updateFilter('startDate', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endDate">Data Final</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => updateFilter('endDate', e.target.value)}
            />
          </div>
        </div>

        {/* Botões de Período Rápido */}
        <div className="space-y-2">
          <Label>Períodos Rápidos</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange('week')}
              className="text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Última Semana
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange('month')}
              className="text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Último Mês
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange('quarter')}
              className="text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Último Trimestre
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange('year')}
              className="text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Último Ano
            </Button>
          </div>
        </div>

        {/* Filtro de Loja (se não for pré-definido) */}
        {!defaultStoreId && (
          <div className="space-y-2">
            <Label htmlFor="storeId">ID da Loja (Opcional)</Label>
            <Input
              id="storeId"
              placeholder="Digite o ID da loja para filtrar"
              value={filters.storeId}
              onChange={(e) => updateFilter('storeId', e.target.value)}
            />
          </div>
        )}

        {/* Botões de Exportação */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            onClick={() => handleExport('excel')}
            disabled={isLoading}
            className="w-full"
            variant="default"
          >
            <Table className="h-4 w-4 mr-2" />
            {isLoading ? 'Exportando...' : 'Exportar Excel'}
          </Button>
        </div>

        {/* Informações sobre os dados */}
        <div className="text-sm text-muted-foreground space-y-1">
          {filters.reportType === 'transactions' && transactions.length > 0 && (
            <p>• {transactions.length} transações disponíveis para exportação</p>
          )}
          {filters.reportType === 'payouts' && payouts.length > 0 && (
            <p>• {payouts.length} repasses disponíveis para exportação</p>
          )}
          {filters.reportType === 'sales' && salesData.length > 0 && (
            <p>• {salesData.length} períodos de vendas disponíveis para exportação</p>
          )}
          
          {defaultStoreName && (
            <p>• Filtrado para a loja: {defaultStoreName}</p>
          )}
          
          <p>• Os arquivos serão baixados automaticamente após a exportação</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default ExportReports