import { z } from 'zod'

// Validações comuns
export const commonValidations = {
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  phone: z.string().regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, 'Telefone inválido'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido'),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  url: z.string().url('URL inválida'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido')
}

// Validações de paginação
export const paginationSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// Validações de filtros
export const filterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
})

// Validações de autenticação
export const authSchemas = {
  login: z.object({
    email: commonValidations.email,
    password: z.string().min(1, 'Senha é obrigatória')
  }),
  
  register: z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: commonValidations.email,
    password: commonValidations.password,
    confirmPassword: z.string(),
    userType: z.enum(['BUYER', 'SELLER']),
    phone: commonValidations.phone.optional(),
    cpf: commonValidations.cpf.optional(),
    cnpj: commonValidations.cnpj.optional()
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword']
  }),
  
  forgotPassword: z.object({
    email: commonValidations.email
  }),
  
  resetPassword: z.object({
    token: z.string().min(1, 'Token é obrigatório'),
    password: commonValidations.password,
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword']
  })
}

// Validações de produto
export const productSchemas = {
  create: z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
    price: z.number().positive('Preço deve ser positivo'),
    comparePrice: z.number().positive().optional(),
    categoryId: z.string().min(1, 'Categoria é obrigatória'),
    subcategory: z.string().optional(),
    stock: z.number().int().min(0, 'Estoque não pode ser negativo'),
    minStock: z.number().int().min(0).default(5),
    sku: z.string().optional(),
    weight: z.number().positive().optional(),
    dimensions: z.object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive()
    }).optional(),
    tags: z.array(z.string()).default([]),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    images: z.array(z.object({
      url: commonValidations.url,
      alt: z.string(),
      isMain: z.boolean().default(false)
    })).min(1, 'Pelo menos uma imagem é obrigatória'),
    specifications: z.array(z.object({
      name: z.string(),
      value: z.string()
    })).default([])
  }),
  
  update: z.object({
    name: z.string().min(1, 'Nome é obrigatório').optional(),
    description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').optional(),
    price: z.number().positive('Preço deve ser positivo').optional(),
    comparePrice: z.number().positive().optional(),
    categoryId: z.string().min(1, 'Categoria é obrigatória').optional(),
    subcategory: z.string().optional(),
    stock: z.number().int().min(0, 'Estoque não pode ser negativo').optional(),
    minStock: z.number().int().min(0).optional(),
    sku: z.string().optional(),
    weight: z.number().positive().optional(),
    dimensions: z.object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive()
    }).optional(),
    tags: z.array(z.string()).optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    isActive: z.boolean().optional()
  }),
  
  query: z.object({
    ...paginationSchema.shape,
    ...filterSchema.shape,
    minPrice: z.string().transform(Number).optional(),
    maxPrice: z.string().transform(Number).optional(),
    sortBy: z.enum(['name', 'price', 'createdAt', 'rating', 'sales']).default('createdAt'),
    storeId: z.string().optional(),
    sellerId: z.string().optional()
  })
}

// Validações de pedido
export const orderSchemas = {
  create: z.object({
    items: z.array(z.object({
      productId: z.string().min(1, 'ID do produto é obrigatório'),
      quantity: z.number().int().positive('Quantidade deve ser positiva'),
      price: z.number().positive('Preço deve ser positivo')
    })).min(1, 'Pelo menos um item é obrigatório'),
    shippingAddress: z.object({
      street: z.string().min(1, 'Rua é obrigatória'),
      number: z.string().min(1, 'Número é obrigatório'),
      complement: z.string().optional(),
      neighborhood: z.string().min(1, 'Bairro é obrigatório'),
      city: z.string().min(1, 'Cidade é obrigatória'),
      state: z.string().min(2, 'Estado é obrigatório'),
      zipCode: commonValidations.cep,
      country: z.string().default('Brasil')
    }),
    paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO']),
    notes: z.string().optional()
  }),
  
  updateStatus: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
  }),
  
  addTracking: z.object({
    trackingCode: z.string().min(1, 'Código de rastreamento é obrigatório'),
    carrier: z.string().min(1, 'Transportadora é obrigatória')
  }),
  
  query: z.object({
    ...paginationSchema.shape,
    status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
    storeId: z.string().optional(),
    sellerId: z.string().optional(),
    buyerId: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional()
  })
}

