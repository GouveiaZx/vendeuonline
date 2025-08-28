// Removido import React - stores Zustand não devem usar React hooks
import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware';
import {
  SearchState,
  SearchActions,
  SearchFilters,
  SearchApiResponse,
  SuggestionsApiResponse,
  HistoryApiResponse,
  SearchHistory
} from '@/types';

interface SearchStore extends SearchState, SearchActions {}

const initialFilters: SearchFilters = {
  sortBy: 'relevance',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
  type: 'all',
  includeSuggestions: false,
  includeFilters: true
};

const initialState: SearchState = {
  query: '',
  filters: initialFilters,
  results: null,
  suggestions: null,
  history: {
    recent: [],
    trending: []
  },
  isLoading: false,
  error: null,
  showFilters: false,
  showSuggestions: false
};

// Cache getServerSnapshot para evitar loop infinito
const getServerSnapshot = () => initialState;

// Memoização de funções utilitárias
const buildSearchParams = (filters: SearchFilters): string => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, String(v)));
      } else {
        params.append(key, String(value));
      }
    }
  });
  return params.toString();
};

export const useSearchStore = create<SearchStore>()(
  persist(
    devtools(
      subscribeWithSelector((set, get) => ({
        ...initialState,

        // Ações otimizadas com memoização
        setQuery: (query: string) => {
          set({ query });
        },

        setFilters: (newFilters: Partial<SearchFilters>) => {
          set((state) => ({
            filters: { ...state.filters, ...newFilters, page: 1 }
          }));
        },

        clearFilters: () => {
          set({ filters: { ...initialFilters, q: get().query } });
        },

        search: async (query?: string, filters?: Partial<SearchFilters>) => {
          const state = get();
          const searchQuery = query ?? state.query;
          const searchFilters = { ...state.filters, ...filters };

          if (!searchQuery.trim()) {
            set({ error: 'Digite algo para buscar' });
            return;
          }

          set({ isLoading: true, error: null });

          try {
            // Construir parâmetros para a nova API
            const params = new URLSearchParams();
            
            params.append('query', searchQuery);
            if (searchFilters.type) params.append('type', searchFilters.type);
            if (searchFilters.category) params.append('category', searchFilters.category);
            if (searchFilters.minPrice !== undefined) params.append('minPrice', searchFilters.minPrice.toString());
            if (searchFilters.maxPrice !== undefined) params.append('maxPrice', searchFilters.maxPrice.toString());
            if (searchFilters.city) params.append('city', searchFilters.city);
            if (searchFilters.state) params.append('state', searchFilters.state);
            if (searchFilters.rating !== undefined) params.append('rating', searchFilters.rating.toString());
            if (searchFilters.storeId) params.append('storeId', searchFilters.storeId);
            if (searchFilters.inStock) params.append('inStock', 'true');
             if (searchFilters.hasDiscount) params.append('hasDiscount', 'true');
             if (searchFilters.location && typeof searchFilters.location === 'object') {
               params.append('lat', searchFilters.location.lat.toString());
               params.append('lng', searchFilters.location.lng.toString());
               if (searchFilters.location.radius) {
                 params.append('radius', searchFilters.location.radius.toString());
               }
             }
            if (searchFilters.page) params.append('page', searchFilters.page.toString());
            if (searchFilters.limit) params.append('limit', searchFilters.limit.toString());
            if (searchFilters.sortBy) params.append('sortBy', searchFilters.sortBy);
            if (searchFilters.sortOrder) params.append('sortOrder', searchFilters.sortOrder);

            const response = await fetch(`/api/search/advanced?${params.toString()}`);
            
            if (!response.ok) {
              throw new Error('Erro na busca');
            }
            
            const results = await response.json();

            set({
              results,
              filters: { ...searchFilters, query: searchQuery },
              query: searchQuery,
              isLoading: false,
              error: null
            });

            // Salvar no histórico se houver resultados
            if (results && (results.products.length > 0 || results.stores.length > 0)) {
              setTimeout(() => {
                get().saveSearch(searchQuery);
              }, 100);
            }

          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Erro na busca'
            });
          }
        },

        getSuggestions: async (query: string) => {
          if (!query.trim() || query.length < 2) {
            set({ suggestions: null });
            return;
          }

          try {
            const params = new URLSearchParams({
              q: query,
              limit: '10',
              includeRecent: 'true',
              includeTrending: 'true'
            });

            const response = await fetch(`/api/search/suggestions?${params}`);
            const data: SuggestionsApiResponse = await response.json();

            if (response.ok && data.success && data.data) {
              set({ suggestions: data.data });
            }
          } catch {
            // Falhar silenciosamente
          }
        },

        getHistory: () => {
          // Retorna apenas queries como string[]
          const history = get().history as SearchHistory;
          return history?.recent?.map(item => typeof item === 'string' ? item : item.query) || [];
        },
        
        loadHistory: async () => {
          try {
            const response = await fetch('/api/search/history?includePopular=true&includeRecent=true');
            const data: HistoryApiResponse = await response.json();

            if (response.ok && data.success && data.data) {
              // Mapear dados da API para formato SearchHistory
              const searchHistory: SearchHistory = {
                recent: Array.isArray(data.data.history) ? data.data.history.map((query: any) => ({
                  query: typeof query === 'string' ? query : (query?.query || ''),
                  resultsCount: 0
                })) : [],
                trending: []
              };
              set({ history: searchHistory });
            }
          } catch {
            // Falhar silenciosamente
          }
        },

        saveSearch: async (query: string, filters?: SearchFilters, resultsCount?: number) => {
          // Atualizar histórico local
          set(state => ({
            history: {
              ...state.history,
              recent: [
                { query, resultsCount: resultsCount || 0 },
                ...state.history.recent.filter(item => item.query !== query).slice(0, 9)
              ]
            }
          }));

          try {
            await fetch('/api/search/history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query,
                filters,
                resultsCount: resultsCount || 0
              })
            });
          } catch {
            // Falhar silenciosamente
          }
        },

        // Deletar busca do histórico
        deleteSearch: async (searchId?: string, query?: string, all?: boolean) => {
          try {
            const response = await fetch('/api/search/history', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                searchId,
                query,
                all
              })
            });

            if (response.ok && get().loadHistory) {
              // Recarregar histórico após deletar
              get().loadHistory();
            }
          } catch (error) {
            console.error('Erro ao deletar busca:', error);
            set({ error: 'Erro ao deletar busca' });
          }
        },

        // Controles de UI
        toggleFilters: () => {
          set((state) => ({ showFilters: !state.showFilters }));
        },

        toggleSuggestions: () => {
          set((state) => ({ showSuggestions: !state.showSuggestions }));
        },

        clearResults: () => {
          set({ results: null });
        },

        clearError: () => {
          set({ error: null });
        },

        clearHistory: () => {
          set({ history: { recent: [], trending: [] } });
        }
    }))),
    {
      name: 'search-store',
      skipHydration: true, // Evita hydration mismatch SSR/CSR
      partialize: (state) => ({
        // Persistir apenas alguns campos
        query: state.query,
        filters: {
          sortBy: state.filters.sortBy,
          sortOrder: state.filters.sortOrder,
          limit: state.filters.limit,
          type: state.filters.type
        },
        showFilters: state.showFilters
      })
    }
  )
);

