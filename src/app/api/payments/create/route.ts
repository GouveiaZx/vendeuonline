import { NextRequest, NextResponse } from '@/types/api';
import { authMiddleware } from '@/lib/middleware';
import { createPaymentSchema } from '@/lib/validation';
import { createCustomer, createPixPayment, createCreditCardPayment, AsaasCustomer } from '@/lib/asaas';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createPaymentSchema.parse(body);
    const { planId, paymentMethod } = validatedData;
    const userId = authResult.user.id;

    // Buscar informações do plano
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário já tem uma assinatura ativa
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        status: 'ACTIVE'
      }
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Usuário já possui uma assinatura ativa' },
        { status: 400 }
      );
    }

    // Criar cliente no Asaas
    const customerData: AsaasCustomer = {
      name: authResult.user.name || 'Cliente',
      email: authResult.user.email,
      cpfCnpj: '00000000000', // Em produção, coletar CPF do usuário
      externalReference: `user_${userId}`
    };

    const customer = await createCustomer(customerData);
    const externalReference = `subscription_${userId}_${planId}_${Date.now()}`;

    // Criar pagamento baseado no método
    let asaasPayment;
    if (paymentMethod === 'pix') {
      asaasPayment = await createPixPayment({
        customerId: customer.id!,
        amount: plan.price,
        description: `Plano ${plan.name} - Vendeu Online`,
        externalReference
      });
    } else if (paymentMethod === 'credit_card') {
      // Para cartão de crédito, seria necessário coletar dados do cartão
      // Por enquanto, retornamos erro
      return NextResponse.json(
        { error: 'Pagamento com cartão de crédito requer dados adicionais' },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: 'Método de pagamento não suportado' },
        { status: 400 }
      );
    }

    if (!asaasPayment) {
      return NextResponse.json(
        { error: 'Erro ao criar pagamento' },
        { status: 500 }
      );
    }

    // Criar registro de assinatura pendente
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 dias

    try {
      const subscription = await prisma.subscription.create({
        data: {
          userId: userId,
          planId: planId,
          status: 'PENDING',
          endDate: endDate
        }
      });

      return NextResponse.json({
        success: true,
        payment_id: asaasPayment.id,
        payment_url: asaasPayment.invoiceUrl,
        pix_code: asaasPayment.pixTransaction?.payload,
        pix_qr_code: asaasPayment.pixTransaction?.encodedImage,
        subscription_id: subscription.id,
        external_reference: externalReference
      });
    } catch (subscriptionError) {
      console.error('Erro ao criar assinatura:', subscriptionError);
      return NextResponse.json(
        { error: 'Erro ao criar assinatura' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro na API de pagamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}