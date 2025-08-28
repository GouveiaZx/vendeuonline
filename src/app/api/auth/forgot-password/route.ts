import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { generateToken } from '@/lib/auth';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Criar cliente Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verificar se o usuário existe
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, type')
      .eq('email', email)
      .single();

    if (error || !user) {
      // Por segurança, sempre retornar sucesso mesmo se email não existir
      return NextResponse.json({
        success: true,
        message: 'Se o email existir, um link de recuperação será enviado.'
      });
    }

    // Gerar token de reset (válido por 1 hora)
    const resetToken = generateToken({
      userId: user.id,
      email: user.email,
      type: 'password_reset'
    });

    // Salvar token de reset no banco
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hora a partir de agora

    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .upsert({
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (tokenError) {
      console.error('Erro ao salvar token de reset:', tokenError);
      return NextResponse.json({ 
        error: 'Erro interno do servidor' 
      }, { status: 500 });
    }

    // URL de reset
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Enviar email (simulado aqui, mas você deve integrar com um provedor de email)
    const emailData = {
      to: user.email,
      subject: 'Recuperação de Senha - Vendeu Online',
      template: 'password-reset',
      data: {
        userName: user.name,
        resetUrl: resetUrl,
        expiresIn: '1 hora'
      }
    };

    // Aqui você integraria com seu provedor de email (SendGrid, Mailgun, etc.)
    console.log('Email de recuperação seria enviado:', emailData);

    // Simular envio de email
    try {
      // await sendEmail(emailData);
      console.info(`Token de reset gerado para ${email}: ${resetToken}`);
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      return NextResponse.json({ 
        error: 'Erro ao enviar email de recuperação' 
      }, { status: 500 });
    }

    // Log do evento
    await supabase
      .from('security_events')
      .insert({
        event_type: 'PASSWORD_RESET_REQUEST',
        user_id: user.id,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          email: user.email,
          user_type: user.type
        }
      });

    return NextResponse.json({
      success: true,
      message: 'Um link de recuperação foi enviado para seu email.'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Email inválido', 
        details: error.errors 
      }, { status: 400 });
    }

    console.error('Erro na recuperação de senha:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// GET endpoint para validar token de reset
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ 
        error: 'Token é obrigatório' 
      }, { status: 400 });
    }

    // Criar cliente Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verificar se token existe e está válido
    const { data: resetData, error } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at, used')
      .eq('token', token)
      .single();

    if (error || !resetData) {
      return NextResponse.json({ 
        valid: false,
        error: 'Token inválido' 
      }, { status: 400 });
    }

    if (resetData.used) {
      return NextResponse.json({ 
        valid: false,
        error: 'Token já foi utilizado' 
      }, { status: 400 });
    }

    if (new Date(resetData.expires_at) < new Date()) {
      return NextResponse.json({ 
        valid: false,
        error: 'Token expirado' 
      }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      userId: resetData.user_id
    });

  } catch (error) {
    console.error('Erro na validação do token:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}