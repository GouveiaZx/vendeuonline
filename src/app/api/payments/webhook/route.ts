import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStatus, validateAsaasWebhook } from '@/lib/asaas';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Forçar runtime Node.js para suporte a crypto
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Ler corpo bruto para validação de assinatura
    const rawBody = await request.text();

    // Validar assinatura do webhook (obrigatória para segurança)
    const signatureHeader =
      request.headers.get('x-asaas-signature') ||
      request.headers.get('x-asaas-signature-256') ||
      request.headers.get('x-hub-signature-256') ||
      request.headers.get('x-signature-sha256') ||
      request.headers.get('x-signature');

    if (!signatureHeader) {
      console.error('Webhook rejeitado: assinatura ausente');
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
    }

    if (!validateAsaasWebhook(rawBody, signatureHeader)) {
      console.error('Webhook rejeitado: assinatura inválida');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    // Parse do JSON após validação
    let body: any;
    try {
      body = JSON.parse(rawBody || '{}');
    } catch (e) {
      console.error('Webhook rejeitado: JSON inválido');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { event, payment } = body;

    // Processar apenas eventos de pagamento
    if (!event || !payment) {
      return NextResponse.json({ received: true });
    }

    const paymentId = payment.id;
    if (!paymentId) {
      console.error('Webhook rejeitado: Payment ID ausente');
      return NextResponse.json({ error: 'Payment ID not found' }, { status: 400 });
    }

    // ===== IMPLEMENTAÇÃO DE IDEMPOTÊNCIA =====
    // Gerar chave de idempotência única baseada no evento
    const idempotencyKey = `webhook_${event}_${paymentId}_${body.dateCreated || Date.now()}`;
    
    // Verificar se já processamos este evento
    const { data: existingWebhook } = await supabase
      .from('webhook_events')
      .select('id, status')
      .eq('idempotency_key', idempotencyKey)
      .single();
    
    if (existingWebhook) {
      console.log(`Webhook duplicado ignorado: ${idempotencyKey}, status: ${existingWebhook.status}`);
      return NextResponse.json({ 
        received: true, 
        message: 'Already processed',
        status: existingWebhook.status 
      });
    }
    
    // Registrar o evento como processando
    await supabase
      .from('webhook_events')
      .insert({
        idempotency_key: idempotencyKey,
        event_type: event,
        payment_id: paymentId,
        status: 'PROCESSING',
        created_at: new Date().toISOString()
      });

    // Buscar informações do pagamento no Asaas
    const paymentInfo = await getPaymentStatus(paymentId);
    if (!paymentInfo) {
      // Marcar webhook como falhou
      await supabase
        .from('webhook_events')
        .update({
          status: 'FAILED',
          error_message: 'Payment not found in gateway',
          processed_at: new Date().toISOString()
        })
        .eq('idempotency_key', idempotencyKey);
      
      console.error(`Payment não encontrado no gateway: ${paymentId}`);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const externalReference = paymentInfo.externalReference;
    if (!externalReference || !externalReference.startsWith('subscription_')) {
      return NextResponse.json({ received: true });
    }

    // Extrair informações da referência externa
    const [, userId, planId] = externalReference.split('_');
    
    // Buscar a assinatura correspondente
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_id', planId)
      .eq('status', 'PENDING')
      .single();

    if (!subscription) {
      console.error('Assinatura não encontrada');
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Atualizar status da assinatura baseado no status do pagamento
    let newStatus = 'PENDING';
    let shouldUpdateUserPlan = false;

    switch (paymentInfo.status) {
      case 'RECEIVED':
      case 'CONFIRMED':
        newStatus = 'ACTIVE';
        shouldUpdateUserPlan = true;
        break;
      case 'OVERDUE':
      case 'REFUNDED':
        newStatus = 'CANCELLED';
        break;
      case 'PENDING':
        newStatus = 'PENDING';
        break;
      default:
        newStatus = 'PENDING';
    }

    // ===== PROCESSAMENTO SEQUENCIAL (SUPABASE) =====
    try {
      // Atualizar assinatura
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          payment_id: paymentId
        })
        .eq('id', subscription.id);

      if (subscriptionError) {
        throw new Error(`Erro ao atualizar assinatura: ${subscriptionError.message}`);
      }

      // Se pagamento aprovado, atualizar plano do usuário
      if (shouldUpdateUserPlan) {
        // Buscar informações do plano
        const { data: plan } = await supabase
          .from('plans')
          .select('slug')
          .eq('id', planId)
          .single();

        if (plan) {
          // Atualizar plano do vendedor
          const { error: sellerError } = await supabase
            .from('sellers')
            .update({
                plan: plan.slug,
              plan_updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

          if (sellerError) {
            throw new Error(`Erro ao atualizar plano do vendedor: ${sellerError.message}`);
          }

          // Cancelar outras assinaturas ativas
          const { error: cancelError } = await supabase
            .from('subscriptions')
            .update({
              status: 'CANCELLED',
              updated_at: new Date().toISOString(),
              cancelled_reason: 'New subscription activated'
            })
            .eq('user_id', userId)
            .eq('status', 'ACTIVE')
            .neq('id', subscription.id);

          if (cancelError) {
            console.warn('Erro ao cancelar assinaturas antigas:', cancelError.message);
          }
        }
      }

      // Marcar webhook como processado com sucesso
      const { error: webhookUpdateError } = await supabase
        .from('webhook_events')
        .update({
          status: 'COMPLETED',
          processed_at: new Date().toISOString()
        })
        .eq('idempotency_key', idempotencyKey);

      if (webhookUpdateError) {
        console.warn('Erro ao marcar webhook como completo:', webhookUpdateError.message);
      }

      console.log(`Webhook processado com sucesso: ${idempotencyKey}`);
      
    } catch (updateError) {
      // Marcar webhook como falhou
      await supabase
        .from('webhook_events')
        .update({
          status: 'FAILED',
          error_message: (updateError as Error).message,
          processed_at: new Date().toISOString()
        })
        .eq('idempotency_key', idempotencyKey);
      
      console.error('Erro ao processar webhook:', updateError);
      return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
    }

    // Webhook processado com sucesso
    return NextResponse.json({ 
      received: true, 
      subscription_id: subscription.id,
      status: newStatus,
      processed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro no webhook de pagamentos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Permitir apenas POST
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}