import { useState, useCallback, useRef } from 'react';
import { ApiResponse, get, post, put, del, patch } from '@/lib/api';

export interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export interface UseApiState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface UseApiActions<T = any> {
  execute: (url: string, options?: any) => Promise<ApiResponse<T>>;
  reset: () => void;
  setData: (data: T | null) => void;
}

export interface UseApiReturn<T = any> extends UseApiState<T>, UseApiActions<T> {}

// Hook genérico para requisições API
export function useApi<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (url: string, requestOptions?: any): Promise<ApiResponse<T>> => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Criar novo AbortController
    abortControllerRef.current = new AbortController();
    
    setState(prev => ({ ...prev, loading: true, error: null, success: false }));

    try {
      let response: ApiResponse<T>;

      const apiOptions = {
        ...requestOptions,
        signal: abortControllerRef.current.signal,
      };

      switch (method) {
        case 'GET':
          response = await get<T>(url);
          break;
        case 'POST':
          response = await post<T>(url, requestOptions);
          break;
        case 'PUT':
          response = await put<T>(url, requestOptions);
          break;
        case 'DELETE':
          response = await del<T>(url);
          break;
        case 'PATCH':
          response = await patch<T>(url, requestOptions);
          break;
        default:
          throw new Error(`Método HTTP não suportado: ${method}`);
      }

      if (response.success) {
        setState(prev => ({
          ...prev,
          data: response.data || null,
          loading: false,
          success: true,
        }));

        if (options.onSuccess) {
          options.onSuccess(response.data);
        }
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error || 'Erro desconhecido',
          success: false,
        }));

        if (options.onError) {
          options.onError(response.error || 'Erro desconhecido');
        }
      }

      return response;
    } catch (error) {
      // Ignorar erros de abort
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Requisição cancelada' };
      }

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        success: false,
      }));

      if (options.onError) {
        options.onError(errorMessage);
      }

      return { success: false, error: errorMessage };
    }
  }, [method, options]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
  };
}

// Hooks específicos para cada método HTTP
export const useGet = <T = any>(options?: UseApiOptions) => useApi<T>('GET', options);
export const usePost = <T = any>(options?: UseApiOptions) => useApi<T>('POST', options);
export const usePut = <T = any>(options?: UseApiOptions) => useApi<T>('PUT', options);
export const useDelete = <T = any>(options?: UseApiOptions) => useApi<T>('DELETE', options);
export const usePatch = <T = any>(options?: UseApiOptions) => useApi<T>('PATCH', options);

// Hook para múltiplas requisições
export function useApiMultiple() {
  const [requests, setRequests] = useState<Map<string, UseApiState>>(new Map());

  const execute = useCallback(async <T = any>(
    key: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    options?: any
  ): Promise<ApiResponse<T>> => {
    setRequests(prev => new Map(prev).set(key, {
      data: null,
      loading: true,
      error: null,
      success: false,
    }));

    try {
      let response: ApiResponse<T>;

      switch (method) {
        case 'GET':
          response = await get<T>(url);
          break;
        case 'POST':
          response = await post<T>(url, options);
          break;
        case 'PUT':
          response = await put<T>(url, options);
          break;
        case 'DELETE':
          response = await del<T>(url);
          break;
        case 'PATCH':
          response = await patch<T>(url, options);
          break;
        default:
          throw new Error(`Método HTTP não suportado: ${method}`);
      }

      setRequests(prev => new Map(prev).set(key, {
        data: response.data || null,
        loading: false,
        error: response.success ? null : (response.error || 'Erro desconhecido'),
        success: response.success,
      }));

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setRequests(prev => new Map(prev).set(key, {
        data: null,
        loading: false,
        error: errorMessage,
        success: false,
      }));

      return { success: false, error: errorMessage };
    }
  }, []);

  const getRequest = useCallback((key: string): UseApiState => {
    return requests.get(key) || {
      data: null,
      loading: false,
      error: null,
      success: false,
    };
  }, [requests]);

  const reset = useCallback((key?: string) => {
    if (key) {
      setRequests(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
    } else {
      setRequests(new Map());
    }
  }, []);

  return {
    execute,
    getRequest,
    reset,
    requests: Object.fromEntries(requests),
  };
}

// Hook para cache simples de dados
export function useApiCache<T = any>() {
  const [cache, setCache] = useState<Map<string, { data: T; timestamp: number }>>(new Map());

  const get = useCallback((key: string, maxAge: number = 5 * 60 * 1000): T | null => {
    const cached = cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > maxAge) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      return null;
    }

    return cached.data;
  }, [cache]);

  const set = useCallback((key: string, data: T) => {
    setCache(prev => new Map(prev).set(key, {
      data,
      timestamp: Date.now(),
    }));
  }, []);

  const clear = useCallback((key?: string) => {
    if (key) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
    } else {
      setCache(new Map());
    }
  }, []);

  return { get, set, clear };
}