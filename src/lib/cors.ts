// CORS utilities for Next.js API Routes

// Configurações de CORS
const CORS_CONFIG = {
  // Origens permitidas em desenvolvimento
  development: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  
  // Origens permitidas em produção
  production: [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ],
  
  // Métodos HTTP permitidos
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  // Cabeçalhos permitidos
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  
  // Cabeçalhos expostos
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page'
  ],
  
  // Permitir credenciais
  credentials: true,
  
  // Tempo de cache para preflight
  maxAge: 86400 // 24 horas
}

/**
 * Verifica se a origem é permitida
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true // Permitir requisições sem origem (ex: Postman)
  
  const isDevelopment = process.env.NODE_ENV === 'development'
  const allowedOrigins = isDevelopment 
    ? CORS_CONFIG.development 
    : CORS_CONFIG.production
  
  return allowedOrigins.includes(origin)
}

/**
 * Aplica cabeçalhos CORS à resposta
 */
export function applyCorsHeaders(request: Request, response: Response): Response {
  const origin = request.headers.get('origin')
  
  // Verificar se a origem é permitida
  if (isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
  }
  
  // Aplicar outros cabeçalhos CORS
  response.headers.set('Access-Control-Allow-Methods', CORS_CONFIG.allowedMethods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', CORS_CONFIG.allowedHeaders.join(', '))
  response.headers.set('Access-Control-Expose-Headers', CORS_CONFIG.exposedHeaders.join(', '))
  response.headers.set('Access-Control-Allow-Credentials', CORS_CONFIG.credentials.toString())
  response.headers.set('Access-Control-Max-Age', CORS_CONFIG.maxAge.toString())
  
  return response
}

/**
 * Middleware para lidar com requisições OPTIONS (preflight)
 */
export function handlePreflight(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    const response = new Response(null, { status: 200 })
    return applyCorsHeaders(request, response)
  }
  
  return null
}

/**
 * Wrapper para aplicar CORS em handlers de API
 */
export function withCors<T extends any[]>(
  handler: (request: Request, ...args: T) => Promise<Response> | Response
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    // Lidar com preflight
    const preflightResponse = handlePreflight(request)
    if (preflightResponse) {
      return preflightResponse
    }
    
    // Executar handler original
    const response = await handler(request, ...args)
    
    // Aplicar cabeçalhos CORS
    return applyCorsHeaders(request, response)
  }
}

/**
 * Configuração específica para APIs públicas
 */
export const publicApiCors = {
  allowedOrigins: ['*'],
  allowedMethods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: false
}

/**
 * Configuração específica para APIs administrativas
 */
export const adminApiCors = {
  allowedOrigins: process.env.NODE_ENV === 'development' 
    ? CORS_CONFIG.development 
    : CORS_CONFIG.production,
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: CORS_CONFIG.allowedHeaders,
  credentials: true
}

/**
 * Aplica CORS específico para APIs públicas
 */
export function applyPublicCors(request: Request, response: Response): Response {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', publicApiCors.allowedMethods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', publicApiCors.allowedHeaders.join(', '))
  response.headers.set('Access-Control-Allow-Credentials', 'false')
  
  return response
}

/**
 * Aplica CORS específico para APIs administrativas
 */
export function applyAdminCors(request: Request, response: Response): Response {
  const origin = request.headers.get('origin')
  
  if (origin && adminApiCors.allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  response.headers.set('Access-Control-Allow-Methods', adminApiCors.allowedMethods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', adminApiCors.allowedHeaders.join(', '))
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  
  return response
}