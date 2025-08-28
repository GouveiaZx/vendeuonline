import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromToken } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await getUserFromToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const externalId = searchParams.get('externalId');
    const orderId = searchParams.get('orderId');

    // Pelo menos um dos IDs deve ser fornecido
    if (!paymentId && !externalId && !orderId) {
      return NextResponse.json({ 
        error: 'Payment ID, external ID or order ID is required' 
      }, { status: 400 });
    }

    let query = supabase
      .from('payments')
      .select(`
        id,
        order_id,
        buyer_id,
        amount,
        payment_method,
        installments,
        status,
        gateway,
        external_id,
        gateway_response,
        error_message,
        created_at,
        updated_at,
        orders (
          id,
          buyer_id,
          status,
          total
        )
      `);

    // Aplicar filtros
    if (paymentId) {
      query = query.eq('id', paymentId);
    } else if (externalId) {
      query = query.eq('external_id', externalId);
    } else if (orderId) {
      query = query.eq('order_id', orderId);
    }

    const { data: payment, error } = await query.single();

    if (error || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Verificar permissões
    const canAccess = 
      user.type === 'ADMIN' ||
      (user.type === 'BUYER' && payment.buyer_id === user.id) ||
      (user.type === 'SELLER' && (payment.orders as any)?.buyer_id === user.id); // Seller pode ver pagamentos dos seus produtos

    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Se o pagamento estiver pendente há muito tempo, verificar status no gateway
    const now = new Date();
    const updatedAt = new Date(payment.updated_at);
    const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

    let updatedPayment = payment;

    // Verificar no gateway se pendente há mais de 1 hora ou se for solicitação específica
    if (payment.status === 'PENDING' && hoursSinceUpdate > 1) {
      const gatewayStatus = await checkPaymentStatusInGateway(payment.external_id, payment.gateway);
      
      if (gatewayStatus.success && gatewayStatus.status !== payment.status) {
        // Atualizar status no banco
        const { data: updated, error: updateError } = await supabase
          .from('payments')
          .update({
            status: gatewayStatus.status,
            gateway_response: {
              ...payment.gateway_response,
              ...gatewayStatus.response
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id)
          .select()
          .single();

        if (!updateError && updated) {
          updatedPayment = updated;

          // Se pagamento foi confirmado, atualizar pedido
          if (gatewayStatus.status === 'CONFIRMED' && (payment.orders as any)?.status === 'PENDING') {
            await supabase
              .from('orders')
              .update({ 
                status: 'CONFIRMED',
                updated_at: new Date().toISOString()
              })
              .eq('id', payment.order_id);
          }
        }
      }
    }

    // Preparar resposta com informações relevantes
    const responseData = {
      paymentId: updatedPayment.id,
      orderId: updatedPayment.order_id,
      status: updatedPayment.status,
      amount: updatedPayment.amount,
      paymentMethod: updatedPayment.payment_method,
      installments: updatedPayment.installments,
      gateway: updatedPayment.gateway,
      externalId: updatedPayment.external_id,
      createdAt: updatedPayment.created_at,
      updatedAt: updatedPayment.updated_at,
      ...(updatedPayment.error_message && { errorMessage: updatedPayment.error_message })
    };

    // Adicionar informações específicas do método de pagamento se disponível
    const gatewayResponse = updatedPayment.gateway_response as any;
    if (gatewayResponse) {
      if (updatedPayment.payment_method === 'PIX' && gatewayResponse.pixQrCode) {
        responseData.pixQrCode = gatewayResponse.pixQrCode;
      }
      if (updatedPayment.payment_method === 'BOLETO' && gatewayResponse.boletoUrl) {
        responseData.boletoUrl = gatewayResponse.boletoUrl;
      }
      if (gatewayResponse.authorizationCode) {
        responseData.authorizationCode = gatewayResponse.authorizationCode;
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: responseData 
    });

  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Função para verificar status do pagamento no gateway
async function checkPaymentStatusInGateway(
  externalId: string | null, 
  gateway: string
): Promise<{
  success: boolean;
  status?: string;
  response?: any;
  error?: string;
}> {
  try {
    if (!externalId || !gateway) {
      return { success: false, error: 'Missing external ID or gateway' };
    }

    // Em produção, fazer chamada real para API do gateway
    // Por enquanto, simular verificação de status

    if (gateway === 'ASAAS') {
      return await checkAsaasPaymentStatus(externalId);
    }

    return { success: false, error: 'Unsupported gateway' };

  } catch (error) {
    console.error('Gateway status check error:', error);
    return { success: false, error: 'Gateway communication error' };
  }
}

// Simular verificação de status no Asaas
async function checkAsaasPaymentStatus(externalId: string): Promise<{
  success: boolean;
  status?: string;
  response?: any;
  error?: string;
}> {
  try {
    // Em produção, fazer chamada para API do Asaas
    // GET https://api.asaas.com/v3/payments/{externalId}
    
    // Simular resposta baseada no ID (para demonstração)
    const mockStatuses = ['PENDING', 'CONFIRMED', 'FAILED'];
    const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
    
    // Simular que pagamentos antigos tendem a ser confirmados
    const isOldPayment = Date.now() % 3 === 0; // 33% chance
    const finalStatus = isOldPayment ? 'CONFIRMED' : randomStatus;

    return {
      success: true,
      status: finalStatus,
      response: {
        externalId,
        gatewayStatus: finalStatus,
        checkedAt: new Date().toISOString(),
        mock: true // Remove em produção
      }
    };

  } catch (error) {
    console.error('Asaas status check error:', error);
    return {
      success: false,
      error: 'Asaas communication error'
    };
  }
}