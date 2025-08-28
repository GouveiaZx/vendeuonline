/**
 * SSR-Safe Search Hooks
 * Wrappers seguros para usar o searchStore durante SSR
 */

import { useSyncExternalStore } from 'react'
import { useSearchStore } from '@/store/searchStore'
import { SearchActions, SearchState, SearchSuggestions, SearchApiResponse, SearchResult, SearchFilters } from '@/types'

// Fallbacks padrão para SSR
const defaultSearchState: Partial<SearchState> = {
  query: '',
  results: null,
  suggestions: null,
  history: { recent: [], trending: [] },
  isLoading: false,
  error: null,
  showFilters: false,
  showSuggestions: false,
  filters: {
    sortBy: 'relevance',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
    type: 'all',
    includeSuggestions: false,
    includeFilters: true
  }
}

const defaultActions: SearchActions = {
  setQuery: () => {},
  setFilters: () => {},
  clearFilters: () => {},
  search: async () => {},
  getSuggestions: async () => {},
  getHistory: () => [],
  clearHistory: async () => {},
  loadHistory: async () => {},
  saveSearch: async () => {},
  deleteSearch: async () => {},
  toggleFilters: () => {},
  toggleSuggestions: () => {},
  clearResults: () => {},
  clearError: () => {}
}

// Hooks SSR-safe para o searchStore usando useSyncExternalStore
export const useSearchQuery = () => {
  return useSyncExternalStore(
    useSearchStore.subscribe,
    () => useSearchStore.getState().query,
    () => defaultSearchState.query!
  )
}

export const useSearchActions = (): SearchActions => {
  return useSyncExternalStore(
    useSearchStore.subscribe,
    () => {
      const state = useSearchStore.getState()
      return {
        setQuery: state.setQuery,
        setFilters: state.setFilters,
        clearFilters: state.clearFilters,
        search: state.search,
        getSuggestions: state.getSuggestions,
        getHistory: state.getHistory,
        clearHistory: state.clearHistory,
        loadHistory: state.loadHistory,
        saveSearch: state.saveSearch,
        deleteSearch: state.deleteSearch,
        toggleFilters: state.toggleFilters,
        toggleSuggestions: state.toggleSuggestions,
        clearResults: state.clearResults,
        clearError: state.clearError
      }
    },
    () => defaultActions
  )
}

export const useSearchSuggestions = () => {
  return useSyncExternalStore(
    useSearchStore.subscribe,
    () => useSearchStore.getState().suggestions,
    () => null
  )
}

export const useSearchHistory = () => {
  return useSyncExternalStore(
    useSearchStore.subscribe,
    () => useSearchStore.getState().history,
    () => null
  )
}

export const useSearchLoading = () => {
  return useSyncExternalStore(
    useSearchStore.subscribe,
    () => useSearchStore.getState().isLoading,
    () => defaultSearchState.isLoading!
  )
}

export const useSearchError = () => {
  return useSyncExternalStore(
    useSearchStore.subscribe,
    () => useSearchStore.getState().error,
    () => defaultSearchState.error!
  )
}

export const useSearchShowFilters = () => {
  return useSyncExternalStore(
    useSearchStore.subscribe,
    () => useSearchStore.getState().showFilters,
    () => defaultSearchState.showFilters!
  )
}

export const useSearchResults = () => {
  return useSyncExternalStore(
    useSearchStore.subscribe,
    () => useSearchStore.getState().results,
    () => null
  )
}

export const useSearchFilters = () => {
  return useSyncExternalStore(
    useSearchStore.subscribe,
    () => useSearchStore.getState().filters,
    () => ({
      sortBy: 'relevance' as const,
      sortOrder: 'desc' as const,
      page: 1,
      limit: 20,
      type: 'all' as const,
      includeSuggestions: false,
      includeFilters: true
    })
  )
}