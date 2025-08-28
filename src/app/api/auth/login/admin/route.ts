import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { comparePassword, generateToken } from '@/lib/auth';

const adminLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
  adminCode: z.string().min(1, 'Código administrativo obrigatório'),
});

// Códigos administrativos válidos (em produção, isso viria de variáveis de ambiente)
const VALID_ADMIN_CODES = [
  'ADMIN2024',
  'MASTER_ACCESS_2024',
  process.env.ADMIN_ACCESS_CODE,
].filter(Boolean);

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const { email, password, adminCode } = adminLoginSchema.parse(body);

    // Verificar código administrativo
    if (!VALID_ADMIN_CODES.includes(adminCode)) {
      // Log da tentativa de acesso não autorizado
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      console.warn(`Tentativa de login admin com código inválido: ${email} - IP: ${ip}`);
      
      return NextResponse.json({ 
        error: 'Código administrativo inválido' 
      }, { status: 401 });
    }

    // Criar cliente Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Usar service role para operações administrativas
    );

    // Buscar usuário admin por email
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id, name, email, password, phone, type, city, state, avatar, is_verified, created_at, updated_at
      `)
      .eq('email', email)
      .eq('type', 'ADMIN') // Garantir que é um admin
      .single();

    if (error || !user) {
      console.warn(`Tentativa de login admin falhada: ${email} - Usuário não encontrado ou não é admin`);
      return NextResponse.json({ 
        error: 'Credenciais de administrador inválidas' 
      }, { status: 401 });
    }

    // Verificar senha
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      console.warn(`Tentativa de login admin falhada: ${email} - Senha incorreta`);
      return NextResponse.json({ 
        error: 'Credenciais de administrador inválidas' 
      }, { status: 401 });
    }

    // Verificar se conta está ativa
    if (!user.is_verified) {
      return NextResponse.json({ 
        error: 'Conta administrativa não verificada. Contate o suporte.' 
      }, { status: 403 });
    }

    // Gerar token com permissões especiais para admin
    const token = generateToken({
      userId: user.id,
      email: user.email,
      type: user.type
    });

    // Preparar resposta do usuário (sem senha)
    const { password: _, ...userWithoutPassword } = user;
    
    // Log do login administrativo bem-sucedido
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.info(`Login admin bem-sucedido: ${email} - ID: ${user.id} - IP: ${ip}`);

    // Registrar evento de segurança
    await supabase
      .from('security_events')
      .insert({
        event_type: 'ADMIN_LOGIN',
        user_id: user.id,
        ip_address: ip,
        user_agent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          email: user.email,
          admin_code_used: adminCode,
          success: true
        }
      })
      .then(result => {
        if (result.error) {
          console.warn('Falha ao registrar evento de segurança:', result.error);
        }
      });
    
    return NextResponse.json({
      user: userWithoutPassword,
      token,
      message: 'Login administrativo realizado com sucesso',
      sessionId: generateSessionId(), // ID único para a sessão
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: error.errors 
      }, { status: 400 });
    }

    console.error('Erro no login administrativo:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// Função para gerar ID único de sessão
function generateSessionId(): string {
  return `admin_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}