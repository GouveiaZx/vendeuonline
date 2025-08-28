import * as Sentry from '@sentry/nextjs';

// Tipos para métricas customizadas
interface PerformanceMetrics {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
}

interface ErrorContext {
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
  extra?: Record<string, any>;
  tags?: Record<string, string>;
}

export class MonitoringService {
  // Performance monitoring (static methods)
  static startTransaction(name: string, operation: string) {
    return Sentry.startSpan({ name, op: operation }, () => {});
  }

  static finishTransaction(transaction: any) {
    if (transaction) {
      transaction.finish();
    }
  }

  // Custom metrics (static methods)
  static setMetric({ name, value, unit = 'none', tags = {} }: PerformanceMetrics) {
    Sentry.metrics.increment(name, value, { unit, ...tags });
  }

  static setTiming(name: string, duration: number, tags?: Record<string, string>) {
    Sentry.metrics.distribution(name, duration, { unit: 'millisecond', ...tags });
  }

  static trackEvent(event: string, data?: Record<string, any>) {
    Sentry.addBreadcrumb({
      category: 'analytics',
      message: event,
      data,
      level: 'info',
    });
  }

  // Error tracking (static methods)
  static captureException(error: Error, context: ErrorContext = {}) {
    Sentry.withScope(scope => {
      if (context.user) {
        scope.setUser(context.user);
      }
      if (context.extra) {
        scope.setExtras(context.extra);
      }
      if (context.tags) {
        scope.setTags(context.tags);
      }
      Sentry.captureException(error);
    });
  }

  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context: ErrorContext = {}) {
    Sentry.withScope(scope => {
      if (context.user) {
        scope.setUser(context.user);
      }
      if (context.extra) {
        scope.setExtras(context.extra);
      }
      if (context.tags) {
        scope.setTags(context.tags);
      }
      Sentry.captureMessage(message, level);
    });
  }

  // User tracking (static methods)
  static setUser(user: { id: string; email?: string; username?: string }) {
    Sentry.setUser(user);
  }

  static clearUser() {
    Sentry.withScope((scope: any) => scope.setUser(null));
  }

  // Breadcrumbs (static methods)
  static addBreadcrumb(category: string, message: string, data?: any) {
    Sentry.addBreadcrumb({
      category,
      message,
      data,
      level: 'info',
    });
  }

  // Instance methods (delegate to static methods)
  startTransaction(name: string, operation: string) {
    return MonitoringService.startTransaction(name, operation);
  }

  finishTransaction(transaction: any) {
    return MonitoringService.finishTransaction(transaction);
  }

  setMetric(name: string, value: number, unit?: string, tags?: Record<string, string>) {
    return MonitoringService.setMetric({ name, value, unit, tags });
  }

  setTiming(name: string, duration: number, tags?: Record<string, string>) {
    return MonitoringService.setTiming(name, duration, tags);
  }

  trackEvent(event: string, data?: Record<string, any>) {
    return MonitoringService.trackEvent(event, data);
  }

  captureException(error: Error, context: ErrorContext = {}) {
    return MonitoringService.captureException(error, context);
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context: ErrorContext = {}) {
    return MonitoringService.captureMessage(message, level, context);
  }

  setUser(user: { id: string; email?: string; username?: string }) {
    return MonitoringService.setUser(user);
  }

  clearUser() {
    return MonitoringService.clearUser();
  }

  addBreadcrumb(category: string, message: string, data?: any) {
    return MonitoringService.addBreadcrumb(category, message, data);
  }

  // Performance tracking for API calls
  static async trackApiCall<T>(
    endpoint: string,
    method: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const transaction = this.startTransaction(`${method} ${endpoint}`, 'http');

    try {
      const start = performance.now();
      const result = await fn();
      const duration = performance.now() - start;

      this.setTiming(`api.${endpoint}`, duration, { method });
      
      return result;
    } catch (error) {
      this.captureException(error as Error, {
        tags: { endpoint, method },
        extra: { endpoint, method },
      });
      
      throw error;
    } finally {
      this.finishTransaction(transaction);
    }
  }

  // Performance tracking for database operations
  static async trackDatabaseOperation<T>(
    operation: string,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const transaction = this.startTransaction(`db.${operation}`, 'db');

    try {
      const start = performance.now();
      const result = await fn();
      const duration = performance.now() - start;

      this.setTiming(`db.${operation}`, duration, { table });
      
      return result;
    } catch (error) {
      this.captureException(error as Error, {
        tags: { operation, table },
        extra: { operation, table },
      });
      
      throw error;
    } finally {
      this.finishTransaction(transaction);
    }
  }
}