// Validações de loja
export const storeSchemas = {
  create: z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
    category: z.string().min(1, 'Categoria é obrigatória'),
    logo: commonValidations.url.optional(),
    banner: commonValidations.url.optional(),
    address: z.object({
      street: z.string().min(1, 'Rua é obrigatória'),
      number: z.string().min(1, 'Número é obrigatório'),
      complement: z.string().optional(),
      neighborhood: z.string().min(1, 'Bairro é obrigatório'),
      city: z.string().min(1, 'Cidade é obrigatória'),
      state: z.string().min(2, 'Estado é obrigatório'),
      zipCode: commonValidations.cep,
      country: z.string().default('Brasil')
    }),
    contact: z.object({
      phone: commonValidations.phone,
      email: commonValidations.email,
      website: commonValidations.url.optional(),
      whatsapp: commonValidations.phone.optional()
    }),
    settings: z.object({
      acceptsReturns: z.boolean().default(true),
      returnDays: z.number().int().min(7).max(30).default(30),
      freeShippingMinValue: z.number().positive().optional(),
      processingDays: z.number().int().min(1).max(10).default(2)
    }).optional()
  }),
  
  update: z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
    description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').optional(),
    category: z.string().min(1, 'Categoria é obrigatória').optional(),
    logo: commonValidations.url.optional(),
    banner: commonValidations.url.optional(),
    isActive: z.boolean().optional(),
    settings: z.object({
      acceptsReturns: z.boolean().optional(),
      returnDays: z.number().int().min(7).max(30).optional(),
      freeShippingMinValue: z.number().positive().optional(),
      processingDays: z.number().int().min(1).max(10).optional()
    }).optional()
  }),
  
  query: z.object({
    ...paginationSchema.shape,
    ...filterSchema.shape,
    sortBy: z.enum(['name', 'rating', 'createdAt', 'productCount']).default('createdAt'),
    isActive: z.boolean().optional()
  })
}

// Validações de planos
export const planSchema = z.object({
  name: z.string().min(1, 'Nome do plano é obrigatório'),
  slug: z.string().min(1, 'Slug é obrigatório').regex(/^[a-z0-9_-]+$/, 'Slug deve conter apenas letras minúsculas, números, hífens e underscores'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  price: z.number().min(0, 'Preço não pode ser negativo'),
  billingPeriod: z.string().min(1, 'Período de cobrança é obrigatório'),
  maxAds: z.number().int().min(0, 'Número máximo de anúncios não pode ser negativo'),
  adDuration: z.number().int().min(1, 'Duração do anúncio deve ser pelo menos 1 dia'),
  maxPhotos: z.number().int().min(1, 'Deve permitir pelo menos 1 foto'),
  support: z.string().min(1, 'Tipo de suporte é obrigatório'),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  order: z.number().int().min(0, 'Ordem deve ser um número positivo').default(0)
});

// Validações de assinatura
export const subscriptionSchemas = {
  create: z.object({
    planId: z.string().min(1, 'ID do plano é obrigatório'),
    paymentMethod: z.enum(['PIX', 'CREDIT_CARD', 'BANK_SLIP']).optional()
  }),
  
  query: z.object({
    ...paginationSchema.shape,
    status: z.enum(['ACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING']).optional(),
    planId: z.string().optional(),
    userId: z.string().optional()
  })
};

// Validações de pagamento
export const createPaymentSchema = z.object({
  planId: z.string().min(1, 'ID do plano é obrigatório'),
  paymentMethod: z.enum(['pix', 'credit_card'], {
    message: 'Método de pagamento deve ser PIX ou cartão de crédito'
  })
});

export const paymentWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    id: z.union([z.string(), z.number()])
  })
});

// Função helper para validar dados
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Dados inválidos: ${error.issues.map(e => e.message).join(', ')}`)
    }
    throw error
  }
}

// Função helper para validar query parameters
export function validateQuery<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): T {
  const data = Object.fromEntries(searchParams)
  return validateData(schema, data)
}