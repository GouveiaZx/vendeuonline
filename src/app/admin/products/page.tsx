'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProductStore } from '@/store/productStore'
import ImageUpload from '@/components/ui/ImageUpload'
import { toast } from 'sonner'

interface ProductFormData {
  name: string
  description: string
  price: number
  categoryId: string
  brand: string
  condition: 'new' | 'used' | 'refurbished'
  stock: number

  weight?: number
  isFeatured: boolean
  images: { id: string; url: string; alt: string; order: number }[]
  specifications: { name: string; value: string }[]
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  categoryId: '',
  brand: '',
  condition: 'new',
  stock: 0,

  weight: 0,
  isFeatured: false,
  images: [],
  specifications: []
}

export default function AdminProductsPage() {
  const {
    products,
    loading,
    error,
    pagination,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  } = useProductStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleImageUpload = (imageUrl: string, imagePath?: string) => {
    if (imageUrl) {
      setUploadedImages(prev => [...prev, imageUrl])
      setFormData(prev => ({
        ...prev,
        images: [
          ...prev.images,
          {
            id: Date.now().toString(),
            url: imageUrl,
            alt: prev.name || 'Produto',

            order: prev.images.length
          }
        ]
      }))
    }
  }

  const handleImageError = (error: string) => {
    toast.error(error)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData)
        toast.success('Produto atualizado com sucesso!')
        setIsEditDialogOpen(false)
      } else {
        await createProduct(formData)
        toast.success('Produto criado com sucesso!')
        setIsCreateDialogOpen(false)
      }
      
      setFormData(initialFormData)
      setUploadedImages([])
      setEditingProduct(null)
    } catch (error) {
      toast.error('Erro ao salvar produto')
    }
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      categoryId: product.categoryId,
      brand: product.brand,
      condition: product.condition,
      stock: product.stock,

      weight: product.weight,
      isFeatured: product.isFeatured,
      images: product.images || [],
      specifications: product.specifications || []
    })
    setUploadedImages(product.images?.map((img: any) => img.url) || [])
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (productId: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteProduct(productId)
        toast.success('Produto excluído com sucesso!')
      } catch (error) {
        toast.error('Erro ao excluir produto')
      }
    }
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setUploadedImages([])
    setEditingProduct(null)
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Produtos</h1>
          <p className="text-gray-600">Gerencie o catálogo de produtos da plataforma</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Produto</DialogTitle>
            </DialogHeader>
            <ProductForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              onImageUpload={handleImageUpload}
              onImageError={handleImageError}
              uploadedImages={uploadedImages}
              loading={loading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p>Carregando produtos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>Erro: {error}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <p>Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Imagem</th>
                    <th className="text-left p-2">Nome</th>
                    <th className="text-left p-2">Marca</th>
                    <th className="text-left p-2">Preço</th>
                    <th className="text-left p-2">Estoque</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-500">Sem imagem</span>
                          </div>
                        )}
                      </td>
                      <td className="p-2 font-medium">{product.name}</td>
                      <td className="p-2">{product.category || 'N/A'}</td>
                      <td className="p-2">R$ {product.price.toFixed(2)}</td>
                      <td className="p-2">{product.stock}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          <ProductForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onImageUpload={handleImageUpload}
            onImageError={handleImageError}
            uploadedImages={uploadedImages}
            loading={loading}
            isEditing={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Componente do formulário de produto
interface ProductFormProps {
  formData: ProductFormData
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>
  onSubmit: (e: React.FormEvent) => void
  onImageUpload: (imageUrl: string, imagePath?: string) => void
  onImageError: (error: string) => void
  uploadedImages: string[]
  loading: boolean
  isEditing?: boolean
}

function ProductForm({
  formData,
  setFormData,
  onSubmit,
  onImageUpload,
  onImageError,
  uploadedImages,
  loading,
  isEditing = false
}: ProductFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Produto</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="brand">Marca</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="stock">Estoque</Label>
          <Input
            id="stock"
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="condition">Condição</Label>
          <Select
            value={formData.condition}
            onValueChange={(value: 'new' | 'used' | 'refurbished') => 
              setFormData(prev => ({ ...prev, condition: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Novo</SelectItem>
              <SelectItem value="used">Usado</SelectItem>
              <SelectItem value="refurbished">Recondicionado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Imagens do Produto</Label>
        <ImageUpload
          bucket="products"
          folder="catalog"
          onImageChange={onImageUpload}
          onError={onImageError}
          multiple={true}
          maxFiles={5}
          className="border rounded-lg p-4"
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'} Produto
        </Button>
      </div>
    </form>
  )
}