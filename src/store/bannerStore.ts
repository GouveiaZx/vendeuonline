import { create } from 'zustand';

export interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  position: 'HEADER' | 'SIDEBAR' | 'FOOTER' | 'CATEGORY';
  isActive: boolean;
  startDate: string;
  endDate: string;
  clicks: number;
  impressions: number;
  createdAt: string;
  updatedAt?: string;
}

export interface BannerFilters {
  position?: string;
  isActive?: boolean;
  search?: string;
}

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
    set({ loading: true, error: null });
    
    try {
      const params = new URLSearchParams();
      
      if (filters.position) params.append('position', filters.position);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.search) params.append('search', filters.search);
      
      const response = await fetch(`/api/admin/banners?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar banners');
      }
      
      const data = await response.json();
      set({ banners: data.banners || [], loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        loading: false 
      });
    }
  },

  createBanner: async (bannerData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bannerData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar banner');
      }
      
      const data = await response.json();
      set(state => ({ 
        banners: [data.data, ...state.banners],
        loading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        loading: false 
      });
      throw error;
    }
  },

  updateBanner: async (id, bannerData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bannerData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar banner');
      }
      
      const data = await response.json();
      set(state => ({
        banners: state.banners.map(banner => 
          banner.id === id ? data.data : banner
        ),
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        loading: false 
      });
      throw error;
    }
  },

  deleteBanner: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir banner');
      }
      
      set(state => ({
        banners: state.banners.filter(banner => banner.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        loading: false 
      });
      throw error;
    }
  },

  toggleBannerStatus: async (id) => {
    try {
      const response = await fetch(`/api/admin/banners/${id}/toggle`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao alterar status do banner');
      }
      
      const data = await response.json();
      set(state => ({
        banners: state.banners.map(banner => 
          banner.id === id ? data.data : banner
        )
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
      throw error;
    }
  },

  incrementClicks: async (id) => {
    try {
      const response = await fetch(`/api/banners/${id}/click`, {
        method: 'POST',
      });
      
      if (response.ok) {
        set(state => ({
          banners: state.banners.map(banner => 
            banner.id === id 
              ? { ...banner, clicks: banner.clicks + 1 }
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
      const response = await fetch(`/api/banners/${id}/impression`, {
        method: 'POST',
      });
      
      if (response.ok) {
        set(state => ({
          banners: state.banners.map(banner => 
            banner.id === id 
              ? { ...banner, impressions: banner.impressions + 1 }
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