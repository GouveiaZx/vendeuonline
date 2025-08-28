'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Plus, Minus } from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { useAuthStore } from '@/store/authStore';
import ImageUpload, { UploadedImage } from '@/components/ui/ImageUpload';
import Link from 'next/link';

interface ProductForm {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  brand: string;
  condition: 'new' | 'used' | 'refurbished';
  stock: number;
  images: UploadedImage[];
  specifications: { key: string; value: string }[];
  freeShipping: boolean;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  status: 'active' | 'inactive' | 'draft';
}

const categoryOptions = [
  'EletrÃ´nicos',
  'ImÃ³veis',
  'VeÃ­culos',
  'Roupas',
  'Comida',
  'ServiÃ§os',
  'Emprego',
  'MÃ³veis'
];

const conditionOptions = [
  { value: 'new', label: 'Novo' },
  { value: 'used', label: 'Usado' },
  { value: 'refurbished', label: 'Recondicionado' }
];

export default function NewProductPage() {
  const router = useRouter();
  const { createProduct } = useProductStore();
  const { user } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    description: '',
    price: 0,
    originalPrice: undefined,
    category: '',
    brand: '',
    condition: 'new',
    stock: 0,
    images: [],
    specifications: [{ key: '', value: '' }],
    freeShipping: false,
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0
    },
    status: 'draft'
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do produto Ã© obrigatÃ³rio';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'DescriÃ§Ã£o Ã© obrigatÃ³ria';
    }

    if (formData.price <= 0) {
      newErrors.price = 'PreÃ§o deve ser maior que zero';
    }

    if (!formData.category) {
      newErrors.category = 'Categoria Ã© obrigatÃ³ria';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Marca Ã© obrigatÃ³ria';
    }

    if (formData.stock < 0) {
      newErrors.stock = 'Estoque nÃ£o pode ser negativo';
    }

    if (formData.images.length === 0) {
      newErrors.images = 'Pelo menos uma imagem Ã© obrigatÃ³ria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'active') => {
    e.preventDefault();
    
    if (status === 'active' && !validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Filter out empty specifications
      const cleanSpecs = formData.specifications.filter(spec => spec.key.trim() && spec.value.trim());
      const imageUrls = formData.images.map(img => img.url);

      const productData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        categoryId: formData.category,
        brand: formData.brand,
        condition: formData.condition,
        stock: formData.stock,

        weight: formData.weight,
        dimensions: {
           ...formData.dimensions,
           unit: 'cm' as const
         },
        isFeatured: false,
        images: formData.images.map((img, index) => ({
          id: `img-${index}`,
          url: img.url,
          alt: formData.name,
          order: index
        })),
        specifications: cleanSpecs.map(spec => ({
          name: spec.key,
          value: spec.value
        }))
      };

      await createProduct(productData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.push('/seller/products');
    } catch (error) {
      console.error('Error creating product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagesChange = (images: UploadedImage[]) => {
    setFormData({ ...formData, images });
  };

  const handleSpecificationChange = (index: number, field: 'key' | 'value', value: string) => {
    const newSpecs = [...formData.specifications];
    newSpecs[index][field] = value;
    setFormData({ ...formData, specifications: newSpecs });
  };

  const addSpecificationField = () => {
    setFormData({
      ...formData,
      specifications: [...formData.specifications, { key: '', value: '' }]
    });
  };

  const removeSpecificationField = (index: number) => {
    if (formData.specifications.length > 1) {
      const newSpecs = formData.specifications.filter((_, i) => i !== index);
      setFormData({ ...formData, specifications: newSpecs });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/seller/products">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Adicionar Produto</h1>
            <p className="text-gray-600 mt-1">
              Preencha as informaÃ§Ãµes do seu produto
            </p>
          </div>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">InformaÃ§Ãµes BÃ¡sicas</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: iPhone 13 Pro Max 256GB"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DescriÃ§Ã£o *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Descreva seu produto em detalhes..."
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione uma categoria</option>
                  {categoryOptions.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca *
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.brand ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Apple, Samsung, Nike"
                />
                {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CondiÃ§Ã£o
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {conditionOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estoque *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.stock ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Quantidade disponÃ­vel"
                />
                {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">PreÃ§os</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PreÃ§o de Venda *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.price ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0,00"
                  />
                </div>
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PreÃ§o Original (opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.originalPrice || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      originalPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0,00"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Para mostrar desconto (preÃ§o riscado)
                </p>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Imagens do Produto</h2>
            
            <ImageUpload
              bucket="products"
              folder="products"
              currentImageUrl={formData.images[0]?.url}
              onImageChange={(url, path) => {
                 if (url) {
                   const newImage: UploadedImage = { 
                     url, 
                     path: path || '', 
                     file: null as any 
                   };
                   setFormData({ ...formData, images: [newImage, ...formData.images.slice(1)] });
                 }
               }}
              onError={(error) => console.error('Erro no upload:', error)}
              multiple={true}
              maxFiles={5}
            />
            
            {errors.images && <p className="text-red-500 text-sm mt-4">{errors.images}</p>}
            
            <p className="text-sm text-gray-500 mt-4">
              A primeira imagem serÃ¡ usada como imagem principal do produto.
            </p>
          </div>

          {/* Specifications */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">EspecificaÃ§Ãµes TÃ©cnicas</h2>
            
            <div className="space-y-4">
              {formData.specifications.map((spec, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={spec.key}
                      onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Cor, Tamanho, Material"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Azul, G, AlgodÃ£o"
                    />
                  </div>
                  
                  {formData.specifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSpecificationField(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addSpecificationField}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Adicionar especificaÃ§Ã£o
              </button>
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">InformaÃ§Ãµes de Envio</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="freeShipping"
                  checked={formData.freeShipping}
                  onChange={(e) => setFormData({ ...formData, freeShipping: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="freeShipping" className="ml-2 block text-sm text-gray-900">
                  Frete grÃ¡tis
                </label>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DimensÃµes (cm)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="number"
                    min="0"
                    value={formData.dimensions.length}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensions: { ...formData.dimensions, length: parseFloat(e.target.value) || 0 }
                    })}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Comprimento"
                  />
                  <input
                    type="number"
                    min="0"
                    value={formData.dimensions.width}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensions: { ...formData.dimensions, width: parseFloat(e.target.value) || 0 }
                    })}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Largura"
                  />
                  <input
                    type="number"
                    min="0"
                    value={formData.dimensions.height}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensions: { ...formData.dimensions, height: parseFloat(e.target.value) || 0 }
                    })}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Altura"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Link href="/seller/products">
              <button
                type="button"
                className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </Link>
            
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'draft')}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : 'Salvar como Rascunho'}
            </button>
            
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'active')}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Publicando...' : 'Publicar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


