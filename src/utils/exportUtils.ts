import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Tipos para os dados de exportação
export interface CommissionTransaction {
  id: string
  orderId: string
  storeId: string
  storeName?: string
  categoryId: string
  orderAmount: number
  commissionRate: number
  commissionAmount: number
  commissionType: string
  status: string
  createdAt: string
  paidAt?: string
}

export interface CommissionPayout {
  id: string
  storeId: string
  storeName?: string
  period: string
  totalCommission: number
  totalPayout: number
  transactionCount: number
  status: string
  processedAt?: string
  paymentMethod?: string
  createdAt: string
}

export interface SalesReport {
  period: string
  totalSales: number
  totalCommission: number
  transactionCount: number
  averageCommissionRate: number
}

// Função para exportar transações de comissão em Excel
export function exportCommissionTransactionsExcel(
  transactions: CommissionTransaction[],
  filters: {
    startDate?: string
    endDate?: string
    storeId?: string
    storeName?: string
  } = {}
) {
  // Preparar dados para o Excel
  const excelData = transactions.map(transaction => ({
    'Data': format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    'ID do Pedido': transaction.orderId,
    'Loja': transaction.storeName || 'N/A',
    'Categoria': transaction.categoryId,
    'Valor do Pedido': transaction.orderAmount,
    'Taxa de Comissão (%)': transaction.commissionRate,
    'Valor da Comissão': transaction.commissionAmount,
    'Tipo de Comissão': transaction.commissionType === 'percentage' ? 'Percentual' : 'Fixo',
    'Status': transaction.status === 'paid' ? 'Pago' : transaction.status === 'pending' ? 'Pendente' : 'Cancelado',
    'Data de Pagamento': transaction.paidAt ? format(new Date(transaction.paidAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'
  }))

  // Criar workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(excelData)

  // Ajustar largura das colunas
  const colWidths = [
    { wch: 15 }, // Data
    { wch: 20 }, // ID do Pedido
    { wch: 25 }, // Loja
    { wch: 15 }, // Categoria
    { wch: 15 }, // Valor do Pedido
    { wch: 18 }, // Taxa de Comissão
    { wch: 18 }, // Valor da Comissão
    { wch: 18 }, // Tipo de Comissão
    { wch: 12 }, // Status
    { wch: 18 }  // Data de Pagamento
  ]
  ws['!cols'] = colWidths

  // Adicionar planilha ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Transações de Comissão')

  // Criar planilha de resumo
  const totalCommission = transactions.reduce((sum, t) => sum + t.commissionAmount, 0)
  const totalSales = transactions.reduce((sum, t) => sum + t.orderAmount, 0)
  const paidCommission = transactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.commissionAmount, 0)
  const pendingCommission = transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.commissionAmount, 0)

  const summaryData = [
    { 'Métrica': 'Total de Transações', 'Valor': transactions.length },
    { 'Métrica': 'Total de Vendas', 'Valor': `R$ ${totalSales.toFixed(2)}` },
    { 'Métrica': 'Total de Comissões', 'Valor': `R$ ${totalCommission.toFixed(2)}` },
    { 'Métrica': 'Comissões Pagas', 'Valor': `R$ ${paidCommission.toFixed(2)}` },
    { 'Métrica': 'Comissões Pendentes', 'Valor': `R$ ${pendingCommission.toFixed(2)}` },
    { 'Métrica': 'Taxa Média de Comissão', 'Valor': `${transactions.length > 0 ? (totalCommission / totalSales * 100).toFixed(2) : 0}%` }
  ]

  if (filters.startDate || filters.endDate) {
    summaryData.unshift({
      'Métrica': 'Período',
      'Valor': `${filters.startDate ? format(new Date(filters.startDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Início'} - ${filters.endDate ? format(new Date(filters.endDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Fim'}`
    })
  }

  if (filters.storeName) {
    summaryData.unshift({ 'Métrica': 'Loja', 'Valor': filters.storeName })
  }

  summaryData.unshift({ 'Métrica': 'Gerado em', 'Valor': format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR }) })

  const summaryWs = XLSX.utils.json_to_sheet(summaryData)
  summaryWs['!cols'] = [{ wch: 25 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumo')

  // Salvar o arquivo
  const fileName = `transacoes-comissao-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// Função para exportar repasses em Excel
export function exportPayoutsExcel(
  payouts: CommissionPayout[],
  filters: {
    startDate?: string
    endDate?: string
    storeId?: string
    storeName?: string
  } = {}
) {
  // Preparar dados para o Excel
  const excelData = payouts.map(payout => ({
    'Período': payout.period,
    'Loja': payout.storeName || 'N/A',
    'Total de Comissão': payout.totalCommission,
    'Valor do Repasse': payout.totalPayout,
    'Número de Transações': payout.transactionCount,
    'Status': payout.status === 'completed' ? 'Concluído' : payout.status === 'processing' ? 'Processando' : payout.status === 'pending' ? 'Pendente' : 'Falhou',
    'Data de Processamento': payout.processedAt ? format(new Date(payout.processedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A',
    'Método de Pagamento': payout.paymentMethod || 'N/A',
    'Data de Criação': format(new Date(payout.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  }))

  // Criar workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(excelData)

  // Ajustar largura das colunas
  const colWidths = [
    { wch: 12 }, // Período
    { wch: 25 }, // Loja
    { wch: 18 }, // Total de Comissão
    { wch: 18 }, // Valor do Repasse
    { wch: 20 }, // Número de Transações
    { wch: 15 }, // Status
    { wch: 20 }, // Data de Processamento
    { wch: 20 }, // Método de Pagamento
    { wch: 18 }  // Data de Criação
  ]
  ws['!cols'] = colWidths

  // Adicionar planilha ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Repasses de Comissão')

  // Criar planilha de resumo
  const totalPayouts = payouts.reduce((sum, p) => sum + p.totalPayout, 0)
  const totalCommissions = payouts.reduce((sum, p) => sum + p.totalCommission, 0)
  const completedPayouts = payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.totalPayout, 0)
  const pendingPayouts = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.totalPayout, 0)

  const summaryData = [
    { 'Métrica': 'Total de Repasses', 'Valor': payouts.length },
    { 'Métrica': 'Total de Comissões', 'Valor': `R$ ${totalCommissions.toFixed(2)}` },
    { 'Métrica': 'Total de Repasses', 'Valor': `R$ ${totalPayouts.toFixed(2)}` },
    { 'Métrica': 'Repasses Concluídos', 'Valor': `R$ ${completedPayouts.toFixed(2)}` },
    { 'Métrica': 'Repasses Pendentes', 'Valor': `R$ ${pendingPayouts.toFixed(2)}` }
  ]

  if (filters.startDate || filters.endDate) {
    summaryData.unshift({
      'Métrica': 'Período',
      'Valor': `${filters.startDate ? format(new Date(filters.startDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Início'} - ${filters.endDate ? format(new Date(filters.endDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Fim'}`
    })
  }

  if (filters.storeName) {
    summaryData.unshift({ 'Métrica': 'Loja', 'Valor': filters.storeName })
  }

  summaryData.unshift({ 'Métrica': 'Gerado em', 'Valor': format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR }) })

  const summaryWs = XLSX.utils.json_to_sheet(summaryData)
  summaryWs['!cols'] = [{ wch: 25 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumo')

  // Salvar o arquivo
  const fileName = `repasses-comissao-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// Função para exportar relatório de vendas em Excel
export function exportSalesReportExcel(
  salesData: SalesReport[],
  filters: {
    startDate?: string
    endDate?: string
    storeId?: string
    storeName?: string
  } = {}
) {
  // Preparar dados para o Excel
  const excelData = salesData.map(data => ({
    'Período': data.period,
    'Total de Vendas': data.totalSales,
    'Total de Comissões': data.totalCommission,
    'Número de Transações': data.transactionCount,
    'Taxa Média de Comissão (%)': data.averageCommissionRate
  }))

  // Criar workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(excelData)

  // Ajustar largura das colunas
  const colWidths = [
    { wch: 15 }, // Período
    { wch: 18 }, // Total de Vendas
    { wch: 20 }, // Total de Comissões
    { wch: 22 }, // Número de Transações
    { wch: 25 }  // Taxa Média de Comissão
  ]
  ws['!cols'] = colWidths

  // Adicionar planilha ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório de Vendas')

  // Criar planilha de resumo
  const totalSales = salesData.reduce((sum, d) => sum + d.totalSales, 0)
  const totalCommissions = salesData.reduce((sum, d) => sum + d.totalCommission, 0)
  const totalTransactions = salesData.reduce((sum, d) => sum + d.transactionCount, 0)

  const summaryData = [
    { 'Métrica': 'Total de Vendas', 'Valor': `R$ ${totalSales.toFixed(2)}` },
    { 'Métrica': 'Total de Comissões', 'Valor': `R$ ${totalCommissions.toFixed(2)}` },
    { 'Métrica': 'Total de Transações', 'Valor': totalTransactions },
    { 'Métrica': 'Taxa Média de Comissão', 'Valor': `${totalSales > 0 ? (totalCommissions / totalSales * 100).toFixed(2) : 0}%` }
  ]

  if (filters.startDate || filters.endDate) {
    summaryData.unshift({
      'Métrica': 'Período',
      'Valor': `${filters.startDate ? format(new Date(filters.startDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Início'} - ${filters.endDate ? format(new Date(filters.endDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Fim'}`
    })
  }

  if (filters.storeName) {
    summaryData.unshift({ 'Métrica': 'Loja', 'Valor': filters.storeName })
  }

  summaryData.unshift({ 'Métrica': 'Gerado em', 'Valor': format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR }) })

  const summaryWs = XLSX.utils.json_to_sheet(summaryData)
  summaryWs['!cols'] = [{ wch: 25 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumo')

  // Salvar o arquivo
  const fileName = `relatorio-vendas-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// Função para exportar dados genéricos em Excel
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName: string = 'Dados',
  columnWidths?: { [key: string]: number }
) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)

  // Ajustar larguras das colunas se fornecidas
  if (columnWidths && data.length > 0) {
    const cols = Object.keys(data[0]).map(key => ({
      wch: columnWidths[key] || 15
    }))
    ws['!cols'] = cols
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  
  const fileName = `${filename}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// Função para criar CSV simples
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string
) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}