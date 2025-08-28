/**
 * SCHEMAS DE VALIDAÇÃO PADRONIZADOS
 * 
 * Este arquivo centraliza todos os schemas Zod para validação
 * de entrada nas APIs, garantindo consistência em todo o projeto.
 */

import { z } from 'zod'
import { UserType, OrderStatus, PaymentMethod, SellerPlan } from '@/types'

// ============================================================================
// SCHEMAS BASE
// ============================================================================

export const userTypeSchema = z.enum(['BUYER', 'SELLER', 'ADMIN'])
export const sellerPlanSchema = z.enum(['GRATUITO', 'MICRO_EMPRESA', 'PEQUENA_EMPRESA', 'EMPRESA_SIMPLES', 'EMPRESA_PLUS'])
export const orderStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
export const paymentMethodSchema = z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO', 'WHATSAPP'])

// ============================================================================
// VALIDAÇÕES COMUNS
// ============================================================================

export const emailSchema = z.string().email('Email inválido').max(255)
export const passwordSchema = z.string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .max(100, 'Senha não pode ter mais de 100 caracteres')
  .regex(/(?=.*[a-z])/, 'Deve conter pelo menos uma letra minúscula')
  .regex(/(?=.*[A-Z])/, 'Deve conter pelo menos uma letra maiúscula') 
  .regex(/(?=.*\d)/, 'Deve conter pelo menos um número')
  .regex(/(?=.*[@$!%*?&])/, 'Deve conter pelo menos um caractere especial (@$!%*?&)')
export const phoneSchema = z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').max(15)
export const nameSchema = z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100)
export const citySchema = z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres').max(50)
export const stateSchema = z.string().min(2, 'Estado deve ter pelo menos 2 caracteres').max(50)
export const zipCodeSchema = z.string().min(8, 'CEP deve ter 8 dígitos').max(9)
export const cnpjSchema = z.string().min(14, 'CNPJ deve ter 14 dígitos').max(18).optional()

// ============================================================================
// SCHEMAS DE AUTENTICAÇÃO
// ============================================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória')
})

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  type: userTypeSchema,
  city: citySchema,
  state: stateSchema,
  // Campos específicos para vendedores (opcionais)
  storeName: z.string().min(2).max(100).optional(),
  storeDescription: z.string().min(10).max(500).optional(),
  cnpj: cnpjSchema,
  address: z.string().min(5).max(200).optional(),
  zipCode: zipCodeSchema.optional(),
  category: z.string().min(2).max(50).optional()
})

// ============================================================================
// SCHEMAS DE USUÁRIO
// ============================================================================

export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema.optional(),
  city: citySchema.optional(),
  state: stateSchema.optional(),
  avatar: z.string().url().optional()
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
})

// ============================================================================
// SCHEMAS DE LOJA
// ============================================================================

export const createStoreSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').max(1000),
  logo: z.string().url('URL do logo inválida').optional(),
  banner: z.string().url('URL do banner inválida').optional(),
  address: z.string().min(5, 'Endereço é obrigatório').max(200),
  city: citySchema,
  state: stateSchema,
  zipCode: zipCodeSchema,
  phone: phoneSchema,
  email: emailSchema,
  whatsapp: phoneSchema.optional(),
  website: z.string().url('URL do website inválida').optional(),
  category: z.string().min(2, 'Categoria é obrigatória').max(50),
  socialMedia: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional()
  }).optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional()
})

export const updateStoreSchema = createStoreSchema.partial()

export const storeFiltersSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('12'),
  search: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  isVerified: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['name', 'rating', 'createdAt', 'salesCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// ============================================================================
// SCHEMAS DE PRODUTO
// ============================================================================

export const createProductSchema = z.object({
  name: z.string().min(2, 'Nome do produto é obrigatório').max(200),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').max(2000),
  shortDescription: z.string().max(300).optional(),
  price: z.number().positive('Preço deve ser positivo'),
  comparePrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  category: z.string().min(2, 'Categoria é obrigatória').max(50),
  subcategory: z.string().max(50).optional(),
  brand: z.string().max(50).optional(),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional()
  }).optional(),
  images: z.array(z.string().url()).min(1, 'Pelo menos uma imagem é obrigatória').max(10),
  specifications: z.record(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  stock: z.number().int().min(0, 'Estoque não pode ser negativo'),
  minStock: z.number().int().min(0).optional(),
  trackStock: z.boolean().default(true),
  allowBackorder: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional()
})

