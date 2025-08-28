import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeForSearch } from '@/lib/sanitizer';

interface SearchSuggestion {
  text: string;
  type: 'product' | 'store' | 'category';
  count: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = sanitizeForSearch(searchParams.get('q') || '');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || 'all'; // 'all', 'products', 'stores', 'categories'

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const suggestions: SearchSuggestion[] = [];

    // Se não há query, retornar sugestões populares/trending
    if (!query.trim()) {
      // Buscar termos mais pesquisados (simulado por enquanto)
      const trendingSuggestions: SearchSuggestion[] = [
        { text: 'smartphone', type: 'product', count: 1250 },
        { text: 'notebook', type: 'product', count: 980 },
        { text: 'tênis', type: 'product', count: 850 },
        { text: 'eletrônicos', type: 'category', count: 750 },
        { text: 'roupas', type: 'category', count: 680 },
        { text: 'casa e jardim', type: 'category', count: 520 },
        { text: 'TechStore', type: 'store', count: 450 },
        { text: 'MegaShop', type: 'store', count: 380 }
      ];

      return new Response(JSON.stringify({
        suggestions: trendingSuggestions.slice(0, limit),
        type: 'trending'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Buscar sugestões de produtos
    if (type === 'all' || type === 'products') {
      const { data: products } = await supabase
        .from('products')
        .select('name')
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .limit(limit)
        .order('name');

      if (products) {
        products.forEach(product => {
          suggestions.push({
            text: product.name,
            type: 'product',
            count: Math.floor(Math.random() * 100) + 1 // Simulado
          });
        });
      }
    }

    // Buscar sugestões de lojas
    if (type === 'all' || type === 'stores') {
      const { data: stores } = await supabase
        .from('stores')
        .select('name')
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .limit(limit)
        .order('name');

      if (stores) {
        stores.forEach(store => {
          suggestions.push({
            text: store.name,
            type: 'store',
            count: Math.floor(Math.random() * 50) + 1 // Simulado
          });
        });
      }
    }

    // Buscar sugestões de categorias
    if (type === 'all' || type === 'categories') {
      const { data: categories } = await supabase
        .from('products')
        .select('category')
        .ilike('category', `%${query}%`)
        .eq('is_active', true)
        .limit(limit);

      if (categories) {
        const uniqueCategories = [...new Set(categories.map(c => c.category))];
        uniqueCategories.forEach(category => {
          if (category) {
            suggestions.push({
              text: category,
              type: 'category',
              count: Math.floor(Math.random() * 200) + 1 // Simulado
            });
          }
        });
      }
    }

    // Adicionar sugestões de histórico do usuário (simulado)
    const historySuggestions: SearchSuggestion[] = [
      { text: 'iphone 15', type: 'product' as const, count: 5 },
      { text: 'samsung galaxy', type: 'product' as const, count: 3 },
      { text: 'notebook gamer', type: 'product' as const, count: 2 }
    ].filter(s => s.text.toLowerCase().includes(query.toLowerCase()));

    suggestions.push(...historySuggestions);

    // Remover duplicatas e ordenar por relevância
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text === suggestion.text && s.type === suggestion.type)
      )
      .sort((a, b) => {
        // Priorizar por tipo: histórico > produtos > lojas > categorias
        const typeOrder: Record<string, number> = { product: 1, store: 2, category: 3 };
        if (typeOrder[a.type] !== typeOrder[b.type]) {
          return typeOrder[a.type] - typeOrder[b.type];
        }
        // Depois por contagem (descendente)
        return b.count - a.count;
      })
      .slice(0, limit);

    return new Response(JSON.stringify({
      suggestions: uniqueSuggestions,
      type: 'search',
      query
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erro ao buscar sugestões:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// POST para salvar uma busca realizada (para melhorar sugestões futuras)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type, userId } = body;

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query é obrigatória' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Salvar no histórico de buscas (implementação futura)
    // Por enquanto, apenas retornar sucesso
    console.log('Busca registrada:', { query, type, userId, timestamp: new Date() });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erro ao registrar busca:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}