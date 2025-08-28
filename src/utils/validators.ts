import { z } from 'zod';

// Validações comuns consolidadas
export const commonValidations = {
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  phone: z.string().regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, 'Telefone inválido'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido'),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  url: z.string().url('URL inválida'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido')
};

// Validações de arquivo consolidadas
export const fileValidations = {
  validateImageFile: (file: File): { valid: boolean; error?: string } => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Arquivo muito grande. Tamanho máximo: 5MB.'
      };
    }

    return { valid: true };
  },

  validateFileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  },

  validateFileSize: (file: File, maxSizeInMB: number): boolean => {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }
};

// Validações de formulário consolidadas
export const formValidations = {
  validateProductForm: (formData: {
    name: string;
    description: string;
    price: number;
    category: string;
    brand: string;
    stock: number;
    images: any[];
  }): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome do produto é obrigatório';
    }

    if (!formData.description.trim()) {
      errors.description = 'Descrição é obrigatória';
    }

    if (formData.price <= 0) {
      errors.price = 'Preço deve ser maior que zero';
    }

    if (!formData.category) {
      errors.category = 'Categoria é obrigatória';
    }

    if (!formData.brand.trim()) {
      errors.brand = 'Marca é obrigatória';
    }

    if (formData.stock < 0) {
      errors.stock = 'Estoque não pode ser negativo';
    }

    if (formData.images.length === 0) {
      errors.images = 'Pelo menos uma imagem é obrigatória';
    }

    return errors;
  },

  validateBannerForm: (formData: {
    title: string;
    description: string;
    imageUrl: string;
    targetUrl: string;
    startDate: string;
    endDate: string;
  }): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Título é obrigatório';
    }

    if (!formData.description.trim()) {
      errors.description = 'Descrição é obrigatória';
    }

    if (!formData.imageUrl.trim()) {
      errors.imageUrl = 'Imagem é obrigatória';
    }

    if (!formData.targetUrl.trim()) {
      errors.targetUrl = 'URL de destino é obrigatória';
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      errors.endDate = 'Data de fim deve ser posterior à data de início';
    }

    return errors;
  }
};

// Validações específicas de documentos brasileiros
export const documentValidations = {
  validateCPF: (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
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

  validateCNPJ: (cnpj: string): boolean => {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    
    if (cleanCNPJ.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
    
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

  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePhone: (phone: string): boolean => {
    const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
    return phoneRegex.test(phone);
  }
};

// Função helper para validar dados com Zod
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Dados inválidos: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

// Função helper para validar query parameters
export function validateQuery<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): T {
  const data = Object.fromEntries(searchParams);
  return validateData(schema, data);
}

// Função para sanitizar entrada HTML
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Helpers simples de validação booleana compatíveis com validation.ts
export const isValidEmail = (email: string) => documentValidations.validateEmail(email);
export const isValidPhone = (phone: string) => documentValidations.validatePhone(phone);
export const isValidCPF = (cpf: string) => documentValidations.validateCPF(cpf);
export const isValidCNPJ = (cnpj: string) => documentValidations.validateCNPJ(cnpj);
export const isValidCEP = (cep: string) => commonValidations.cep.safeParse(cep).success;
export const isValidURL = (url: string) => commonValidations.url.safeParse(url).success;
export const isValidSlug = (slug: string) => commonValidations.slug.safeParse(slug).success;

export const validators = {
  ...commonValidations,
  ...fileValidations,
  ...formValidations,
  ...documentValidations,
  validateData,
  validateQuery,
  sanitizeHtml,
  isValidEmail,
  isValidPhone,
  isValidCPF,
  isValidCNPJ,
  isValidCEP,
  isValidURL,
  isValidSlug
};

export default validators;
export const validateFileType = fileValidations.validateFileType;
export const validateFileSize = fileValidations.validateFileSize;
export const validateImageFile = fileValidations.validateImageFile;