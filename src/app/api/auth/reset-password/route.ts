import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/(?=.*[a-z])/, 'Deve conter pelo menos uma letra minúscula')
    .regex(/(?=.*[A-Z])/, 'Deve conter pelo menos uma letra maiúscula')
    .regex(/(?=.*\d)/, 'Deve conter pelo menos um número'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
});

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // Criar cliente Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verificar token de reset
    const { data: resetData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at, used')
      .eq('token', token)
      .single();

    if (tokenError || !resetData) {
      return NextResponse.json({ 
        error: 'Token de reset inválido' 
      }, { status: 400 });
    }

    if (resetData.used) {
      return NextResponse.json({ 
        error: 'Token já foi utilizado' 
      }, { status: 400 });
    }

    if (new Date(resetData.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'Token expirado' 
      }, { status: 400 });
    }

    // Buscar dados do usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, type, password')
      .eq('id', resetData.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Usuário não encontrado' 
      }, { status: 404 });
    }

    // Verificar se a nova senha é diferente da atual
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return NextResponse.json({ 
        error: 'A nova senha deve ser diferente da senha atual' 
      }, { status: 400 });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Atualizar senha do usuário
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString(),
        // Forçar nova verificação de email se aplicável
        password_changed_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError);
      return NextResponse.json({ 
        error: 'Erro ao atualizar senha' 
      }, { status: 500 });
    }

    // Marcar token como usado
    const { error: markUsedError } = await supabase
      .from('password_reset_tokens')
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('token', token);

    if (markUsedError) {
      console.error('Erro ao marcar token como usado:', markUsedError);
    }

    // Invalidar todas as sessões existentes do usuário
    await supabase
      .from('user_sessions')
      .update({ 
        is_active: false,
        ended_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    // Log do evento de segurança
    await supabase
      .from('security_events')
      .insert({
        event_type: 'PASSWORD_RESET_SUCCESS',
        user_id: user.id,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          email: user.email,
          user_type: user.type,
          password_strength: calculatePasswordStrength(password)
        }
      });

    console.info(`Senha resetada com sucesso para usuário: ${user.email}`);

    // Gerar novo token de acesso
    const newToken = generateToken({
      userId: user.id,
      email: user.email,
      type: user.type
    });

    // Preparar resposta (sem senha)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso',
      user: userWithoutPassword,
      token: newToken
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: error.errors 
      }, { status: 400 });
    }

    console.error('Erro no reset de senha:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// Função para calcular força da senha
function calculatePasswordStrength(password: string): string {
  let score = 0;
  
  // Comprimento
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Caracteres
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  // Padrões comuns
  if (!/(.)\1{2,}/.test(password)) score++; // Sem repetição
  if (!/123|abc|qwe/.test(password.toLowerCase())) score++; // Sem sequências
  
  if (score < 3) return 'fraca';
  if (score < 6) return 'média';
  if (score < 8) return 'forte';
  return 'muito_forte';
}