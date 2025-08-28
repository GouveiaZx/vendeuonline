import { create } from 'zustand';
import { Banner, BannerFilters } from '@/types';
import { apiRequestWithRetry, handleApiError, checkApiHealth } from '@/utils/errorHandler';
import { post } from '@/lib/api';

interface BannerStore {
  banners: Banner[];
  loading: boolean;
  error: string | null;
  filters: BannerFilters;
  
  // Actions
  fetchBanners: (filters?: BannerFilters) => Promise<void>;
  createBanner: (bannerData: Omit<Banner, 'id' | 'clicks' | 'impressions' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBanner: (id: string, bannerData: Partial<Banner>) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;
  toggleBannerStatus: (id: string) => Promise<void>;
  incrementClicks: (id: string) => Promise<void>;
  incrementImpressions: (id: string) => Promise<void>;
  setFilters: (filters: BannerFilters) => void;
  clearError: () => void;
}

export const useBannerStore = create<BannerStore>((set, get) => ({
  banners: [],
  loading: false,
  error: null,
  filters: {},

  fetchBanners: async (filters = {}) => {
    try {
      set({ loading: true, error: null });
      
      // Verificar se a API está disponível
      const isApiHealthy = await checkApiHealth();
      if (!isApiHealthy) {
        set({ 
          error: 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.',
          loading: false 
        });
        return;
      }
      
      const params = new URLSearchParams();
      
      if (filters.position) params.append('position', filters.position.toString());
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.search) params.append('search', filters.search);
      
      const response = await apiRequestWithRetry(`/api/admin/banners?${params.toString()}`);
      set({ banners: response.banners || [], loading: false });
    } catch (error) {
      const apiError = handleApiError(error);
      set({ 
        error: apiError.message,
        loading: false 
      });
    }
  },

  createBanner: async (bannerData) => {
    try {
      set({ loading: true, error: null });
      const newBanner = await apiRequestWithRetry('/api/admin/banners', {
        method: 'POST',
        body: JSON.stringify(bannerData),
      });
      set(state => ({ 
        banners: [...state.banners, newBanner], 
        loading: false 
      }));
      return newBanner;
    } catch (error) {
      const apiError = handleApiError(error);
      set({ 
        error: apiError.message,
        loading: false 
      });
      throw error;
    }
  },

  updateBanner: async (id, bannerData) => {
    try {
      set({ loading: true, error: null });
      const updatedBanner = await apiRequestWithRetry(`/api/admin/banners/${id}`, {
        method: 'PUT',
        body: JSON.stringify(bannerData),
      });
      set(state => ({
        banners: state.banners.map(banner => 
          banner.id === id ? updatedBanner : banner
        ),
        loading: false
      }));
      return updatedBanner;
    } catch (error) {
      const apiError = handleApiError(error);
      set({ 
        error: apiError.message,
        loading: false 
      });
      throw error;
    }
  },

  deleteBanner: async (id) => {
    try {
      set({ loading: true, error: null });
      await apiRequestWithRetry(`/api/admin/banners/${id}`, {
        method: 'DELETE',
      });
      set(state => ({
        banners: state.banners.filter(banner => banner.id !== id),
        loading: false
      }));
    } catch (error) {
      const apiError = handleApiError(error);
      set({ 
        error: apiError.message,
        loading: false 
      });
      throw error;
    }
  },

  toggleBannerStatus: async (id) => {
    try {
      set({ loading: true, error: null });
      const updatedBanner = await apiRequestWithRetry(`/api/admin/banners/${id}/toggle`, {
        method: 'PATCH',
      });
      set(state => ({
        banners: state.banners.map(banner => 
          banner.id === id ? updatedBanner : banner
        ),
        loading: false
      }));
      return updatedBanner;
    } catch (error) {
      const apiError = handleApiError(error);
      set({ 
        error: apiError.message,
        loading: false 
      });
      throw error;
    }
  },

  incrementClicks: async (id) => {
    try {
      const response = await post(`/api/banners/${id}/click`);
      if (response.success) {
        set(state => ({
          banners: state.banners.map(banner =>
            banner.id === id
              ? { ...banner, clicks: (banner.clicks || 0) + 1 }
              : banner
          )
        }));
      }
    } catch (error) {
      // Silently fail for analytics
      console.error('Erro ao registrar clique:', error);
    }
  },

  incrementImpressions: async (id) => {
    try {
      const response = await post(`/api/banners/${id}/impression`);
      if (response.success) {
        set(state => ({
          banners: state.banners.map(banner =>
            banner.id === id
              ? { ...banner, impressions: (banner.impressions || 0) + 1 }
              : banner
          )
        }));
      }
    } catch (error) {
      // Silently fail for analytics
      console.error('Erro ao registrar impressão:', error);
    }
  },

  setFilters: (filters) => {
    set({ filters });
  },

  clearError: () => {
    set({ error: null });
  },
}));