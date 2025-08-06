import { NextRequest, NextResponse } from '@/types/api';
import { getPaymentStatus } from '@/lib/asaas';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, payment } = body;

    // Processar apenas eventos de pagamento
    if (!event || !payment) {
      return NextResponse.json({ received: true });
    }

    const paymentId = payment.id;
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID not found' }, { status: 400 });
    }

    // Buscar informações do pagamento no Asaas
    const paymentInfo = await getPaymentStatus(paymentId);
    if (!paymentInfo) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const externalReference = paymentInfo.externalReference;
    if (!externalReference || !externalReference.startsWith('subscription_')) {
      return NextResponse.json({ received: true });
    }

    // Extrair informações da referência externa
    const [, userId, planId] = externalReference.split('_');
    
    // Buscar a assinatura correspondente
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        planId: planId,
        status: 'PENDING'
      }
    });

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

    // Atualizar assinatura
    try {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: newStatus as any,
          updatedAt: new Date()
        }
      });
    } catch (updateError) {
      console.error('Erro ao atualizar assinatura:', updateError);
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    // Se o pagamento foi aprovado, atualizar o plano do usuário
    if (shouldUpdateUserPlan) {
      // Buscar informações do plano
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
        select: { slug: true }
      });

      if (plan) {
        // Atualizar plano do vendedor
        try {
          await prisma.seller.update({
            where: { userId: userId },
            data: {
              plan: plan.slug as any
            }
          });
        } catch (userUpdateError) {
          console.error('Erro ao atualizar plano do vendedor:', userUpdateError);
        }

        // Cancelar outras assinaturas ativas do usuário
        try {
          await prisma.subscription.updateMany({
            where: {
              userId: userId,
              status: 'ACTIVE',
              id: { not: subscription.id }
            },
            data: {
              status: 'CANCELLED',
              updatedAt: new Date()
            }
          });
        } catch (cancelError) {
          console.error('Erro ao cancelar outras assinaturas:', cancelError);
        }
      }
    }

    console.log(`Webhook processado: Pagamento ${paymentId}, Status: ${newStatus}`);
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Erro no webhook de pagamentos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Permitir apenas POST
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}