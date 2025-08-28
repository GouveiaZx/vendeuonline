/**
 * Utilitários de sanitização para prevenir SQL Injection e XSS
 */

/**
 * Sanitiza input para queries SQL ILIKE, escapando caracteres especiais
 */
export function sanitizeForSearch(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove ou escapa caracteres perigosos para SQL
  return input
    .replace(/[%_\\]/g, '\\$&') // Escapa wildcards SQL
    .replace(/[<>"']/g, '') // Remove caracteres perigosos para XSS
    .replace(/[;\-\-]/g, '') // Remove comentários SQL
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim()
    .substring(0, 100); // Limita tamanho
}

/**
 * Sanitiza texto para prevenir XSS
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[<>"'&]/g, (match) => {
      switch (match) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        case '&': return '&amp;';
        default: return match;
      }
    })
    .trim()
    .substring(0, 1000);
}

/**
 * Valida e sanitiza parâmetros numéricos
 */
export function sanitizeNumber(input: any, defaultValue: number = 0): number {
  if (typeof input === 'number' && !isNaN(input)) {
    return Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, input));
  }
  
  if (typeof input === 'string') {
    const parsed = parseFloat(input);
    if (!isNaN(parsed)) {
      return Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, parsed));
    }
  }
  
  return defaultValue;
}

/**
 * Valida UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitiza parâmetros de ordenação
 */
export function sanitizeSortBy(sortBy: string, allowedFields: string[]): string {
  if (!sortBy || typeof sortBy !== 'string') {
    return allowedFields[0] || 'created_at';
  }
  
  const clean = sortBy.toLowerCase().trim();
  return allowedFields.includes(clean) ? clean : allowedFields[0] || 'created_at';
}

/**
 * Sanitiza ordem de classificação
 */
export function sanitizeSortOrder(order: string): 'asc' | 'desc' {
  if (typeof order === 'string') {
    const clean = order.toLowerCase().trim();
    return clean === 'asc' ? 'asc' : 'desc';
  }
  return 'desc';
}