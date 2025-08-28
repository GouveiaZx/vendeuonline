/**
 * Utilitários para tratamento de erros em stores
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export class NetworkError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Trata erros de API de forma consistente
 */
export function handleApiError(error: unknown): ApiError {
  // Erro de rede ou fetch
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Erro de conexão. Verifique sua internet e tente novamente.',
      status: 0,
      code: 'NETWORK_ERROR'
    };
  }

  // Erro customizado NetworkError
  if (error instanceof NetworkError) {
    return {
      message: error.message,
      status: error.status,
      code: error.code
    };
  }

  // Erro padrão
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }

  // Fallback para erros desconhecidos
  return {
    message: 'Ocorreu um erro inesperado. Tente novamente.',
    code: 'UNKNOWN_ERROR'
  };
}

/**
 * Função utilitária para requisições HTTP com tratamento de erro melhorado
 */
export async function apiRequest(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...Object.fromEntries(new Headers(options.headers || {}).entries())
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      let errorMessage = `Erro HTTP ${response.status}`;
      let errorCode = 'HTTP_ERROR';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        errorCode = errorData.code || errorCode;
      } catch {
        // Se não conseguir parsear o JSON, usa a mensagem padrão
      }
      
      throw new NetworkError(errorMessage, response.status, errorCode);
    }
    
    return response.json();
  } catch (error) {
    // Re-throw NetworkError
    if (error instanceof NetworkError) {
      throw error;
    }
    
    // Erro de rede (fetch falhou)
    if (error instanceof TypeError) {
      throw new NetworkError(
        'Erro de conexão. Verifique sua internet e tente novamente.',
        0,
        'NETWORK_ERROR'
      );
    }
    
    // Outros erros
    throw new NetworkError(
      error instanceof Error ? error.message : 'Erro desconhecido',
      0,
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * Função para retry automático em caso de erro de rede
 */
export async function apiRequestWithRetry(
  url: string, 
  options: RequestInit = {}, 
  maxRetries: number = 3,
  retryDelay: number = 1000
) {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiRequest(url, options);
    } catch (error) {
      lastError = error as Error;
      
      // Não fazer retry para erros que não são de rede
      if (error instanceof NetworkError && error.status && error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Se é a última tentativa, throw o erro
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }
  
  throw lastError!;
}

/**
 * Função para verificar se a API está disponível
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    await fetch('/api/status', { method: 'HEAD' });
    return true;
  } catch {
    return false;
  }
}