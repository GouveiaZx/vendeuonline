import { useRef, useCallback, useEffect } from 'react';
import { useSearchActions } from '@/hooks/useSSRSafeSearch';
import { SearchFilters } from '@/types';

export const useDebouncedSearch = (delay: number = 500) => {
  const { search } = useSearchActions();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback((newQuery?: string, newFilters?: Partial<SearchFilters>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      search(newQuery, newFilters);
    }, delay);
  }, [search, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedSearch;
};

export const useDebouncedSuggestions = (delay: number = 300) => {
  const { getSuggestions } = useSearchActions();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSuggestions = useCallback((query: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      getSuggestions(query);
    }, delay);
  }, [getSuggestions, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedSuggestions;
};