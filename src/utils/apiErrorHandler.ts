import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Tipos de erro personalizados
export class APIError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Não autorizado') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Acesso negado') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Recurso não encontrado') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT_ERROR', details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Muitas requisições') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

// Interface para logs estruturados
interface ErrorLogData {
  error: Error;
  request?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    userId?: string;
  };
  context?: Record<string, any>;
  timestamp: string;
}

// Função para log estruturado de erros
export function logError(data: ErrorLogData) {
  const logEntry = {
    level: 'error',
    message: data.error.message,
    error: {
      name: data.error.name,
      message: data.error.message,
      stack: data.error.stack,
      ...(data.error instanceof APIError && {
        statusCode: data.error.statusCode,
        code: data.error.code,
        details: data.error.details
      })
    },
    request: data.request,
    context: data.context,
    timestamp: data.timestamp
  };

  // Em desenvolvimento, log detalhado no console
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', logEntry);
  } else {
    // Em produção, seria enviado para serviço de monitoramento
    console.error(JSON.stringify(logEntry));
    // TODO: Integrar com Sentry, LogRocket, etc.
  }
}

// Função principal para tratamento de erros
export function handleAPIError(
  error: unknown,
  request?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    userId?: string;
  },
  context?: Record<string, any>
): NextResponse {
  const timestamp = new Date().toISOString();
  
  // Tratar erro Zod (validação)
  if (error instanceof ZodError) {
    const validationError = new ValidationError(
      'Dados inválidos',
      { issues: error.issues }
    );
    
    logError({
      error: validationError,
      request,
      context: { ...context, zodIssues: error.issues },
      timestamp
    });

    return NextResponse.json(
      {
        error: 'Dados inválidos',
        code: 'VALIDATION_ERROR',
        details: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        })),
        timestamp
      },
      { status: 400 }
    );
  }

  // Tratar erros personalizados da API
  if (error instanceof APIError) {
    logError({
      error,
      request,
      context,
      timestamp
    });

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
        timestamp
      },
      { status: error.statusCode }
    );
  }

  // Tratar erros do Supabase
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const supabaseError = error as { code: string; message: string; details?: string; hint?: string };
    
    let apiError: APIError;
    
    switch (supabaseError.code) {
      case 'PGRST116': // Row not found
        apiError = new NotFoundError(supabaseError.message);
        break;
      case '23505': // Unique violation
        apiError = new ConflictError('Recurso já existe', { 
          code: supabaseError.code,
          details: supabaseError.details 
        });
        break;
      case '23503': // Foreign key violation
        apiError = new ValidationError('Referência inválida', { 
          code: supabaseError.code,
          details: supabaseError.details 
        });
        break;
      case 'PGRST301': // Singular response expected
        apiError = new ConflictError('Múltiplos registros encontrados');
        break;
      default:
        apiError = new APIError(
          `Erro no banco de dados: ${supabaseError.message}`,
          500,
          'DATABASE_ERROR',
          { 
            code: supabaseError.code,
            details: supabaseError.details,
            hint: supabaseError.hint
          }
        );
    }

    logError({
      error: apiError,
      request,
      context: { ...context, supabaseError },
      timestamp
    });

    return NextResponse.json(
      {
        error: apiError.message,
        code: apiError.code,
        ...(apiError.details && { details: apiError.details }),
        timestamp
      },
      { status: apiError.statusCode }
    );
  }

  // Tratar erro genérico
  const genericError = error instanceof Error ? error : new Error(String(error));
  const internalError = new APIError(
    process.env.NODE_ENV === 'development' 
      ? genericError.message 
      : 'Erro interno do servidor',
    500,
    'INTERNAL_ERROR'
  );

  logError({
    error: internalError,
    request,
    context: { ...context, originalError: genericError.message },
    timestamp
  });

  return NextResponse.json(
    {
      error: internalError.message,
      code: internalError.code,
      ...(process.env.NODE_ENV === 'development' && {
        details: {
          stack: genericError.stack,
          originalMessage: genericError.message
        }
      }),
      timestamp
    },
    { status: 500 }
  );
}

// Wrapper para handlers de API com tratamento de erro automático
export function withErrorHandler(
  handler: (request: Request, context?: any) => Promise<NextResponse>
) {
  return async (request: Request, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleAPIError(
        error,
        {
          method: request.method,
          url: request.url,
          headers: Object.fromEntries(request.headers.entries())
        }
      );
    }
  };
}

// Utilitário para rollback de transações
export interface TransactionStep {
  name: string;
  rollback: () => Promise<void>;
}

export class TransactionManager {
  private steps: TransactionStep[] = [];
  private isRollingBack = false;

  async execute<T>(
    stepName: string,
    operation: () => Promise<T>,
    rollback: () => Promise<void>
  ): Promise<T> {
    if (this.isRollingBack) {
      throw new APIError('Transação em processo de rollback');
    }

    try {
      const result = await operation();
      this.steps.push({ name: stepName, rollback });
      return result;
    } catch (error) {
      // Automaticamente fazer rollback se alguma operação falhar
      await this.rollback();
      throw error;
    }
  }

  async rollback(): Promise<void> {
    if (this.isRollingBack) return;

    this.isRollingBack = true;
    const rollbackErrors: Error[] = [];

    // Fazer rollback em ordem reversa
    for (let i = this.steps.length - 1; i >= 0; i--) {
      const step = this.steps[i];
      try {
        await step.rollback();
      } catch (error) {
        const rollbackError = error instanceof Error ? error : new Error(String(error));
        rollbackErrors.push(rollbackError);
        console.error(`Erro no rollback do step "${step.name}":`, rollbackError);
      }
    }

    this.steps = [];
    this.isRollingBack = false;

    if (rollbackErrors.length > 0) {
      throw new APIError(
        `Falhas no rollback: ${rollbackErrors.map(e => e.message).join('; ')}`,
        500,
        'ROLLBACK_ERROR',
        { rollbackErrors: rollbackErrors.map(e => e.message) }
      );
    }
  }

  getStepsCount(): number {
    return this.steps.length;
  }

  clear(): void {
    this.steps = [];
    this.isRollingBack = false;
  }
}

// Validações comuns
export const validateRequired = (value: any, fieldName: string) => {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} é obrigatório`);
  }
};

export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Email inválido');
  }
};

export const validateUUID = (id: string, fieldName: string = 'ID') => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new ValidationError(`${fieldName} deve ser um UUID válido`);
  }
};