import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SearchFilters, SearchResult, SearchProduct, SearchStoreData, SearchAggregatedFilters, SearchPagination } from '@/types';
import { sanitizeForSearch, sanitizeNumber, sanitizeSortBy, sanitizeSortOrder } from '@/lib/sanitizer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para buscar agregações
async function getAggregations(supabase: any, query: string, filters: any): Promise<SearchAggregatedFilters> {
  // Buscar categorias com contagem
  const { data: categoryData } = await supabase
    .from('products')
    .select('category')
    .eq('is_active', true)
    .then((result: any) => {
      if (result.data) {
        const categoryCounts = result.data.reduce((acc: any, item: any) => {
          if (item.category) {
            acc[item.category] = (acc[item.category] || 0) + 1;
          }
          return acc;
        }, {});
        
        return {
          data: Object.entries(categoryCounts).map(([name, count]) => ({
            name,
            count: count as number
          }))
        };
      }
      return { data: [] };
    });

  // Buscar faixas de preço com contagem
  const priceRanges = [
    { min: 0, max: 50, name: 'Até R$ 50', count: 0 },
    { min: 50, max: 100, name: 'R$ 50 - R$ 100', count: 0 },
    { min: 100, max: 250, name: 'R$ 100 - R$ 250', count: 0 },
    { min: 250, max: 500, name: 'R$ 250 - R$ 500', count: 0 },
    { min: 500, max: 1000, name: 'R$ 500 - R$ 1.000', count: 0 },
    { min: 1000, max: null, name: 'Acima de R$ 1.000', count: 0 }
  ];

  // Buscar contagem por faixa de preço
  for (const range of priceRanges) {
    let priceQuery = supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('price', range.min);
    
    if (range.max) {
      priceQuery = priceQuery.lte('price', range.max);
    }
    
    const { count } = await priceQuery;
    range.count = count || 0;
  }

  // Buscar avaliações com contagem
  const ratings = [
    { rating: 5, name: '5 estrelas', count: 0 },
    { rating: 4, name: '4+ estrelas', count: 0 },
    { rating: 3, name: '3+ estrelas', count: 0 },
    { rating: 2, name: '2+ estrelas', count: 0 },
    { rating: 1, name: '1+ estrela', count: 0 }
  ];

  for (const ratingItem of ratings) {
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('rating', ratingItem.rating);
    
    ratingItem.count = count || 0;
  }

  // Buscar localizações com contagem
  const { data: locationData } = await supabase
    .from('stores')
    .select('city, state')
    .eq('is_active', true)
    .then((result: any) => {
      if (result.data) {
        const locationCounts = result.data.reduce((acc: any, item: any) => {
          if (item.city && item.state) {
            const location = `${item.city}, ${item.state}`;
            acc[location] = (acc[location] || 0) + 1;
          }
          return acc;
        }, {});
        
        return {
          data: Object.entries(locationCounts)
            .map(([name, count]) => ({ name, count: count as number }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10) // Top 10 localizações
        };
      }
      return { data: [] };
    });

  return {
    priceRange: {
      min: Math.min(...priceRanges.map(r => r.min)),
      max: priceRanges.find(r => r.max === null)?.min || Math.max(...priceRanges.filter(r => r.max !== null).map(r => r.max!))
    },
    categories: (categoryData || []).map((cat: any) => ({
      id: cat.name.toLowerCase().replace(/\s+/g, '-'),
      name: cat.name,
      count: cat.count
    })),
    locations: (locationData || []).map((loc: any) => {
      const [city, state] = loc.name.split(', ');
      return {
        city: city || '',
        state: state || '',
        count: loc.count
      };
    }),
    ratings: ratings.map(r => ({
      rating: r.rating,
      count: r.count
    })),
    brands: [] // Placeholder para brands - implementar conforme necessário
  };
}

import { getUserFromToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Autenticação opcional para personalização de resultados
    const authResult = await getUserFromToken(request);
    const user = authResult.success ? authResult.user : null;

    // MODO DESENVOLVIMENTO: Retornar dados mock se Supabase não está configurado
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || 
        supabaseUrl.includes('seu-projeto') || 
        supabaseUrl.includes('vendeuonline-demo') ||
        !serviceKey || 
        serviceKey === 'your-service-role-key-here' ||
        serviceKey.includes('demo')) {
      console.log('[DEV MODE] Returning mock search data');
      
      const { searchParams } = new URL(request.url);
      const query = searchParams.get('q') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      
      const mockProducts = [
        {
          id: '1',
          name: 'Produto Demo 1',
          description: 'Descrição do produto de demonstração',
          price: 99.90,
          salePrice: 79.90,
          imageUrl: '/images/demo-product-1.jpg',
          category: 'Eletrônicos',
          stockQuantity: 50,
          rating: 4.5,
          reviewCount: 25,
          store: {
            id: '1',
            name: 'Loja Demo',
            slug: 'loja-demo',
            city: 'São Paulo',
            state: 'SP'
          }
        }
      ];
      
      const mockStores = [
        {
          id: '1',
          name: 'Loja Demo',
          description: 'Loja de demonstração',
          slug: 'loja-demo',
          city: 'São Paulo',
          state: 'SP',
          rating: 4.8,
          reviewCount: 100,
          productCount: 25
        }
      ];
      
      return NextResponse.json({
        success: true,
        data: {
          products: mockProducts,
          stores: mockStores,
          aggregations: {
            categories: [{ id: 'eletronicos', name: 'Eletrônicos', count: 1 }],
            priceRange: { min: 0, max: 1000 },
            locations: [{ city: 'São Paulo', state: 'SP', count: 1 }],
            ratings: [{ rating: 4, count: 1 }],
            brands: []
          },
          pagination: {
            page,
            limit,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        }
      });
    }

    const { searchParams } = new URL(request.url);
    
    // Extrair parâmetros de busca
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // 'all', 'products', 'stores'
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const rating = searchParams.get('rating');
    const storeId = searchParams.get('storeId');
    const inStock = searchParams.get('inStock') === 'true';
    const hasDiscount = searchParams.get('hasDiscount') === 'true';
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || '10';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const skip = (page - 1) * limit;
    const offset = skip;

    let products: SearchProduct[] = [];
    let stores: SearchStoreData[] = [];
    let totalProducts = 0;
    let totalStores = 0;

    // Buscar produtos se type for 'all' ou 'products'
    if (type === 'all' || type === 'products') {
      let productQuery = supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          sale_price,
          image_url,
          category,
          stock_quantity,
          rating,
          review_count,
          store:stores(
            id,
            name,
            slug,
            city,
            state,
            latitude,
            longitude
          )
        `, { count: 'exact' })
        .eq('is_active', true);

      // Aplicar filtros de busca por texto (SEGURO: com sanitização)
      if (query) {
        const sanitizedQuery = sanitizeForSearch(query);
        productQuery = productQuery.or(`name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`);
      }

      // Filtro por categoria
      if (category) {
        productQuery = productQuery.eq('category', category);
      }

      // Filtro por preço
      if (minPrice) {
        productQuery = productQuery.gte('price', parseFloat(minPrice));
      }
      if (maxPrice) {
        productQuery = productQuery.lte('price', parseFloat(maxPrice));
      }

      // Filtro por estoque
      if (inStock) {
        productQuery = productQuery.gt('stock_quantity', 0);
      }

      // Filtro por promoção
      if (hasDiscount) {
        productQuery = productQuery.not('sale_price', 'is', null);
      }

      // Filtro por avaliação
      if (rating) {
        productQuery = productQuery.gte('rating', parseFloat(rating));
      }

      // Filtro por loja
      if (storeId) {
        productQuery = productQuery.eq('store_id', storeId);
      }

      // Ordenação
      switch (sortBy) {
        case 'price':
          productQuery = productQuery.order('price', { ascending: sortOrder === 'asc' });
          break;
        case 'rating':
          productQuery = productQuery.order('rating', { ascending: sortOrder === 'asc' });
          break;
        case 'name':
          productQuery = productQuery.order('name', { ascending: sortOrder === 'asc' });
          break;
        case 'created_at':
          productQuery = productQuery.order('created_at', { ascending: sortOrder === 'asc' });
          break;
        default:
          // Relevância - ordenar por rating e depois por review_count
          productQuery = productQuery.order('rating', { ascending: false })
                                   .order('review_count', { ascending: false });
      }

      const { data: productData, error: productError, count: productCount } = await productQuery
        .range(offset, offset + limit - 1);

      if (productError) {
        console.error('Erro ao buscar produtos:', productError);
      } else {
        totalProducts = productCount || 0;
        products = (productData || []).map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: product.price,
          originalPrice: product.sale_price ? product.price : undefined,
          comparePrice: product.sale_price,
          rating: product.rating || 0,
          reviewCount: product.review_count || 0,
          salesCount: 0,
          image: product.image_url,
          images: product.image_url ? [{ url: product.image_url, alt: product.name, order: 0 }] : [],
          specifications: [],
          category: {
            id: product.category || 'uncategorized',
            name: product.category || 'Sem categoria',
            slug: product.category?.toLowerCase().replace(/\s+/g, '-') || 'uncategorized'
          },
          store: product.store ? {
            id: product.store.id,
            name: product.store.name,
            slug: product.store.slug,
            rating: product.store.rating || 0,
            city: product.store.city || '',
            state: product.store.state || '',
            isVerified: false
          } : {
            id: '',
            name: '',
            slug: '',
            rating: 0,
            city: '',
            state: '',
            isVerified: false
          },
          storeId: product.store?.id || '',
          storeName: product.store?.name || '',
          sellerId: '',
          stock: product.stock_quantity || 0,
          inStock: (product.stock_quantity || 0) > 0,
          discount: product.sale_price ? Math.round(((product.price - product.sale_price) / product.price) * 100) : undefined,
          createdAt: new Date().toISOString()
        }));
      }
    }

    // Buscar lojas se type for 'all' ou 'stores'
    if (type === 'all' || type === 'stores') {
      let storeQuery = supabase
        .from('stores')
        .select(`
          id,
          name,
          slug,
          description,
          city,
          state,
          latitude,
          longitude,
          rating,
          review_count,
          product_count,
          image_url
        `, { count: 'exact' })
        .eq('is_active', true);

      // Aplicar filtros de busca por texto (SEGURO: com sanitização)
      if (query) {
        const sanitizedQuery = sanitizeForSearch(query);
        storeQuery = storeQuery.or(`name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`);
      }

      // Filtro por localização (cidade/estado) (SEGURO: com sanitização)
      if (city) {
        const sanitizedCity = sanitizeForSearch(city);
        storeQuery = storeQuery.ilike('city', `%${sanitizedCity}%`);
      }
      if (state) {
        const sanitizedState = sanitizeForSearch(state);
        storeQuery = storeQuery.ilike('state', `%${sanitizedState}%`);
      }

      // Filtro por avaliação
      if (rating) {
        storeQuery = storeQuery.gte('rating', parseFloat(rating));
      }

      // Filtro por proximidade geográfica
      if (lat && lng && radius) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusKm = parseFloat(radius);
        
        // Usar fórmula de distância haversine aproximada
        // Esta é uma aproximação simples - para produção, considere usar PostGIS
        storeQuery = storeQuery.not('latitude', 'is', null)
                              .not('longitude', 'is', null);
      }

      // Ordenação para lojas
      switch (sortBy) {
        case 'rating':
          storeQuery = storeQuery.order('rating', { ascending: sortOrder === 'asc' });
          break;
        case 'name':
          storeQuery = storeQuery.order('name', { ascending: sortOrder === 'asc' });
          break;
        case 'product_count':
          storeQuery = storeQuery.order('product_count', { ascending: sortOrder === 'asc' });
          break;
        default:
          // Relevância - ordenar por rating e depois por product_count
          storeQuery = storeQuery.order('rating', { ascending: false })
                                .order('product_count', { ascending: false });
      }

      const { data: storeData, error: storeError, count: storeCount } = await storeQuery
        .range(offset, offset + limit - 1);

      if (storeError) {
        console.error('Erro ao buscar lojas:', storeError);
      } else {
        totalStores = storeCount || 0;
        stores = (storeData || []).map((store: any) => ({
          id: store.id,
          name: store.name,
          description: store.description || '',
          rating: store.rating || 0,
          reviewCount: store.review_count || 0,
          productCount: store.product_count || 0,
          salesCount: 0,
          city: store.city || '',
          state: store.state || '',
          category: store.category || '',
          sellerId: store.seller_id || '',
          location: store.city && store.state ? `${store.city}, ${store.state}` : '',
          isVerified: store.is_verified || false,
          logo: store.image_url,
          banner: store.banner_url,
          createdAt: store.created_at || new Date().toISOString()
        }));
      }
    }

    // Aplicar filtro de proximidade geográfica pós-query para lojas
    if (lat && lng && radius && stores.length > 0) {
      const lat1 = parseFloat(lat);
      const lng1 = parseFloat(lng);
      const radiusKm = parseFloat(radius);
      
      stores = stores.filter((store: any) => {
        if (!store.latitude || !store.longitude) return false;
        
        const lat2 = parseFloat(store.latitude);
        const lng2 = parseFloat(store.longitude);
        
        // Fórmula de distância haversine
        const R = 6371; // Raio da Terra em km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance <= radiusKm;
      });
      
      totalStores = stores.length;
    }

    // Buscar agregações para filtros
    const aggregations = await getAggregations(supabase, query, {
      category,
      minPrice,
      maxPrice,
      city,
      state,
      rating,
      storeId,
      inStock,
      hasDiscount
    });

    const result = {
      products,
      stores,
      categories: [],
      suggestions: [],
      pagination: {
        page,
        limit,
        total: totalProducts + totalStores,
        totalPages: Math.ceil((totalProducts + totalStores) / limit),
        hasNext: page < Math.ceil((totalProducts + totalStores) / limit),
        hasPrev: page > 1
      },
      filters: aggregations,
      aggregations: aggregations,
      total: totalProducts + totalStores,
      query: query
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erro na busca avançada:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}