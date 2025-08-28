'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Package, TrendingDown, TrendingUp, History } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  stock: number

  store: {
    id: string
    name: string
  }
}

interface StockMovement {
  id: string
  type: string
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  createdAt: string
  user: {
    name: string
  }
}

interface StockAdjustment {
  productId: string
  quantity: number
  type: 'ADJUSTMENT' | 'RESTOCK' | 'DAMAGE' | 'EXPIRED'
  reason: string
}

export default function StockManagement() {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [stockHistory, setStockHistory] = useState<StockMovement[]>([])
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false)
  const [adjustment, setAdjustment] = useState<StockAdjustment>({
    productId: '',
    quantity: 0,
    type: 'ADJUSTMENT',
    reason: ''
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchStockData()
  }, [])

  const fetchStockData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stock')
      if (!response.ok) throw new Error('Erro ao carregar dados de estoque')
      
      const data = await response.json()
      setLowStockProducts(data.products.lowStock || [])
      setOutOfStockProducts(data.products.outOfStock || [])
    } catch (error) {
      console.error('Erro ao carregar estoque:', error)
      toast.error('Erro ao carregar dados de estoque')
    } finally {
      setLoading(false)
    }
  }

  const fetchStockHistory = async (productId: string) => {
    try {
      const response = await fetch(`/api/stock/${productId}?limit=20`)
      if (!response.ok) throw new Error('Erro ao carregar histórico')
      
      const data = await response.json()
      setStockHistory(data.movements || [])
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
      toast.error('Erro ao carregar histórico de estoque')
    }
  }

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    setAdjustment(prev => ({ ...prev, productId: product.id }))
    fetchStockHistory(product.id)
  }

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustment.productId || !adjustment.reason.trim()) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustment)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao fazer ajuste')
      }

      toast.success('Ajuste de estoque realizado com sucesso')
      setShowAdjustmentForm(false)
      setAdjustment({ productId: '', quantity: 0, type: 'ADJUSTMENT', reason: '' })
      
      // Recarregar dados
      await fetchStockData()
      if (selectedProduct) {
        await fetchStockHistory(selectedProduct.id)
      }
    } catch (error) {
      console.error('Erro ao fazer ajuste:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer ajuste')
    } finally {
      setSubmitting(false)
    }
  }

  const getStockStatus = (stock: number, threshold: number = 10) => {
    if (stock === 0) return { label: 'Esgotado', variant: 'destructive' as const }
    if (stock <= threshold) return { label: 'Estoque Baixo', variant: 'secondary' as const }
    return { label: 'Normal', variant: 'default' as const }
  }

  const formatMovementType = (type: string) => {
    const types: Record<string, string> = {
      SALE: 'Venda',
      RETURN: 'Devolução',
      ADJUSTMENT: 'Ajuste',
      RESTOCK: 'Reposição',
      DAMAGE: 'Avaria',
      EXPIRED: 'Vencido'
    }
    return types[type] || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Package className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando dados de estoque...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumo de Estoque */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Esgotados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ações</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowAdjustmentForm(true)}
              className="w-full"
              disabled={!selectedProduct}
            >
              Fazer Ajuste
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos com Problemas de Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Produtos Esgotados */}
              {outOfStockProducts.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 mb-2">Esgotados</h4>
                  <div className="space-y-2">
                    {outOfStockProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedProduct?.id === product.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleProductSelect(product)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.store.name}</p>
                          </div>
                          <Badge variant="destructive">Esgotado</Badge>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Estoque: {product.stock}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Produtos com Estoque Baixo */}
              {lowStockProducts.length > 0 && (
                <div>
                  <h4 className="font-medium text-yellow-600 mb-2">Estoque Baixo</h4>
                  <div className="space-y-2">
                    {lowStockProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedProduct?.id === product.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleProductSelect(product)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.store.name}</p>
                          </div>
                          <Badge variant="secondary">Estoque Baixo</Badge>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Estoque: {product.stock}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {outOfStockProducts.length === 0 && lowStockProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Todos os produtos estão com estoque adequado!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Histórico do Produto Selecionado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Movimentações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProduct ? (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">{selectedProduct.name}</h4>
                  <p className="text-sm text-gray-600">{selectedProduct.store.name}</p>
                  <div className="mt-2 flex items-center gap-4">
                    <span className="text-sm">Estoque Atual: <strong>{selectedProduct.stock}</strong></span>
                    <Badge {...getStockStatus(selectedProduct.stock, 10)}>
                      {getStockStatus(selectedProduct.stock, 10).label}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {stockHistory.map((movement) => (
                    <div key={movement.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">{formatMovementType(movement.type)}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(movement.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Quantidade: {movement.quantity > 0 ? '+' : ''}{movement.quantity}</p>
                        <p>Estoque: {movement.previousStock} → {movement.newStock}</p>
                        <p>Motivo: {movement.reason}</p>
                        <p>Por: {movement.user.name}</p>
                      </div>
                    </div>
                  ))}
                  {stockHistory.length === 0 && (
                    <p className="text-center text-gray-500 py-4">Nenhuma movimentação encontrada</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione um produto para ver o histórico</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Ajuste de Estoque */}
      {showAdjustmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Fazer Ajuste de Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
                {selectedProduct && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{selectedProduct.name}</p>
                    <p className="text-sm text-gray-600">Estoque atual: {selectedProduct.stock}</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="type">Tipo de Ajuste</Label>
                  <Select
                    value={adjustment.type}
                    onValueChange={(value: any) => setAdjustment(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADJUSTMENT">Ajuste Manual</SelectItem>
                      <SelectItem value="RESTOCK">Reposição</SelectItem>
                      <SelectItem value="DAMAGE">Avaria</SelectItem>
                      <SelectItem value="EXPIRED">Produto Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={adjustment.quantity}
                    onChange={(e) => setAdjustment(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    placeholder="Digite a quantidade (+ para adicionar, - para remover)"
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Motivo</Label>
                  <Textarea
                    id="reason"
                    value={adjustment.reason}
                    onChange={(e) => setAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Descreva o motivo do ajuste"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAdjustmentForm(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? 'Processando...' : 'Confirmar Ajuste'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}