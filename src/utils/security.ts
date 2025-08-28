import { NextRequest, NextResponse } from 'next/server';

// Função de log para warnings
const logWarn = (message: string, ...args: any[]) => {
  console.warn(message, ...args);
};

// Rate Limiting
interface RateLimitConfig {
  windowMs: number; // Janela de tempo em ms
  maxRequests: number; // Máximo de requests por janela
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private storage = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Limpar entradas expiradas a cada minuto
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (now > entry.resetTime) {
        this.storage.delete(key);
      }
    }
  }

  private getKey(identifier: string): string {
    return `rate_limit_${identifier}`;
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const key = this.getKey(identifier);
    const now = Date.now();
    const resetTime = now + this.config.windowMs;
    
    let entry = this.storage.get(key);
    
    // Se não existe ou expirou, criar nova entrada
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime
      };
      this.storage.set(key, entry);
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime
      };
    }
    
    // Incrementar contador
    entry.count++;
    
    const allowed = entry.count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    
    return {
      allowed,
      remaining,
      resetTime: entry.resetTime
    };
  }

  reset(identifier: string): void {
    const key = this.getKey(identifier);
    this.storage.delete(key);
  }
}

// Instâncias de rate limiters para diferentes casos
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100, // 100 requests por 15 minutos
  message: 'Muitas requisições. Tente novamente em alguns minutos.'
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5, // 5 tentativas de login por 15 minutos
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
});

export const searchRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 30, // 30 buscas por minuto
  message: 'Muitas buscas. Aguarde um momento.'
});

// Função para obter identificador único do usuário
export const getUserIdentifier = (): string => {
  // Em ambiente servidor, sempre retornar identificador fixo para hidratação
  if (typeof window === 'undefined') {
    return 'server_session_default';
  }
  
  // No cliente, tentar obter do localStorage primeiro
  let sessionId = '';
  try {
    sessionId = localStorage.getItem('user_session_id') || '';
    if (!sessionId) {
      // Gerar novo ID apenas no cliente
      sessionId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('user_session_id', sessionId);
    }
  } catch (error) {
    // Fallback se localStorage não estiver disponível
    sessionId = `temp_${Date.now()}`;
  }
  
  // Em produção, usar IP + User Agent ou ID do usuário autenticado
  const userAgent = navigator.userAgent;
  const timestamp = Math.floor(Date.now() / (1000 * 60 * 60));
  
  return `${sessionId}_${userAgent.slice(0, 50)}_${timestamp}`;
};

// Hook para usar rate limiting
export const useRateLimit = (limiter: RateLimiter) => {
  const checkLimit = (): { allowed: boolean; remaining: number; message?: string } => {
    const identifier = getUserIdentifier();
    const result = limiter.check(identifier);
    
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      message: result.allowed ? undefined : 'Rate limit exceeded'
    };
  };
  
  return { checkLimit };
};

