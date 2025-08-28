import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface SearchHistoryItem {
  id: string;
  query: string;
  type: 'products' | 'stores' | 'all';
  timestamp: Date;
  resultsCount: number;
  filters: any;
  userId?: string;
}

// GET - Obter histórico de buscas do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Por enquanto, retornar histórico simulado
    // Em produção, isso viria de uma tabela search_history
    const mockHistory: SearchHistoryItem[] = [
      {
        id: '1',
        query: 'smartphone samsung',
        type: 'products',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min atrás
        resultsCount: 25,
        filters: {
          category: 'eletrônicos',
          minPrice: 500,
          maxPrice: 2000
        }
      },
      {
        id: '2',
        query: 'tênis nike',
        type: 'products',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
        resultsCount: 18,
        filters: {
          category: 'esportes'
        }
      },
      {
        id: '3',
        query: 'notebook gamer',
        type: 'products',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
        resultsCount: 12,
        filters: {
          category: 'informática',
          minPrice: 2000
        }
      },
      {
        id: '4',
        query: 'TechStore',
        type: 'stores',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 dias atrás
        resultsCount: 1,
        filters: {
          city: 'São Paulo'
        }
      },
      {
        id: '5',
        query: 'cafeteira',
        type: 'products',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 dias atrás
        resultsCount: 8,
        filters: {
          category: 'casa e jardim'
        }
      }
    ];

    // Filtrar por userId se fornecido (simulado)
    let filteredHistory = mockHistory;
    if (userId) {
      // Em produção, filtrar pela tabela search_history onde user_id = userId
      filteredHistory = mockHistory; // Por enquanto, retornar todos
    }

    // Aplicar paginação
    const paginatedHistory = filteredHistory.slice(offset, offset + limit);
    const total = filteredHistory.length;

    return NextResponse.json({
      history: paginatedHistory,
      pagination: {
        page,
        currentPage: page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Adicionar item ao histórico de buscas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type, userId, resultsCount, filters } = body;

    if (!query || !type) {
      return NextResponse.json(
        { error: 'Query e type são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Em produção, salvar na tabela search_history
    const historyItem: SearchHistoryItem = {
      id: Date.now().toString(), // Em produção, usar UUID
      query,
      type,
      timestamp: new Date(),
      resultsCount: resultsCount || 0,
      filters: filters || {},
      userId
    };

    // Por enquanto, apenas log
    console.log('Item adicionado ao histórico:', historyItem);

    // Em produção:
    // const { data, error } = await supabase
    //   .from('search_history')
    //   .insert({
    //     user_id: userId,
    //     query,
    //     type,
    //     results_count: resultsCount,
    //     filters: JSON.stringify(filters),
    //     created_at: new Date().toISOString()
    //   });

    return NextResponse.json({
      success: true,
      item: historyItem
    });
  } catch (error) {
    console.error('Erro ao adicionar ao histórico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Limpar histórico de buscas
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const itemId = searchParams.get('itemId');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (itemId) {
      // Deletar item específico
      console.log('Deletando item do histórico:', itemId);
      
      // Em produção:
      // const { error } = await supabase
      //   .from('search_history')
      //   .delete()
      //   .eq('id', itemId)
      //   .eq('user_id', userId);

      return NextResponse.json({ success: true, message: 'Item removido do histórico' });
    } else if (userId) {
      // Limpar todo o histórico do usuário
      console.log('Limpando histórico do usuário:', userId);
      
      // Em produção:
      // const { error } = await supabase
      //   .from('search_history')
      //   .delete()
      //   .eq('user_id', userId);

      return NextResponse.json({ success: true, message: 'Histórico limpo com sucesso' });
    } else {
      return NextResponse.json(
        { error: 'userId ou itemId é obrigatório' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erro ao deletar histórico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}