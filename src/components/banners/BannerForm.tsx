'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Calendar, Link, Image, Type, AlignLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useBannerStore } from '@/store/bannerStore';
import { Banner } from '@/types';
import ImageUpload from '@/components/ui/ImageUpload';

interface BannerFormProps {
  isOpen: boolean;
  onClose: () => void;
  banner?: Banner | null;
}

interface FormData {
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  position: 'HEADER' | 'SIDEBAR' | 'FOOTER' | 'CATEGORY';
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function BannerForm({ isOpen, onClose, banner }: BannerFormProps) {
  const { createBanner, updateBanner, loading } = useBannerStore();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    imageUrl: '',
    targetUrl: '',
    position: 'HEADER',
    startDate: '2024-01-01T00:00',
    endDate: '2024-12-31T23:59',
    isActive: true
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    if (banner) {
      // Mapeamento reverso de number para string
      const positionMap: Record<number, 'HEADER' | 'SIDEBAR' | 'FOOTER' | 'CATEGORY'> = {
        1: 'HEADER',
        2: 'SIDEBAR',
        3: 'FOOTER',
        4: 'CATEGORY'
      };
      
      setFormData({
        title: banner.title,
        description: banner.description || '',
        imageUrl: banner.imageUrl,
        targetUrl: banner.link || '',
        position: positionMap[banner.position] || 'HEADER',
        startDate: banner.startDate ? new Date(banner.startDate).toISOString().slice(0, 16) : '',
        endDate: banner.endDate ? new Date(banner.endDate).toISOString().slice(0, 16) : '',
        isActive: banner.isActive
      });
    } else {
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        targetUrl: '',
        position: 'HEADER',
        startDate: '2024-01-01T00:00',
        endDate: '2024-12-31T23:59',
        isActive: true
      });
    }
    setErrors({});
  }, [banner, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = 'Imagem é obrigatória';
    }

    if (!formData.targetUrl.trim()) {
      newErrors.targetUrl = 'URL de destino é obrigatória';
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'Data de fim deve ser posterior à data de início';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Converter position de string para number
      const positionMap = {
        'HEADER': 1,
        'SIDEBAR': 2,
        'FOOTER': 3,
        'CATEGORY': 4
      };
      
      const bannerData = {
        ...formData,
        position: positionMap[formData.position],
        link: formData.targetUrl,
        description: formData.description || undefined,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined
      };
      
      // Remove campos que não pertencem ao Banner
      const { targetUrl, ...finalBannerData } = bannerData;
      
      if (banner) {
        await updateBanner(banner.id, finalBannerData);
        toast.success('Banner atualizado com sucesso!');
      } else {
        await createBanner(finalBannerData);
        toast.success('Banner criado com sucesso!');
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar banner');
    }
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImageUpload = (url: string, path?: string) => {
    setFormData(prev => ({ ...prev, imageUrl: url }));
    if (errors.imageUrl) {
      setErrors(prev => ({ ...prev, imageUrl: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {banner ? 'Editar Banner' : 'Novo Banner'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Type className="h-4 w-4 mr-2" />
              Título
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Digite o título do banner"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <AlignLeft className="h-4 w-4 mr-2" />
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Digite a descrição do banner"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Imagem do Banner */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Image className="h-4 w-4 mr-2" />
              Imagem do Banner
            </label>
            <ImageUpload
              bucket="banners"
              currentImageUrl={formData.imageUrl}
              onImageChange={handleImageUpload}
              onError={(error) => toast.error(error)}
              className="w-full"
            />
            {errors.imageUrl && (
              <p className="text-red-500 text-sm mt-1">{errors.imageUrl}</p>
            )}
          </div>

          {/* URL de Destino */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Link className="h-4 w-4 mr-2" />
              URL de Destino
            </label>
            <input
              type="text"
              value={formData.targetUrl}
              onChange={(e) => handleChange('targetUrl', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.targetUrl ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="/products ou https://exemplo.com"
            />
            {errors.targetUrl && (
              <p className="text-red-500 text-sm mt-1">{errors.targetUrl}</p>
            )}
          </div>

          {/* Posição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Posição
            </label>
            <select
              value={formData.position}
              onChange={(e) => handleChange('position', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="HEADER">Cabeçalho</option>
              <option value="SIDEBAR">Barra Lateral</option>
              <option value="FOOTER">Rodapé</option>
              <option value="CATEGORY">Categoria</option>
            </select>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 mr-2" />
                Data de Início
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 mr-2" />
                Data de Fim
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Banner ativo
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Salvando...' : banner ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}