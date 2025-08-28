/**
 * COMPATIBILIDADE - VALIDAÇÕES
 * 
 * @deprecated Use @/utils/validators directly
 */

import { z } from 'zod';

// Schemas de compatibilidade usando os validators consolidados
import { validators } from '@/utils/validators';

// Re-exportar tudo do sistema consolidado
export { 
  validators,
  fileValidations,
  formValidations,
  documentValidations,
  validateData,
  validateQuery,
  sanitizeHtml,
  isValidEmail,
  isValidPhone,
  isValidCPF,
  isValidCNPJ,
  isValidCEP,
  isValidURL,
  isValidSlug,
  validateFileType,
  validateFileSize,
  validateImageFile
} from '@/utils/validators';

export const emailSchema = z.string().refine(validators.isValidEmail, 'Email inválido');
export const passwordSchema = z.string().min(8, 'Senha deve ter pelo menos 8 caracteres');
export const phoneSchema = z.string().refine(validators.isValidPhone, 'Telefone inválido');
export const cpfSchema = z.string().refine(validators.isValidCPF, 'CPF inválido');
export const cnpjSchema = z.string().refine(validators.isValidCNPJ, 'CNPJ inválido');
export const cepSchema = z.string().refine(validators.isValidCEP, 'CEP inválido');
export const urlSchema = z.string().refine(validators.isValidURL, 'URL inválida');
export const slugSchema = z.string().refine(validators.isValidSlug, 'Slug deve conter apenas letras minúsculas, números e hífens');

// Re-export dos schemas consolidados para compatibilidade
export const commonValidations = validators;

// Validações de paginação
export const paginationSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Validações de filtros
export const filtersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional()
});

// Schema combinado
export const querySchema = paginationSchema.merge(filtersSchema);