export const updateProductSchema = createProductSchema.partial()

export const productFiltersSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  search: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  maxPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  inStock: z.string().transform(val => val === 'true').optional(),
  rating: z.string().regex(/^\d+$/).transform(Number).optional(),
  sortBy: z.enum(['name', 'price', 'rating', 'createdAt', 'salesCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// ============================================================================
// SCHEMAS DE PEDIDO
// ============================================================================

export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().positive()
  })).min(1, 'Pedido deve ter pelo menos um item'),
  shippingAddressId: z.string().uuid(),
  billingAddressId: z.string().uuid().optional(),
  paymentMethod: paymentMethodSchema,
  notes: z.string().max(500).optional()
})

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
  trackingCode: z.string().max(50).optional(),
  notes: z.string().max(500).optional()
})

// ============================================================================
// SCHEMAS DE ENDEREÇO
// ============================================================================

export const createAddressSchema = z.object({
  name: z.string().min(2, 'Nome do endereço é obrigatório').max(50),
  street: z.string().min(5, 'Rua é obrigatória').max(100),
  number: z.string().min(1, 'Número é obrigatório').max(10),
  complement: z.string().max(50).optional(),
  neighborhood: z.string().min(2, 'Bairro é obrigatório').max(50),
  city: citySchema,
  state: stateSchema,
  zipCode: zipCodeSchema,
  isDefault: z.boolean().default(false)
})

export const updateAddressSchema = createAddressSchema.partial()

// ============================================================================
// SCHEMAS DE REVIEW
// ============================================================================

export const createReviewSchema = z.object({
  productId: z.string().uuid().optional(),
  storeId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().min(10, 'Comentário deve ter pelo menos 10 caracteres').max(1000),
  images: z.array(z.string().url()).max(5).optional()
}).refine((data) => data.productId || data.storeId, {
  message: 'Review deve ser para um produto ou loja',
  path: ['productId']
})

// ============================================================================
// SCHEMAS DE PAGINAÇÃO
// ============================================================================

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10')
})

// ============================================================================
// SCHEMAS UTILITÁRIOS
// ============================================================================

export const idParamSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido')
})

export const slugParamSchema = z.object({
  slug: z.string().min(1, 'Slug é obrigatório')
})

export const searchSchema = z.object({
  q: z.string().min(1, 'Termo de busca é obrigatório').max(100),
  ...paginationSchema.shape
})

// ============================================================================
// SCHEMAS DE ADMIN
// ============================================================================

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'BANNED'])
})

export const createBannerSchema = z.object({
  title: z.string().min(2, 'Título é obrigatório').max(100),
  description: z.string().min(10, 'Descrição é obrigatória').max(500),
  imageUrl: z.string().url('URL da imagem inválida'),
  targetUrl: z.string().url('URL de destino inválida'),
  position: z.enum(['HEADER', 'SIDEBAR', 'FOOTER', 'CATEGORY']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean().default(true)
})

export const updateBannerSchema = createBannerSchema.partial()

// ============================================================================
// TIPOS DERIVADOS DOS SCHEMAS
// ============================================================================

export type LoginData = z.infer<typeof loginSchema>
export type RegisterData = z.infer<typeof registerSchema>
export type CreateStoreData = z.infer<typeof createStoreSchema>
export type CreateProductData = z.infer<typeof createProductSchema>
export type CreateOrderData = z.infer<typeof createOrderSchema>
export type CreateAddressData = z.infer<typeof createAddressSchema>
export type CreateReviewData = z.infer<typeof createReviewSchema>
export type ProductFilters = z.infer<typeof productFiltersSchema>
export type StoreFilters = z.infer<typeof storeFiltersSchema>

// ============================================================================
// UTILITÁRIOS DE VALIDAÇÃO
// ============================================================================

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.issues.map(i => i.message).join(', ')}`)
  }
  return result.data
}

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: string[]
} {
  const result = schema.safeParse(data)
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(i => i.message)
    }
  }
  return {
    success: true,
    data: result.data
  }
}