// Seletores úteis com memoização para evitar re-renders desnecessários
const querySelector = (state: SearchState) => state.query;
const filtersSelector = (state: SearchState) => state.filters;
const resultsSelector = (state: SearchState) => state.results;
const suggestionsSelector = (state: SearchState) => state.suggestions;
const historySelector = (state: SearchState) => state.history;
const loadingSelector = (state: SearchState) => state.isLoading;
const errorSelector = (state: SearchState) => state.error;
const showFiltersSelector = (state: SearchState) => state.showFilters;
const showSuggestionsSelector = (state: SearchState) => state.showSuggestions;

// Seletor cacheado para ações para evitar recriação
const actionsSelector = (state: SearchStore) => ({
  setQuery: state.setQuery,
  setFilters: state.setFilters,
  clearFilters: state.clearFilters,
  search: state.search,
  getSuggestions: state.getSuggestions,
  getHistory: state.getHistory,
  saveSearch: state.saveSearch,
  deleteSearch: state.deleteSearch,
  toggleFilters: state.toggleFilters,
  toggleSuggestions: state.toggleSuggestions,
  clearResults: state.clearResults,
  clearError: state.clearError
});

export const useSearchQuery = () => useSearchStore(querySelector);
export const useSearchFilters = () => useSearchStore(filtersSelector);
export const useSearchResults = () => useSearchStore(resultsSelector);
export const useSearchSuggestions = () => useSearchStore(suggestionsSelector);
export const useSearchHistory = () => useSearchStore(historySelector);
export const useSearchLoading = () => useSearchStore(loadingSelector);
export const useSearchError = () => useSearchStore(errorSelector);
export const useSearchShowFilters = () => useSearchStore(showFiltersSelector);
export const useSearchShowSuggestions = () => useSearchStore(showSuggestionsSelector);

// Hook para ações - usando seletor cacheado para evitar recriação
export const useSearchActions = () => useSearchStore(actionsSelector);

// Hooks movidos para src/hooks/useDebounced.ts para evitar React hooks em stores Zustand