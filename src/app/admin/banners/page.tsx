'use client';

import React, { useState, useEffect } from 'react';
import { useBannerStore } from '@/store/bannerStore';
import { Banner } from '@/types';
import BannerForm from '@/components/banners/BannerForm';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ImageIcon,
  ExternalLink,
  Calendar,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { DeleteConfirmDialog, StatusChangeConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingButton, ContextLoading } from '@/components/ui/LoadingStates';

export default function BannersPage() {
  const { banners, loading, error, fetchBanners, deleteBanner, toggleBannerStatus } = useBannerStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; banner: Banner | null }>({ show: false, banner: null });
  const [statusConfirm, setStatusConfirm] = useState<{ show: boolean; banner: Banner | null }>({ show: false, banner: null });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleToggleStatus = async (bannerId: string) => {
    setActionLoading(bannerId);
    try {
      await toggleBannerStatus(bannerId);
      toast.success('Status do banner atualizado!');
      setStatusConfirm({ show: false, banner: null });
    } catch (error) {
      toast.error('Erro ao atualizar status do banner');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (bannerId: string) => {
    setActionLoading(bannerId);
    try {
      await deleteBanner(bannerId);
      toast.success('Banner excluído com sucesso!');
      setDeleteConfirm({ show: false, banner: null });
    } catch (error) {
      toast.error('Erro ao excluir banner');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = () => {
    setSelectedBanner(null);
    setShowForm(true);
  };

  const handleEdit = (banner: Banner) => {
    setSelectedBanner(banner);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedBanner(null);
  };

  const getStatusBadge = (banner: Banner) => {
    const now = new Date();
    const startDate = banner.startDate ? new Date(banner.startDate) : null;
    const endDate = banner.endDate ? new Date(banner.endDate) : null;
    
    if (!banner.isActive) {
      return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">Inativo</span>;
    }
    
    if (startDate && now < startDate) {
      return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Agendado</span>;
    }
    
    if (endDate && now > endDate) {
      return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">Expirado</span>;
    }
    
    return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Ativo</span>;
  };

  const getPositionLabel = (position: number) => {
    const labels: Record<number, string> = {
      1: 'Cabeçalho',
      2: 'Barra Lateral', 
      3: 'Rodapé',
      4: 'Categoria'
    };
    return labels[position] || `Posição ${position}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="text-red-800 font-medium">Erro ao carregar banners</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => fetchBanners()}
                className="ml-auto bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <ContextLoading type="products" message="Carregando banners..." />
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Banners</h1>
            <p className="text-gray-600">Gerencie banners publicitários da plataforma</p>
          </div>
          <button 
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Banner
          </button>
        </div>

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ImageIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total de Banners</p>
                  <p className="text-2xl font-bold text-gray-900">{banners.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Banners Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {banners.filter(b => b.isActive).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ExternalLink className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total de Cliques</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {banners.reduce((sum, b) => sum + (b.clicks || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Agendados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {banners.filter(b => {
                      const now = new Date();
                      const startDate = b.startDate ? new Date(b.startDate) : new Date();
                      return b.isActive && now < startDate;
                    }).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Banners Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* Banner Image */}
                <div className="aspect-video bg-gray-100 relative">
                  <img 
                    src={banner.imageUrl} 
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(banner)}
                  </div>
                </div>
                
                {/* Banner Info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">{banner.title}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {getPositionLabel(banner.position)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">{banner.description}</p>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Cliques:</span>
                      <span className="font-medium ml-1">{banner.clicks || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Impressões:</span>
                      <span className="font-medium ml-1">{banner.impressions || 0}</span>
                    </div>
                  </div>
                  
                  {/* Dates */}
                  <div className="text-xs text-gray-500 mb-4">
                    <div>Início: {banner.startDate ? new Date(banner.startDate).toLocaleDateString('pt-BR') : 'Não definido'}</div>
                    <div>Fim: {banner.endDate ? new Date(banner.endDate).toLocaleDateString('pt-BR') : 'Não definido'}</div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(banner)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setStatusConfirm({ show: true, banner })}
                        disabled={loading || actionLoading === banner.id}
                        className="text-green-600 hover:text-green-800 p-1 disabled:opacity-50"
                      >
                        {actionLoading === banner.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          banner.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm({ show: true, banner })}
                        disabled={loading || actionLoading === banner.id}
                        className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                      >
                        {actionLoading === banner.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    
                    {banner.isActive && (
                      <div className="text-xs text-green-600 font-medium">
                        CTR: {(banner.impressions || 0) > 0 ? (((banner.clicks || 0) / (banner.impressions || 0)) * 100).toFixed(2) : 0}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && banners.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum banner encontrado</h3>
            <p className="text-gray-500 mb-4">Comece criando seu primeiro banner publicitário</p>
            <button 
              onClick={handleCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar Banner
            </button>
          </div>
        )}

        {/* Banner Form Modal */}
        {showForm && (
          <BannerForm
            isOpen={showForm}
            onClose={handleCloseForm}
            banner={selectedBanner}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={deleteConfirm.show}
          onClose={() => setDeleteConfirm({ show: false, banner: null })}
          onConfirm={() => deleteConfirm.banner && handleDelete(deleteConfirm.banner.id)}
          itemName={deleteConfirm.banner?.title || ''}
          loading={actionLoading === deleteConfirm.banner?.id}
        />

        {/* Status Change Confirmation Dialog */}
        <StatusChangeConfirmDialog
          isOpen={statusConfirm.show}
          onClose={() => setStatusConfirm({ show: false, banner: null })}
          onConfirm={() => statusConfirm.banner && handleToggleStatus(statusConfirm.banner.id)}
          itemName={statusConfirm.banner?.title || ''}
          newStatus={statusConfirm.banner?.isActive ? 'inativo' : 'ativo'}
          loading={actionLoading === statusConfirm.banner?.id}
        />
      </div>
    </div>
  );
}