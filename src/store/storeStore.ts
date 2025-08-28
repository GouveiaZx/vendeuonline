import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware';
import { Store } from '@/types';
import { apiRequestWithRetry, handleApiError, checkApiHealth } from '@/utils/errorHandler';

interface StoreFilters {
  search?: string;
  category?: string;
  city?: string;
  isVerified?: boolean;
  isActive?: boolean;
  plan?: string;
}

interface StorePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface CreateStoreData {
  name: string;
  slug: string;
  description: string;
  category: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  logo?: string;
  banner?: string;
}

interface StoreState {
  stores: Store[];
  currentStore: Store | null;
  loading: boolean;
  error: string | null;
  filters: StoreFilters;
  pagination: StorePagination;
  
  // API functions
  fetchStores: (filters?: StoreFilters, page?: number, limit?: number) => Promise<void>;
  fetchStoreById: (id: string) => Promise<Store | null>;
  fetchStoreBySlug: (slug: string) => Promise<Store | null>;
  createStore: (data: CreateStoreData) => Promise<Store>;
  updateStore: (id: string, data: Partial<CreateStoreData>) => Promise<Store>;
  deleteStore: (id: string) => Promise<void>;
  
  // Local state management
  setCurrentStore: (store: Store | null) => void;
  setFilters: (filters: Partial<StoreFilters>) => void;
  resetFilters: () => void;
  clearError: () => void;
  
  // Convenience methods
  getStoresByCategory: (category: string) => Store[];
  getVerifiedStores: () => Store[];
  getFeaturedStores: () => Store[];
}

const defaultFilters: StoreFilters = {
  search: '',
  category: '',
  city: '',
  isVerified: undefined,
  isActive: undefined,
  plan: ''
};

// Funções utilitárias otimizadas
const buildQueryParams = (params: Record<string, any>): string => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  return queryParams.toString();
};

const apiCall = async (endpoint: string, options?: RequestInit) => {
  const isApiHealthy = await checkApiHealth();
  if (!isApiHealthy) {
    throw new Error('API não está disponível no momento');
  }
  return apiRequestWithRetry(endpoint, options);
};

// Estado inicial para o store  
interface StoreActions {
  fetchStores: (filters?: StoreFilters, page?: number, limit?: number) => Promise<void>;
  fetchStoreById: (id: string) => Promise<Store | null>;
  fetchStoreBySlug: (slug: string) => Promise<Store | null>;
  createStore: (data: CreateStoreData) => Promise<Store>;
  updateStore: (id: string, data: Partial<CreateStoreData>) => Promise<Store>;
  deleteStore: (id: string) => Promise<void>;
  setCurrentStore: (store: Store | null) => void;
  setFilters: (filters: Partial<StoreFilters>) => void;
  resetFilters: () => void;
  clearError: () => void;
  getStoresByCategory: (category: string) => Store[];
  getVerifiedStores: () => Store[];
  getFeaturedStores: () => Store[];
}

const initialState: Omit<StoreState, keyof StoreActions> = {
  stores: [],
  currentStore: null,
  loading: false,
  error: null,
  filters: defaultFilters,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  }
};

// Cache do getServerSnapshot para evitar loop infinito
const cachedServerSnapshot = () => initialState;

export const useStoreStore = create<StoreState>()(
  persist(
    devtools(
      subscribeWithSelector((set, get) => ({
        ...initialState,

        fetchStores: async (filters = {}, page = 1, limit = 10) => {
        try {
          set({ loading: true, error: null });
          
          const queryParams = buildQueryParams({
            page,
            limit,
            ...filters
          });
          
          const response = await apiCall(`/api/stores?${queryParams}`);
          
          set({
            stores: response.stores,
            pagination: response.pagination,
            loading: false
          });
        } catch (error) {
          const apiError = handleApiError(error);
          set({ error: apiError.message, loading: false });
        }
      },

      fetchStoreById: async (id: string) => {
        try {
          set({ loading: true, error: null });
          const store = await apiCall(`/api/stores/${id}`);
          set({ currentStore: store, loading: false });
          return store;
        } catch (error) {
          const apiError = handleApiError(error);
          set({ error: apiError.message, loading: false });
          return null;
        }
      },

      fetchStoreBySlug: async (slug: string) => {
        try {
          set({ loading: true, error: null });
          const store = await apiCall(`/api/stores/slug/${slug}`);
          set({ currentStore: store, loading: false });
          return store;
        } catch (error) {
          const apiError = handleApiError(error);
          set({ error: apiError.message, loading: false });
          return null;
        }
      },

      createStore: async (data: CreateStoreData) => {
        set({ loading: true, error: null });
        const newStore = await apiCall('/api/stores', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
        
        set((state) => ({
          stores: [newStore, ...state.stores],
          loading: false
        }));
        return newStore;
      },

      updateStore: async (id: string, data: Partial<CreateStoreData>) => {
        set({ loading: true, error: null });
        const updatedStore = await apiCall(`/api/stores/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
        
        set((state) => ({
          stores: state.stores.map(store => store.id === id ? updatedStore : store),
          currentStore: state.currentStore?.id === id ? updatedStore : state.currentStore,
          loading: false
        }));
        return updatedStore;
      },

      deleteStore: async (id: string) => {
        set({ loading: true, error: null });
        await apiCall(`/api/stores/${id}`, { method: 'DELETE' });
        
        set((state) => ({
          stores: state.stores.filter(store => store.id !== id),
          currentStore: state.currentStore?.id === id ? null : state.currentStore,
          loading: false
        }));
      },

      setCurrentStore: (store: Store | null) => set({ currentStore: store }),
      setFilters: (filters: Partial<StoreFilters>) => set((state) => ({ 
        filters: { ...state.filters, ...filters } 
      })),
      resetFilters: () => set({ filters: defaultFilters }),
      clearError: () => set({ error: null }),

      // Métodos memoizados
      getStoresByCategory: (category: string) => 
        get().stores.filter(store => store.category === category),
      
      getVerifiedStores: () => get().stores.filter(store => store.isVerified),
      
      getFeaturedStores: () => get().stores.filter(store => store.isFeatured)
      }))
    ),
    {
      name: 'store-store',
      skipHydration: true,
      partialize: (state) => ({
        filters: state.filters,
        stores: [], // Não persistir lojas para sempre buscar atualizadas
        currentStore: null,
        loading: false,
        error: null,
        pagination: initialState.pagination
      }),
    }
  )
);