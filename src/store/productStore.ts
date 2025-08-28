import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { Product } from '@/types';
import { apiRequestWithRetry, handleApiError, checkApiHealth } from '@/utils/errorHandler';



export interface ProductFilters {
  search: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  brands: string[];
  conditions: string[];
  freeShippingOnly: boolean;
  minRating: number;
  location: string;
  city: string;
  state: string;
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular';
}

interface ProductStore {
  products: Product[];
  filteredProducts: Product[];
  filters: ProductFilters;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  
  // Actions
  fetchProducts: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    city?: string;
    state?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => Promise<void>;
  fetchProductById: (id: string) => Promise<Product | null>;
  createProduct: (product: {
    name: string;
    description: string;
    price: number;
    categoryId: string;
    brand: string;
    condition: 'new' | 'used' | 'refurbished';
    stock: number;

    weight?: number;
    dimensions?: { length: number; width: number; height: number; unit: 'cm' | 'm' };
    isFeatured?: boolean;
    images: { id: string; url: string; alt: string; order: number }[];
    specifications: { name: string; value: string }[];
  }) => Promise<void>;
  updateProduct: (id: string, updates: Partial<{
    name: string;
    description: string;
    price: number;
    categoryId: string;
    brand: string;
    condition: 'new' | 'used' | 'refurbished';
    stock: number;

    weight?: number;
    dimensions?: { length: number; width: number; height: number; unit: 'cm' | 'm' };
    isFeatured?: boolean;
    isActive?: boolean;
    images: { id: string; url: string; alt: string; order: number }[];
    specifications: { name: string; value: string }[];
  }>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  setFilters: (filters: Partial<ProductFilters>) => void;
  resetFilters: () => void;
  applyFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  getProductsByStore: (storeId: string) => Promise<Product[]>;
  getFeaturedProducts: () => Promise<Product[]>;
  getRelatedProducts: (productId: string, limit?: number) => Promise<Product[]>;
}

// Estado inicial da paginação
const initialPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

// Filtros padrão
const defaultFilters: ProductFilters = {
  search: '',
  category: '',
  minPrice: 0,
  maxPrice: 0,
  brands: [],
  conditions: [],
  freeShippingOnly: false,
  minRating: 0,
  location: '',
  city: '',
  state: '',
  sortBy: 'relevance'
};

const initialState = {
  products: [],
  filteredProducts: [],
  filters: defaultFilters,
  loading: false,
  error: null,
  pagination: initialPagination,
};

// Cache do getServerSnapshot para evitar loop infinito
const cachedServerSnapshot = () => initialState;

export const useProductStore = create<ProductStore>()(
  persist(
    devtools((set, get) => ({
  ...initialState,

  fetchProducts: async (params = {}) => {
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
      
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.search) searchParams.append('search', params.search);
      if (params.category) searchParams.append('category', params.category);
      if (params.minPrice) searchParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice) searchParams.append('maxPrice', params.maxPrice.toString());
      if (params.city) searchParams.append('city', params.city);
      if (params.state) searchParams.append('state', params.state);
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
      
      const response = await apiRequestWithRetry(`/api/products?${searchParams.toString()}`);
      
      set({ 
        products: response.products,
        filteredProducts: response.products,
        pagination: {
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
          hasNext: response.pagination.hasNext,
          hasPrev: response.pagination.hasPrev,
        },
        loading: false 
      });
    } catch (error) {
      const apiError = handleApiError(error);
      set({ 
        error: apiError.message,
        loading: false 
      });
    }
  },
  
  fetchProductById: async (id) => {
    try {
      set({ loading: true, error: null });
      const product = await apiRequestWithRetry(`/api/products/${id}`);
      set({ loading: false });
      return product;
    } catch (error) {
      const apiError = handleApiError(error);
      set({ 
        error: apiError.message,
        loading: false 
      });
      return null;
    }
  },
  
  createProduct: async (productData) => {
    try {
      set({ loading: true, error: null });
      
      await apiRequestWithRetry('/api/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
      
      // Recarregar produtos após criação
      await get().fetchProducts();
      set({ loading: false });
    } catch (error) {
      const apiError = handleApiError(error);
      set({ 
        error: apiError.message,
        loading: false 
      });
      throw error;
    }
  },
  
  updateProduct: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      
      await apiRequestWithRetry(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      // Atualizar produto na lista local
      const products = get().products.map(product => 
        product.id === id ? { ...product, ...updates } : product
      );
      set({ products, filteredProducts: products, loading: false });
    } catch (error) {
      const apiError = handleApiError(error);
      set({ 
        error: apiError.message,
        loading: false 
      });
      throw error;
    }
  },
  
  deleteProduct: async (id) => {
    try {
      set({ loading: true, error: null });
      
      await apiRequestWithRetry(`/api/products/${id}`, {
        method: 'DELETE',
      });
      
      // Remover produto da lista local
      const products = get().products.filter(product => product.id !== id);
      set({ products, filteredProducts: products, loading: false });
    } catch (error) {
      const apiError = handleApiError(error);
      set({ 
        error: apiError.message,
        loading: false 
      });
      throw error;
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
    // Com APIs reais, os filtros são aplicados no servidor
    // Podemos chamar fetchProducts com os novos filtros
    const { filters } = get();
    const updatedFilters = { ...filters, ...newFilters };
    get().fetchProducts({
      search: updatedFilters.search,
      category: updatedFilters.category,
      minPrice: updatedFilters.minPrice > 0 ? updatedFilters.minPrice : undefined,
      maxPrice: updatedFilters.maxPrice > 0 ? updatedFilters.maxPrice : undefined,
      sortBy: updatedFilters.sortBy !== 'relevance' ? updatedFilters.sortBy : undefined,
    });
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
    get().fetchProducts(); // Recarregar produtos sem filtros
  },

  applyFilters: () => {
    // Com APIs reais, os filtros são aplicados no servidor
    // Esta função agora apenas chama fetchProducts com os filtros atuais
    const { filters } = get();
    get().fetchProducts({
      search: filters.search,
      category: filters.category,
      minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
      maxPrice: filters.maxPrice > 0 ? filters.maxPrice : undefined,
      sortBy: filters.sortBy !== 'relevance' ? filters.sortBy : undefined,
    });
  },

  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  getProductsByStore: async (storeId) => {
    try {
      const response = await apiRequestWithRetry(`/api/products?storeId=${storeId}`);
      return response.products;
    } catch (error) {
      console.error('Erro ao carregar produtos da loja:', error);
      return [];
    }
  },

  getFeaturedProducts: async () => {
    try {
      const response = await apiRequestWithRetry('/api/products?featured=true&limit=8');
      return response.products;
    } catch (error) {
      console.error('Erro ao carregar produtos em destaque:', error);
      return [];
    }
  },

  getRelatedProducts: async (productId, limit = 4) => {
    try {
      const response = await apiRequestWithRetry(`/api/products/${productId}/related?limit=${limit}`);
      return response.products;
    } catch (error) {
      console.error('Erro ao carregar produtos relacionados:', error);
      return [];
    }
  }
    })),
    {
      name: 'product-store',
      skipHydration: true,
      partialize: (state) => ({
        filters: state.filters,
        products: [], // Não persistir produtos para sempre buscar atualizados
        filteredProducts: [],
        loading: false,
        error: null,
        pagination: initialPagination
      }),
    }
  )
);

export default useProductStore;