// Validação de entrada (Input Sanitization)
export const sanitizeInput = {
  // Remover scripts maliciosos
  removeScripts: (input: string): string => {
    return input.replace(/<script[^>]*>.*?<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
  },
  
  // Escapar HTML
  escapeHtml: (input: string): string => {
    // Verificar se está no ambiente do navegador
    if (typeof window === 'undefined') {
      // Fallback para ambiente servidor - escape manual básico
      return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }
    
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  },
  
  // Validar email
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },
  
  // Validar telefone brasileiro
  validatePhone: (phone: string): boolean => {
    const phoneRegex = /^\(?\d{2}\)?[\s-]?9?\d{4}[\s-]?\d{4}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  },
  
  // Validar CPF
  validateCPF: (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) {
      return false;
    }
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    
    return remainder === parseInt(cleanCPF.charAt(10));
  },
  
  // Validar CNPJ
  validateCNPJ: (cnpj: string): boolean => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    if (cleanCNPJ.length !== 14 || /^(\d)\1{13}$/.test(cleanCNPJ)) {
      return false;
    }
    
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
    }
    
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;
    
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
    }
    
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    return digit2 === parseInt(cleanCNPJ.charAt(13));
  },
  
  // Limpar string para URL
  slugify: (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .trim()
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-'); // Remove hífens duplicados
  },

  // Sanitizar entrada contra SQL Injection
  sanitizeSQL: (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    
    return input
      // Remover caracteres perigosos
      .replace(/["'\\;]/g, '')
      // Remover comentários SQL
      .replace(/(--|\/\*|\*\/|#)/g, '')
      // Remover múltiplos espaços
      .replace(/\s+/g, ' ')
      // Remover caracteres de controle
      .replace(/[\x00-\x1f\x7f]/g, '')
      // Limitar tamanho
      .substring(0, 1000)
      .trim();
  },

  // Validar entrada segura para queries
  isSecureInput: (input: string, options: { allowSpecialChars?: boolean; maxLength?: number } = {}): boolean => {
    if (!input || typeof input !== 'string') return false;
    
    const { allowSpecialChars = false, maxLength = 1000 } = options;
    
    // Verificar tamanho
    if (input.length > maxLength) return false;
    
    // Verificar SQL Injection
    if (securityMonitor.detectSQLInjection(input)) return false;
    
    // Verificar XSS
    if (securityMonitor.detectXSS(input)) return false;
    
    // Se não permitir caracteres especiais, verificar apenas alfanuméricos
    if (!allowSpecialChars) {
      const alphanumericPattern = /^[a-zA-Z0-9\s\-_@.]+$/;
      return alphanumericPattern.test(input);
    }
    
    return true;
  }
};

// Headers de segurança para requisições
export const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)'
};

// Função para aplicar headers de segurança
export function applySecurityHeaders(response: NextResponse): NextResponse {
  try {
    // Verificar se está no ambiente do navegador
    if (typeof window === 'undefined') {
      logWarn('applySecurityHeaders: Não é possível aplicar headers no ambiente servidor');
      return response;
    }
    
    // Em um ambiente real, isso seria feito no servidor
    // Aqui é apenas para demonstração
    Object.entries(securityHeaders).forEach(([key, value]) => {
      const meta = document.createElement('meta');
      meta.httpEquiv = key;
      meta.content = value;
      document.head.appendChild(meta);
    });
    
    return response;
  } catch (error) {
    logWarn('applySecurityHeaders: Não é possível aplicar headers no ambiente servidor');
    return response;
  }
}

// Detecção de ataques comuns
export const securityMonitor = {
  // Detectar tentativas de XSS
  detectXSS: (input: string): boolean => {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  },
  
  // Detectar tentativas de SQL Injection
  detectSQLInjection: (input: string): boolean => {
    if (!input || typeof input !== 'string') return false;
    
    // Normalizar input para detecção mais eficaz
    const normalizedInput = input.toLowerCase().replace(/\s+/g, ' ').trim();
    
    const sqlPatterns = [
      // Caracteres perigosos básicos
      /('|(\-\-)|(;)|(\||\|)|(\*|\*))/gi,
      
      // Comandos SQL perigosos
      /\b(union|select|insert|delete|update|drop|create|alter|exec|execute|truncate|replace)\b/gi,
      
      // Funções SQL perigosas
      /\b(concat|char|ascii|substring|mid|length|count|sum|avg|min|max)\s*\(/gi,
      
      // Comentários SQL
      /((\/\*)|(\/\*.*\*\/)|(\-\-)|#)/gi,
      
      // Tentativas de bypass
      /\b(or|and)\s+(1=1|true|false|\d+\s*=\s*\d+)/gi,
      
      // Hexadecimal e encoding
      /(0x[0-9a-f]+|\\x[0-9a-f]+)/gi,
      
      // Tentativas de injeção em strings
      /('\s*(or|and|union)\s*')|('\s*;)|('\s*\-\-)/gi,
      
      // Funções de sistema
      /\b(load_file|into\s+outfile|into\s+dumpfile|benchmark|sleep|waitfor|delay)/gi,
      
      // Tentativas de informação do schema
      /\b(information_schema|sys\.|mysql\.|pg_|sqlite_master)/gi,
      
      // Scripts maliciosos (XSS relacionado)
      /(script|javascript|vbscript|onload|onerror|onclick|onmouseover|onfocus|onblur)/gi
    ];
    
    // Verificar padrões suspeitos
    const hasSuspiciousPattern = sqlPatterns.some(pattern => pattern.test(normalizedInput));
    
    // Verificar múltiplas aspas consecutivas
    const hasMultipleQuotes = /''{2,}|""{2,}/.test(input);
    
    // Verificar tentativas de escape
    const hasEscapeAttempts = /\\['"\\]/.test(input);
    
    // Verificar padrões de encoding suspeitos
    const hasEncodingAttempts = /%[0-9a-f]{2}/gi.test(input) && 
      /%27|%22|%3b|%2d%2d|%2f%2a|%2a%2f/gi.test(input);
    
    return hasSuspiciousPattern || hasMultipleQuotes || hasEscapeAttempts || hasEncodingAttempts;
  },
  
  // Log de tentativas suspeitas
  logSuspiciousActivity: (type: string, details: any) => {
    // Verificar se está no ambiente do navegador
    if (typeof window === 'undefined') {
      // Em ambiente servidor, apenas log no console
      console.warn('Atividade suspeita detectada (servidor):', {
        timestamp: new Date().toISOString(),
        type,
        details
      });
      return;
    }
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: getUserIdentifier()
    };
    
    // Log apenas em desenvolvimento para debug de segurança
    if (process.env.NODE_ENV === 'development') {
      console.warn('Atividade suspeita detectada:', logEntry);
    }
    // Em produção, enviar para serviço de monitoramento
    
    // Armazenar localmente para análise
    const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
    logs.push(logEntry);
    
    // Limitar quantidade de logs armazenados
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    localStorage.setItem('security_logs', JSON.stringify(logs));
  }
};

// Hook para monitoramento de segurança
export const useSecurityMonitor = () => {
  const validateInput = (input: string, type: 'text' | 'email' | 'phone' | 'cpf' | 'cnpj' = 'text') => {
    // Verificar ataques
    if (securityMonitor.detectXSS(input)) {
      securityMonitor.logSuspiciousActivity('XSS_ATTEMPT', { input, type });
      return { valid: false, error: 'Entrada inválida detectada' };
    }
    
    if (securityMonitor.detectSQLInjection(input)) {
      securityMonitor.logSuspiciousActivity('SQL_INJECTION_ATTEMPT', { input, type });
      return { valid: false, error: 'Entrada inválida detectada' };
    }
    
    // Validações específicas
    switch (type) {
      case 'email':
        if (!sanitizeInput.validateEmail(input)) {
          return { valid: false, error: 'Email inválido' };
        }
        break;
      case 'phone':
        if (!sanitizeInput.validatePhone(input)) {
          return { valid: false, error: 'Telefone inválido' };
        }
        break;
      case 'cpf':
        if (!sanitizeInput.validateCPF(input)) {
          return { valid: false, error: 'CPF inválido' };
        }
        break;
      case 'cnpj':
        if (!sanitizeInput.validateCNPJ(input)) {
          return { valid: false, error: 'CNPJ inválido' };
        }
        break;
    }
    
    return { valid: true, sanitized: sanitizeInput.escapeHtml(input) };
  };
  
  return { validateInput };
};

export async function logSuspiciousActivity(
  request: NextRequest,
  activity: string,
  details?: any
) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      url: request.url,
      activity,
      details: details || null,
    };

    if (typeof window === 'undefined') {
      logWarn('Atividade suspeita detectada (servidor):', logEntry);
    } else {
      logWarn('Atividade suspeita detectada:', logEntry);
    }
  } catch (error) {
    logWarn('Erro ao registrar atividade suspeita:', error);
  }
}