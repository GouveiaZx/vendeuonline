import { NextRequest, NextResponse } from '@/types/api';
import { authMiddleware } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { getPaymentStatus } from '@/lib/asaas';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscription_id');
    const paymentId = searchParams.get('payment_id');
    const userId = authResult.user.id;

    if (!subscriptionId && !paymentId) {
      return NextResponse.json(
        { error: 'subscription_id ou payment_id é obrigatório' },
        { status: 400 }
      );
    }

    let subscription;

    if (subscriptionId) {
      // Buscar assinatura por ID
      subscription = await prisma.subscription.findFirst({
        where: {
          id: subscriptionId,
          userId: userId
        },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              features: true
            }
          }
        }
      });

      if (!subscription) {
        return NextResponse.json(
          { error: 'Assinatura não encontrada' },
          { status: 404 }
        );
      }
    } else if (paymentId) {
      // Buscar assinatura por payment_id (não disponível no modelo atual)
      // Como o modelo Subscription não tem campo paymentId, vamos buscar por userId
      subscription = await prisma.subscription.findFirst({
        where: {
          userId: userId
        },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              features: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!subscription) {
        return NextResponse.json(
          { error: 'Assinatura não encontrada' },
          { status: 404 }
        );
      }
    }

    // Se há payment_id, buscar informações atualizadas do Asaas
    let paymentInfo = null;
    if (paymentId) {
      try {
        paymentInfo = await getPaymentStatus(paymentId);
      } catch (error) {
        console.error('Erro ao buscar pagamento no Asaas:', error);
      }
    }

    // Verificar se o status precisa ser atualizado
    if (paymentInfo && paymentInfo.status) {
      let newStatus = subscription.status;
      
      switch (paymentInfo.status) {
        case 'RECEIVED':
        case 'CONFIRMED':
          if (subscription.status === 'PENDING') {
            newStatus = 'ACTIVE';
          }
          break;
        case 'OVERDUE':
        case 'REFUNDED':
          if (subscription.status === 'PENDING') {
            newStatus = 'CANCELLED';
          }
          break;
      }

      // Atualizar status se necessário
      if (newStatus !== subscription.status) {
        try {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: newStatus as any,
              updatedAt: new Date()
            }
          });
          subscription.status = newStatus as any;
        } catch (updateError) {
          console.error('Erro ao atualizar assinatura:', updateError);
        }
      }
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plans,
        expires_at: subscription.expires_at,
        created_at: subscription.created_at,
        updated_at: subscription.updated_at
      },
      payment: paymentInfo ? {
        id: paymentInfo.id,
        status: paymentInfo.status,
        billing_type: paymentInfo.billingType,
        value: paymentInfo.value,
        net_value: paymentInfo.netValue,
        date_created: paymentInfo.dateCreated,
        due_date: paymentInfo.dueDate,
        payment_date: paymentInfo.paymentDate,
        invoice_url: paymentInfo.invoiceUrl
      } : null
    });

  } catch (error) {
    console.error('Erro na API de status de pagamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}