// Hook para uso em componentes React
export function useMonitoring() {
  return {
    trackEvent: MonitoringService.trackEvent,
    trackError: MonitoringService.captureException,
    addBreadcrumb: MonitoringService.addBreadcrumb,
  };
}

// Middleware para monitoramento de API routes
export function withMonitoring(handler: any) {
  return async (req: any, res: any) => {
    const start = Date.now();
    
    try {
      const result = await handler(req, res);
      
      const duration = Date.now() - start;
      MonitoringService.setTiming(
        `api.${req.method}.${req.url}`,
        duration,
        { status: res.statusCode }
      );
      
      return result;
    } catch (error) {
      MonitoringService.captureException(error as Error, {
        tags: { method: req.method, url: req.url },
        extra: { method: req.method, url: req.url, statusCode: res?.statusCode },
      });
      throw error;
    }
  };
}

// Sistema de Health Check
export class HealthMonitor {
  private static instance: HealthMonitor;
  private healthStatus: any = {};

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  async checkDatabaseHealth(): Promise<{ status: string; responseTime: number }> {
    const start = Date.now();
    try {
      // Database health check with Supabase
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data, error } = await supabase.from('users').select('id').limit(1);
      if (error) throw error;
      
      return {
        status: 'healthy',
        responseTime: Date.now() - start
      };
    } catch (error) {
      MonitoringService.captureException(error as Error, {
        tags: { service: 'database' }
      });
      
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start
      };
    }
  }

  async checkExternalServices(): Promise<Record<string, any>> {
    const services = {
      supabase: process.env.NEXT_PUBLIC_SUPABASE_URL,
      asaas: process.env.ASAAS_BASE_URL
    };

    const results: Record<string, any> = {};

    for (const [name, url] of Object.entries(services)) {
      if (!url) continue;

      const start = Date.now();
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        
        results[name] = {
          status: response.ok ? 'healthy' : 'degraded',
          responseTime: Date.now() - start,
          statusCode: response.status
        };
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          responseTime: Date.now() - start,
          error: (error as Error).message
        };
      }
    }

    return results;
  }

  async getSystemMetrics(): Promise<any> {
    const memUsage = process.memoryUsage();
    
    return {
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  async performFullHealthCheck(): Promise<any> {
    const [database, externalServices, systemMetrics] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkExternalServices(),
      this.getSystemMetrics()
    ]);

    const healthReport = {
      overall: 'healthy',
      database,
      externalServices,
      system: systemMetrics,
      timestamp: new Date().toISOString()
    };

    // Determinar status geral
    if (database.status === 'unhealthy') {
      healthReport.overall = 'unhealthy';
    } else if (Object.values(externalServices).some((service: any) => service.status === 'unhealthy')) {
      healthReport.overall = 'degraded';
    }

    this.healthStatus = healthReport;
    
    // Log métricas no Sentry
    MonitoringService.setMetric({ 
      name: 'health_check', 
      value: healthReport.overall === 'healthy' ? 1 : 0 
    });

    return healthReport;
  }

  getLastHealthStatus(): any {
    return this.healthStatus;
  }
}

// Sistema de Rate Limiting Monitor
export class RateLimitMonitor {
  private static requests: Map<string, number[]> = new Map();

  static trackRequest(identifier: string): void {
    const now = Date.now();
    const windowStart = now - 60000; // Janela de 1 minuto

    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }

    const requests = this.requests.get(identifier)!;
    
    // Remover requests antigas
    while (requests.length > 0 && requests[0] < windowStart) {
      requests.shift();
    }
    
    // Adicionar request atual
    requests.push(now);

    // Alerta se muitas requests
    if (requests.length > 100) { // 100 requests por minuto
      MonitoringService.captureMessage(
        `Rate limit approaching for ${identifier}`,
        'warning',
        { extra: { requestCount: requests.length, identifier } }
      );
    }
  }

  static getRequestCount(identifier: string): number {
    const requests = this.requests.get(identifier);
    if (!requests) return 0;

    const now = Date.now();
    const windowStart = now - 60000;
    
    return requests.filter(timestamp => timestamp >= windowStart).length;
  }
}

// API Route para Health Check
export async function healthCheckHandler(): Promise<Response> {
  try {
    const healthMonitor = HealthMonitor.getInstance();
    const healthReport = await healthMonitor.performFullHealthCheck();
    
    const status = healthReport.overall === 'healthy' ? 200 : 
                   healthReport.overall === 'degraded' ? 207 : 503;
    
    return new Response(JSON.stringify(healthReport), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    MonitoringService.captureException(error as Error);
    
    return new Response(JSON.stringify({
      overall: 'unhealthy',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export default MonitoringService;