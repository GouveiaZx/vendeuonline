import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromToken } from '@/lib/auth';
import { paymentRateLimiter, createRateLimitHeaders } from '@/lib/rateLimiting';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Verificar rate limiting
    const rateLimitResult = await paymentRateLimiter.isAllowed(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many payment attempts. Try again later.' },
        { 
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult, 5)
        }
      );
    }

    // Verificar autenticação
    const authResult = await getUserFromToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;
    const body = await request.json();
    
    const {
      orderId,
      amount,
      paymentMethod,
      installments = 1,
      customerData,
      billingAddress,
      cardData
    } = body;

    // Validar dados obrigatórios
    if (!orderId || !amount) {
      return NextResponse.json({ 
        error: 'Order ID and amount are required' 
      }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ 
        error: 'Payment method is required' 
      }, { status: 400 });
    }

    // Verificar se o pedido existe e pertence ao usuário
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, buyer_id, total, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verificar permissões
    if (user.type !== 'ADMIN' && order.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verificar se o valor corresponde ao total do pedido
    if (Math.abs(order.total - amount) > 0.01) {
      return NextResponse.json({ 
        error: 'Amount does not match order total' 
      }, { status: 400 });
    }

    // Verificar se o pedido já não foi pago
    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
      return NextResponse.json({ 
        error: 'Order cannot be paid in current status' 
      }, { status: 400 });
    }

    // Verificar se já existe um pagamento para este pedido
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('order_id', orderId)
      .in('status', ['PENDING', 'PROCESSING', 'CONFIRMED'])
      .single();

    if (existingPayment) {
      return NextResponse.json({ 
        error: 'Payment already exists for this order',
        paymentId: existingPayment.id 
      }, { status: 400 });
    }

    // Criar registro de pagamento
    const paymentData = {
      order_id: orderId,
      buyer_id: user.id,
      amount,
      payment_method: paymentMethod.toUpperCase(),
      installments: installments || 1,
      status: 'PENDING',
      gateway: 'ASAAS', // Default para Asaas
      external_id: null, // Será preenchido após criar no gateway
      customer_data: customerData || {},
      billing_address: billingAddress || {},
      card_data: cardData ? {
        // Armazenar apenas dados não sensíveis
        brand: cardData.brand,
        last_four_digits: cardData.number?.slice(-4),
        holder_name: cardData.holderName
      } : null,
      created_at: new Date().toISOString()
    };

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      // Log error apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating payment:', paymentError);
      }
      return NextResponse.json({ 
        error: 'Failed to create payment' 
      }, { status: 500 });
    }

    // Simular integração com Asaas (em produção, fazer chamada real)
    const asaasPayment = await createAsaasPayment({
      paymentId: payment.id,
      amount,
      paymentMethod,
      installments,
      customerData,
      cardData
    });

    if (!asaasPayment.success) {
      // Marcar pagamento como falhou
      await supabase
        .from('payments')
        .update({ 
          status: 'FAILED', 
          error_message: asaasPayment.error,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      return NextResponse.json({ 
        error: asaasPayment.error || 'Payment processing failed' 
      }, { status: 500 });
    }

    // Atualizar pagamento com ID externo
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        external_id: asaasPayment.paymentId,
        status: asaasPayment.status || 'PROCESSING',
        gateway_response: asaasPayment.response || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    if (updateError) {
      // Log error apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating payment:', updateError);
      }
    }

    // Se pagamento foi aprovado imediatamente, atualizar status do pedido
    if (asaasPayment.status === 'CONFIRMED') {
      await supabase
        .from('orders')
        .update({ 
          status: 'CONFIRMED',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        paymentId: payment.id,
        externalId: asaasPayment.paymentId,
        status: asaasPayment.status,
        amount,
        paymentMethod,
        installments,
        ...(asaasPayment.pixQrCode && { pixQrCode: asaasPayment.pixQrCode }),
        ...(asaasPayment.boletoUrl && { boletoUrl: asaasPayment.boletoUrl })
      },
      message: 'Payment created successfully'
    }, { status: 201 });

  } catch (error) {
    // Log error apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Payment create error:', error);
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Função para simular integração com Asaas
async function createAsaasPayment(data: {
  paymentId: string;
  amount: number;
  paymentMethod: string;
  installments: number;
  customerData: any;
  cardData?: any;
}): Promise<{
  success: boolean;
  paymentId?: string;
  status?: string;
  error?: string;
  response?: any;
  pixQrCode?: string;
  boletoUrl?: string;
}> {
  try {
    // Em produção, fazer chamada real para API do Asaas
    // Por enquanto, simular resposta baseada no método de pagamento
    
    const mockPaymentId = `asaas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    switch (data.paymentMethod.toUpperCase()) {
      case 'PIX':
        return {
          success: true,
          paymentId: mockPaymentId,
          status: 'PENDING',
          pixQrCode: `00020126580014br.gov.bcb.pix0136${mockPaymentId}520400005303986540${data.amount.toFixed(2)}5802BR6009SAO PAULO62070503***6304`,
          response: { method: 'PIX', qrCodeGenerated: true }
        };
      
      case 'BOLETO':
        return {
          success: true,
          paymentId: mockPaymentId,
          status: 'PENDING',
          boletoUrl: `https://sandbox.asaas.com/boleto/${mockPaymentId}`,
          response: { method: 'BOLETO', boletoGenerated: true }
        };
      
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        // Simular aprovação/rejeição aleatória para cartões
        const approved = Math.random() > 0.1; // 90% de aprovação
        return {
          success: approved,
          paymentId: approved ? mockPaymentId : undefined,
          status: approved ? 'CONFIRMED' : 'FAILED',
          error: approved ? undefined : 'Card declined by issuer',
          response: { 
            method: data.paymentMethod,
            installments: data.installments,
            approved,
            authorizationCode: approved ? `AUTH${Math.random().toString(36).substr(2, 6).toUpperCase()}` : undefined
          }
        };
      
      default:
        return {
          success: false,
          error: 'Unsupported payment method'
        };
    }
    
  } catch (error) {
    // Log error apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Asaas payment creation error:', error);
    }
    return {
      success: false,
      error: 'Gateway communication error'
    };
  }
}