import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from './monitoring';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    timestamp: string;
    requestId: string;
    duration: number;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    pagination: PaginationMeta;
  } & ApiResponse['meta'];
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const createApiResponse = <T>(
  data: T,
  startTime: number,
  requestId: string
): ApiResponse<T> => ({
  success: true,
  data,
  meta: {
    timestamp: new Date().toISOString(),
    requestId,
    duration: Date.now() - startTime,
  },
});

export const createErrorResponse = (
  error: string,
  statusCode: number,
  startTime: number,
  requestId: string,
  details?: any
): ApiResponse => ({
  success: false,
  error,
  ...(details && { details }),
  meta: {
    timestamp: new Date().toISOString(),
    requestId,
    duration: Date.now() - startTime,
  },
});

export const createPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

export const handleApiError = (
  error: any,
  startTime: number,
  requestId: string
): NextResponse => {
  const duration = Date.now() - startTime;

  MonitoringService.captureException(error, {
    tags: { type: 'api_error' },
    extra: { requestId, duration },
  });

  if (error instanceof ApiError) {
    return NextResponse.json(
      createErrorResponse(error.message, error.statusCode, startTime, requestId, error.details),
      { status: error.statusCode }
    );
  }

  // Erros inesperados
  return NextResponse.json(
    createErrorResponse('Internal server error', 500, startTime, requestId),
    { status: 500 }
  );
};

export const validatePagination = (page?: string, limit?: string) => {
  const validatedPage = Math.max(1, parseInt(page || '1', 10));
  const validatedLimit = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
  
  return { page: validatedPage, limit: validatedLimit };
};

export const generateRequestId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};