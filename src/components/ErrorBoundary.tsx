'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary capturou um erro:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Em produção, enviar erro para serviço de monitoramento
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrar com Sentry ou similar
      // logErrorToService(error, errorInfo);
    }
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined
    });
  };

  public render() {
    if (this.state.hasError) {
      // Renderizar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-6">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Algo deu errado
              </h1>
              <p className="text-gray-600">
                Ocorreu um erro inesperado. Nossa equipe foi notificada.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <Button onClick={this.handleRetry} className="w-full" variant="default">
                <RotateCcw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
              
              <Button onClick={this.handleGoHome} className="w-full" variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Ir para Home
              </Button>
              
              <Button onClick={this.handleReload} className="w-full" variant="ghost">
                Recarregar Página
              </Button>
            </div>

            {isDevelopment && this.props.showDetails && this.state.error && (
              <details className="text-left bg-gray-100 rounded p-4 text-sm">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  Detalhes do Erro (Desenvolvimento)
                </summary>
                <div className="space-y-2">
                  <div>
                    <strong>Erro:</strong>
                    <pre className="text-red-600 whitespace-pre-wrap bg-red-50 p-2 rounded mt-1">
                      {this.state.error.message}
                    </pre>
                  </div>
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded mt-1 text-xs">
                      {this.state.error.stack}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded mt-1 text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Componente Error Boundary funcional para casos específicos
export function SimpleErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: ReactNode; 
  fallback?: ReactNode 
}) {
  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}

// Hook para capturar erros em componentes funcionais
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Erro capturado pelo hook:', error);
    
    // Em produção, enviar para serviço de monitoramento
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error, errorInfo);
    }
  };
}

// Utilitário para wrap de funções async com error handling
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler?: (error: Error) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Erro na função:', err);
      
      if (errorHandler) {
        errorHandler(err);
      } else if (process.env.NODE_ENV === 'production') {
        // Enviar para serviço de monitoramento
        // logErrorToService(err);
      }
      
      throw err;
    }
  }) as T;
}

export default ErrorBoundary;