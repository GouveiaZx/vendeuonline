import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken } from '@/lib/auth'
import { handleAPIError, validateRequired, validateUUID, TransactionManager } from '@/utils/apiErrorHandler'
import { cache, CacheKeys, CacheTTL, withCache, invalidateCache } from '@/lib/cache'

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  comparePrice: z.number().optional(),
  stock: z.number().int().min(0, 'Estoque deve ser positivo'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  brand: z.string().optional(),
  sku: z.string().min(1, 'SKU é obrigatório'),
  weight: z.number().optional(),
  dimensions: z.string().optional(),
  sellerId: z.string().min(1, 'ID do vendedor é obrigatório'),
  images: z.array(z.string()).optional(),
  specifications: z.record(z.string()).optional(),
  tags: z.array(z.string()).optional()
})

const querySchema = z.object({
  sellerId: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  isActive: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
})

// GET - Listar produtos
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // MODO DESENVOLVIMENTO: Retornar dados mock se Supabase não está configurado
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('seu-projeto')) {
      console.log('[DEV MODE] Returning mock products data');
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      
      const mockProducts = [
        {
          id: '1',
          name: 'Produto Demo 1',
          description: 'Descrição do produto de demonstração',
          price: 99.99,
          compare_price: 120.00,
          stock: 10,
          sku: 'DEMO001',
          seller_id: 'seller1',
          is_active: true,
          view_count: 0,
          sales_count: 0,
          rating: 5.0,
          review_count: 0,
          created_at: '2024-01-15T10:00:00.000Z',
          updated_at: '2024-01-15T10:00:00.000Z'
        },
        {
          id: '2',
          name: 'Produto Demo 2',
          description: 'Outro produto de demonstração',
          price: 149.99,
          compare_price: 200.00,
          stock: 5,
          sku: 'DEMO002',
          seller_id: 'seller2',
          is_active: true,
          view_count: 0,
          sales_count: 0,
          rating: 4.5,
          review_count: 0,
          created_at: '2024-02-20T14:30:00.000Z',
          updated_at: '2024-02-20T14:30:00.000Z'
        }
      ];
      
      return NextResponse.json({
        success: true,
        data: mockProducts,
        pagination: {
          page,
          limit,
          total: mockProducts.length,
          totalPages: 1
        }
      });
    }

    // Auth opcional para listagem pública
    const authResult = await getUserFromToken(request)
    const user = authResult.success ? authResult.user : null

    const url = new URL(request.url)
    const params = Object.fromEntries(url.searchParams.entries())
    const { sellerId, category, search, minPrice, maxPrice, isActive, page = '1', limit = '20' } = querySchema.parse(params)

    // Verificar se Supabase está configurado para desenvolvimento
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || 
        process.env.SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key-here' ||
        process.env.SUPABASE_SERVICE_ROLE_KEY.includes('demo') ||
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('seu-projeto') ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('vendeuonline-demo')) {
      
      console.log('[DEV MODE] Supabase not configured, returning mock data for products list');
      
      const pageNum = parseInt(page)
      const limitNum = parseInt(limit)
      
      const mockProducts = [
        {
          id: '1',
          name: 'Smartphone Premium 128GB',
          description: 'Smartphone top de linha com 128GB de armazenamento, câmera profissional e bateria de longa duração.',
          price: 899.99,
          compare_price: 1200.00,
          stock: 15,
          sku: 'PHONE001',
          seller_id: 'seller1',
          is_active: true,
          view_count: 125,
          sales_count: 23,
          rating: 4.8,
          review_count: 47,
          created_at: '2024-01-15T10:00:00.000Z',
          updated_at: '2024-01-15T10:00:00.000Z'
        },
        {
          id: '2',
          name: 'Notebook Gamer RTX 4060',
          description: 'Notebook para jogos com placa de vídeo dedicada RTX 4060, processador i7 e 16GB RAM.',
          price: 3499.99,
          compare_price: 4000.00,
          stock: 8,
          sku: 'LAPTOP001',
          seller_id: 'seller2',
          is_active: true,
          view_count: 234,
          sales_count: 12,
          rating: 4.9,
          review_count: 28,
          created_at: '2024-02-20T14:30:00.000Z',
          updated_at: '2024-02-20T14:30:00.000Z'
        },
        {
          id: '3',
          name: 'Fone de Ouvido Bluetooth',
          description: 'Fone sem fio com cancelamento de ruído ativo, bateria de 30h e qualidade de som premium.',
          price: 299.99,
          compare_price: 399.99,
          stock: 50,
          sku: 'AUDIO001',
          seller_id: 'seller1',
          is_active: true,
          view_count: 89,
          sales_count: 67,
          rating: 4.6,
          review_count: 134,
          created_at: '2024-03-10T09:15:00.000Z',
          updated_at: '2024-03-10T09:15:00.000Z'
        }
      ];
      
      const startIndex = (pageNum - 1) * limitNum
      const endIndex = startIndex + limitNum
      const paginatedProducts = mockProducts.slice(startIndex, endIndex)
      
      return NextResponse.json({
        success: true,
        data: paginatedProducts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: mockProducts.length,
          totalPages: Math.ceil(mockProducts.length / limitNum),
          hasNext: endIndex < mockProducts.length,
          hasPrev: pageNum > 1
        }
      });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query = supabase
      .from('products')
      .select(`
        id, name, description, price, compare_price, stock, sku,
        weight, dimensions, seller_id, is_active,
        view_count, sales_count, rating, review_count, created_at, updated_at,
        store_id,
        categories (id, name),
        stores (id, name, seller_id)
      `)

    // Filtros baseados em permissões
    if (user?.type === 'SELLER') {
      // Vendedor só vê seus próprios produtos
      query = query.eq('seller_id', user.id)
    } else if (user?.type === 'ADMIN') {
      // Admin pode filtrar por vendedor específico se fornecido
      if (sellerId) {
        query = query.eq('seller_id', sellerId)
      }
    } else {
      // Usuários não autenticados ou buyers: apenas produtos ativos
      query = query.eq('is_active', true)
      if (sellerId) {
        query = query.eq('seller_id', sellerId)
      }
    }

    // Filtros gerais
    if (category) query = query.eq('categories.name', category)
    if (isActive !== undefined) query = query.eq('is_active', isActive === 'true')
    if (search) {
      query = query.textSearch('search_vector', search, {
        type: 'websearch',
        config: 'portuguese'
      })
    }
    if (minPrice) query = query.gte('price', parseFloat(minPrice))
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice))

    // Paginação
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    // Contar total primeiro
    let countQuery = supabase.from('products').select('*', { count: 'exact', head: true })
    
    // Aplicar filtros de contagem baseados em permissões
    if (user?.type === 'SELLER') {
      countQuery = countQuery.eq('seller_id', user.id)
    } else if (user?.type === 'ADMIN') {
      if (sellerId) {
        countQuery = countQuery.eq('seller_id', sellerId)
      }
    } else {
      // Usuários não autenticados ou buyers: apenas produtos ativos
      countQuery = countQuery.eq('is_active', true)
      if (sellerId) {
        countQuery = countQuery.eq('seller_id', sellerId)
      }
    }
    
    // Aplicar outros filtros de contagem
    if (category) countQuery = countQuery.eq('categories.name', category)
    if (isActive !== undefined) countQuery = countQuery.eq('is_active', isActive === 'true')
    
    const { count, error: countError } = await countQuery
    if (countError) {
      console.error('Erro ao contar produtos:', countError)
      return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
    }

    // Usar cache para consultas de produtos
    const cacheKey = user?.type === 'SELLER' 
      ? CacheKeys.PRODUCTS_BY_SELLER(user.id, pageNum)
      : `products:search:${JSON.stringify({sellerId, category, search, minPrice, maxPrice, isActive, page: pageNum, limit: limitNum, userType: user?.type || 'public'})}`;
      
    const cachedResult = cache.get<{data: any[], total: number}>(cacheKey);
    
    if (cachedResult) {
      return NextResponse.json({
        success: true,
        data: cachedResult.data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: cachedResult.total,
          totalPages: Math.ceil(cachedResult.total / limitNum)
        }
      });
    }

    // Aplicar paginação
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1)

    const { data: products, error } = await query

    if (error) {
      console.error('Erro ao buscar produtos:', error)
      return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
    }

    // Cache do resultado
    const result = {
      data: products || [],
      total: count || 0
    };
    
    cache.set(cacheKey, result, CacheTTL.MEDIUM);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: Math.ceil(result.total / limitNum)
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Parâmetros inválidos', details: error.issues }, { status: 400 })
    }

    console.error('Erro na API de produtos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar produto
export async function POST(request: NextRequest): Promise<Response> {
  return withErrorHandler(async () => {
    // Validar auth
    const authResult = await getUserFromToken(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = authResult.user
    if (user.type !== 'SELLER' && user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = productSchema.parse(body)

    // Verificar se é vendedor do produto ou admin
    if (user.type === 'SELLER' && validatedData.sellerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const transaction = new TransactionManager()

    // Verificar se o vendedor tem loja
    const store = await transaction.execute(
      'verify-store',
      async () => {
        const { data, error } = await supabase
          .from('stores')
          .select('id, is_active')
          .eq('seller_id', validatedData.sellerId)
          .single()
        if (error || !data) throw new Error('Store not found')
        return data
      },
      async () => {} // Nada para rollback na verificação
    )

    if (!store || !store.is_active) {
      return NextResponse.json({ error: 'Loja não encontrada ou inativa para este vendedor' }, { status: 400 })
    }

    // Verificar se SKU já existe
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('sku', validatedData.sku)
      .eq('seller_id', validatedData.sellerId)
      .single()

    if (existingProduct) {
      return NextResponse.json({ error: 'SKU já existe para este vendedor' }, { status: 400 })
    }

    // Gerar slug único
    const baseSlug = validatedData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50)

    let slug = baseSlug
    let counter = 1
    
    while (true) {
      const { data: slugExists } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!slugExists) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const storeId = store.id

    // Criar produto com transação
    const productId = crypto.randomUUID()
    const product = await transaction.execute(
      'create-product',
      async () => {
        const { data, error } = await supabase
          .from('products')
          .insert({
            id: productId,
            store_id: store.id,
            seller_id: validatedData.sellerId,
            category_id: validatedData.category || 'cat-1',
            name: validatedData.name,
            slug,
            description: validatedData.description,
            price: validatedData.price,
            compare_price: validatedData.comparePrice,
            stock: validatedData.stock,
            sku: validatedData.sku,
            weight: validatedData.weight,
            dimensions: validatedData.dimensions,
            is_active: true,
            is_featured: false,
            tags: validatedData.tags || [],
            specifications: validatedData.specifications || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
        if (error) throw error
        return data
      },
      async () => {
        await supabase.from('products').delete().eq('id', productId)
      }
    )


    // Incrementar contador de produtos na loja
    await transaction.execute(
      'increment-counter',
      async () => {
        const { error } = await supabase.rpc('increment_store_product_count', {
          store_id: store.id
        })
        if (error) throw error
      },
      async () => {
        await supabase.rpc('decrement_store_product_count', {
          store_id: store.id
        })
      }
    )

    // Invalidar cache relacionado
    invalidateCache.onProductChange(product.id, validatedData.sellerId, validatedData.category);

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Produto criado com sucesso'
    }, { status: 201 })
  })(request)
}

// Wrapper para handleAPIError
function withErrorHandler(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      return await handler(request)
    } catch (error) {
      return handleAPIError(error, {
        method: request.method,
        url: request.url
      })
    }
  }
}