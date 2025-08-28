'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Eye, Calendar, Percent, DollarSign, Settings, Target, Shuffle } from 'lucide-react';
import { CreateCouponData, UpdateCouponData } from '@/types';

interface CouponFormData {
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  minimumOrderValue: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerCustomer: number;
  isActive: boolean;
  isAutoApply: boolean;
  autoApplyCategory?: string;
  autoApplyFirstPurchase: boolean;
  startDate: string;
  endDate?: string;
  storeId?: string;
  applicableCategories: string[];
  applicableProducts: string[];
  applicableStores: string[];
}

const CouponFormContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEdit = !!editId;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    minimumOrderValue: 0,
    usageLimitPerCustomer: 1,
    isActive: true,
    isAutoApply: false,
    autoApplyFirstPurchase: false,
    startDate: new Date().toISOString().split('T')[0],
    applicableCategories: [],
    applicableProducts: [],
    applicableStores: []
  });

  const [preview, setPreview] = useState({
    originalTotal: 100,
    discountAmount: 0,
    finalTotal: 100
  });

  // Carregar dados do cupom se for edição
  useEffect(() => {
    if (isEdit && editId) {
      loadCoupon();
    }
  }, [isEdit, editId]);

  // Atualizar preview quando dados mudam
  useEffect(() => {
    updatePreview();
  }, [formData.type, formData.value, formData.minimumOrderValue, formData.maximumDiscountAmount]);

  const loadCoupon = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/coupons?id=${editId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const coupon = data.data;
        setFormData({
          code: coupon.code,
          name: coupon.name,
          description: coupon.description || '',
          type: coupon.type,
          value: coupon.value,
          minimumOrderValue: coupon.minimumOrderValue || 0,
          maximumDiscountAmount: coupon.maximumDiscountAmount,
          usageLimit: coupon.usageLimit,
          usageLimitPerCustomer: coupon.usageLimitPerCustomer || 1,
          isActive: coupon.isActive,
          isAutoApply: coupon.isAutoApply,
          autoApplyCategory: coupon.autoApplyCategory,
          autoApplyFirstPurchase: coupon.autoApplyFirstPurchase,
          startDate: coupon.startDate.split('T')[0],
          endDate: coupon.endDate ? coupon.endDate.split('T')[0] : undefined,
          storeId: coupon.storeId,
          applicableCategories: coupon.applicableCategories || [],
          applicableProducts: coupon.applicableProducts || [],
          applicableStores: coupon.applicableStores || []
        });
      } else {
        setError('Cupom não encontrado');
      }
    } catch (err) {
      console.error('Erro ao carregar cupom:', err);
      setError('Erro ao carregar cupom');
    } finally {
      setLoading(false);
    }
  };

  const updatePreview = () => {
    const originalTotal = 100; // Valor exemplo
    let discountAmount = 0;

    if (originalTotal >= formData.minimumOrderValue) {
      if (formData.type === 'percentage') {
        discountAmount = (originalTotal * formData.value) / 100;
      } else {
        discountAmount = Math.min(formData.value, originalTotal);
      }

      if (formData.maximumDiscountAmount) {
        discountAmount = Math.min(discountAmount, formData.maximumDiscountAmount);
      }
    }

    setPreview({
      originalTotal,
      discountAmount,
      finalTotal: originalTotal - discountAmount
    });
  };

  const handleInputChange = (field: keyof CouponFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleInputChange('code', result);
  };

  const validateForm = (): string | null => {
    if (!formData.code.trim()) return 'Código é obrigatório';
    if (!formData.name.trim()) return 'Nome é obrigatório';
    if (formData.value <= 0) return 'Valor deve ser maior que zero';
    if (formData.type === 'percentage' && formData.value > 100) return 'Percentual não pode ser maior que 100%';
    if (formData.minimumOrderValue < 0) return 'Valor mínimo não pode ser negativo';
    if (formData.usageLimitPerCustomer < 1) return 'Limite por cliente deve ser pelo menos 1';
    if (formData.endDate && formData.endDate < formData.startDate) return 'Data de fim deve ser posterior à data de início';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = '/api/coupons';
      const method = isEdit ? 'PUT' : 'POST';
      
      const payload: CreateCouponData | UpdateCouponData = {
        ...(isEdit && { id: editId }),
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        value: formData.value,
        minimumOrderValue: formData.minimumOrderValue,
        maximumDiscountAmount: formData.maximumDiscountAmount,
        usageLimit: formData.usageLimit,
        usageLimitPerCustomer: formData.usageLimitPerCustomer,
        isActive: formData.isActive,
        isAutoApply: formData.isAutoApply,
        autoApplyCategory: formData.autoApplyCategory,
        autoApplyFirstPurchase: formData.autoApplyFirstPurchase,
        startDate: formData.startDate,
        endDate: formData.endDate,
        storeId: formData.storeId,
        applicableCategories: formData.applicableCategories.length > 0 ? formData.applicableCategories : undefined,
        applicableProducts: formData.applicableProducts.length > 0 ? formData.applicableProducts : undefined,
        applicableStores: formData.applicableStores.length > 0 ? formData.applicableStores : undefined
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin/coupons');
      } else {
        setError(data.error || 'Erro ao salvar cupom');
      }
    } catch (err) {
      console.error('Erro ao salvar cupom:', err);
      setError('Erro ao salvar cupom');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando cupom...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'basic', label: 'Informações Básicas', icon: Settings },
    { id: 'rules', label: 'Regras de Uso', icon: Target },
    { id: 'advanced', label: 'Configurações Avançadas', icon: Calendar }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEdit ? 'Editar Cupom' : 'Novo Cupom'}
                </h1>
                <p className="text-gray-600">
                  {isEdit ? 'Modifique as informações do cupom' : 'Crie um novo cupom de desconto'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/admin/coupons')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="coupon-form"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar Cupom'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form id="coupon-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Tabs */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === tab.id
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="p-6">
                  {/* Basic Tab */}
                  {activeTab === 'basic' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Código do Cupom *
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={formData.code}
                              onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ex: DESCONTO10"
                              maxLength={20}
                            />
                            <button
                              type="button"
                              onClick={generateCouponCode}
                              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                              title="Gerar código aleatório"
                            >
                              <Shuffle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome do Cupom *
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ex: Desconto de 10%"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descrição
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Descrição opcional do cupom"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Desconto *
                          </label>
                          <select
                            value={formData.type}
                            onChange={(e) => handleInputChange('type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="percentage">Percentual (%)</option>
                            <option value="fixed_amount">Valor Fixo (R$)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Valor do Desconto *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              {formData.type === 'percentage' ? (
                                <Percent className="w-4 h-4 text-gray-400" />
                              ) : (
                                <DollarSign className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <input
                              type="number"
                              value={formData.value}
                              onChange={(e) => handleInputChange('value', parseFloat(e.target.value) || 0)}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder={formData.type === 'percentage' ? '10' : '50.00'}
                              min="0"
                              max={formData.type === 'percentage' ? '100' : undefined}
                              step={formData.type === 'percentage' ? '1' : '0.01'}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => handleInputChange('isActive', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Cupom ativo</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Rules Tab */}
                  {activeTab === 'rules' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Valor Mínimo do Pedido
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                            </div>
                            <input
                              type="number"
                              value={formData.minimumOrderValue}
                              onChange={(e) => handleInputChange('minimumOrderValue', parseFloat(e.target.value) || 0)}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        {formData.type === 'percentage' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Desconto Máximo (R$)
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <DollarSign className="w-4 h-4 text-gray-400" />
                              </div>
                              <input
                                type="number"
                                value={formData.maximumDiscountAmount || ''}
                                onChange={(e) => handleInputChange('maximumDiscountAmount', parseFloat(e.target.value) || undefined)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Sem limite"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Limite Total de Usos
                          </label>
                          <input
                            type="number"
                            value={formData.usageLimit || ''}
                            onChange={(e) => handleInputChange('usageLimit', parseInt(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ilimitado"
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Limite por Cliente
                          </label>
                          <input
                            type="number"
                            value={formData.usageLimitPerCustomer}
                            onChange={(e) => handleInputChange('usageLimitPerCustomer', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Data de Início
                          </label>
                          <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Data de Expiração
                          </label>
                          <input
                            type="date"
                            value={formData.endDate || ''}
                            onChange={(e) => handleInputChange('endDate', e.target.value || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min={formData.startDate}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Advanced Tab */}
                  {activeTab === 'advanced' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.isAutoApply}
                            onChange={(e) => handleInputChange('isAutoApply', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Aplicar automaticamente</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.autoApplyFirstPurchase}
                            onChange={(e) => handleInputChange('autoApplyFirstPurchase', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Apenas para primeira compra</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Loja Específica
                        </label>
                        <input
                          type="text"
                          value={formData.storeId || ''}
                          onChange={(e) => handleInputChange('storeId', e.target.value || undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="ID da loja (opcional)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Categoria para Auto-aplicação
                        </label>
                        <input
                          type="text"
                          value={formData.autoApplyCategory || ''}
                          onChange={(e) => handleInputChange('autoApplyCategory', e.target.value || undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Categoria específica (opcional)"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Preview Sidebar */}
          <div className="space-y-6">
            {/* Preview Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Preview do Cupom</h3>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-1">
                      {formData.code || 'CÓDIGO'}
                    </div>
                    <div className="text-sm opacity-90">
                      {formData.name || 'Nome do Cupom'}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {formData.type === 'percentage' 
                          ? `${formData.value}%`
                          : `R$ ${formData.value.toFixed(2)}`
                        }
                      </div>
                      <div className="text-sm opacity-90">
                        {formData.type === 'percentage' ? 'de desconto' : 'de desconto'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulation */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Simulação</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor original:</span>
                      <span className="text-gray-900">R$ {preview.originalTotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Desconto:</span>
                      <span className="text-green-600">- R$ {preview.discountAmount.toFixed(2)}</span>
                    </div>
                    
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-900">Total final:</span>
                        <span className="text-gray-900">R$ {preview.finalTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditions */}
                <div className="text-xs text-gray-500 space-y-1">
                  {formData.minimumOrderValue > 0 && (
                    <div>• Valor mínimo: R$ {formData.minimumOrderValue.toFixed(2)}</div>
                  )}
                  {formData.usageLimit && (
                    <div>• Limite: {formData.usageLimit} usos</div>
                  )}
                  {formData.endDate && (
                    <div>• Válido até: {new Date(formData.endDate).toLocaleDateString('pt-BR')}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 Dicas</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use códigos fáceis de lembrar</li>
                <li>• Defina limites para controlar custos</li>
                <li>• Configure datas de validade</li>
                <li>• Teste o cupom antes de ativar</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CouponFormPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando formulário de cupom...</p>
        </div>
      </div>
    }>
      <CouponFormContent />
    </Suspense>
  );
};

export default CouponFormPage;