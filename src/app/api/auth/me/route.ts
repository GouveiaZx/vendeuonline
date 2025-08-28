import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

const getMeHandler = async (request: AuthenticatedRequest) => {
  try {
    const user = request.user!;

    // Criar cliente Supabase para buscar dados completos
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buscar dados completos do usuário baseado no tipo
    let userData;
    
    if (user.type === 'ADMIN') {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, phone, type, city, state, avatar, is_verified, created_at, updated_at,
          admins (
            id, permissions, last_login_at, login_attempts, is_active, metadata
          )
        `)
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Erro ao buscar dados do admin:', error);
        userData = user; // Fallback para dados do token
      } else {
        userData = data;
      }
    } else if (user.type === 'SELLER') {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, phone, type, city, state, avatar, is_verified, created_at, updated_at,
          sellers (
            id, store_name, store_description, store_slug, address, zip_code, 
            category, plan, is_active, rating, total_sales, commission
          ),
          stores (
            id, name, slug, description, rating, review_count, 
            product_count, sales_count, is_verified, is_active
          )
        `)
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Erro ao buscar dados do seller:', error);
        userData = user; // Fallback para dados do token
      } else {
        userData = data;
      }
    } else if (user.type === 'BUYER') {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, phone, type, city, state, avatar, is_verified, created_at, updated_at,
          buyers (
            id, preferences
          )
        `)
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Erro ao buscar dados do buyer:', error);
        userData = user; // Fallback para dados do token
      } else {
        userData = data;
      }
    } else {
      userData = user; // Usar dados do token
    }

    // Remove password from response if it exists
    const { password, ...safeUser } = userData as any;

    // Atualizar último acesso se for admin
    if (user.type === 'ADMIN') {
      await supabase
        .from('admins')
        .update({ 
          last_login_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .then(result => {
          if (result.error) {
            console.warn('Falha ao atualizar último acesso admin:', result.error);
          }
        });
    }

    return NextResponse.json({
      user: safeUser,
      session: {
        isValid: true,
        expiresAt: user.exp ? new Date(user.exp * 1000) : null,
        type: user.type
      }
    });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Exportar com middleware de autenticação
export const GET = withAuth(getMeHandler)