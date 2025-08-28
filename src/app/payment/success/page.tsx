'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { formatters } from '@/utils/formatters';

interface PaymentStatus {
  subscription: {
    id: string;
    status: string;
    plan: {
      name: string;
      price: number;
    };
    expires_at: string;
  };
  payment: {
    id: string;
    status: string;
    transaction_amount: number;
  } | null;
}

const PaymentSuccessContent: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSearchParams = new URLSearchParams(searchParams.toString());
  
  const paymentId = urlSearchParams.get('payment_id');
  const externalReference = urlSearchParams.get('external_reference');

  useEffect(() => {
    if (paymentId) {
      checkPaymentStatus();
    } else {
      setLoading(false);
    }
  }, [paymentId]);

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/payments/status?payment_id=${paymentId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPaymentStatus(data);
        
        if (data.subscription.status === 'active') {
          toast.success('Pagamento aprovado! Seu plano foi ativado.');
        }
      } else {
        toast.error('Erro ao verificar status do pagamento');
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      toast.error('Erro ao verificar status do pagamento');
    } finally {
      setLoading(false);
    }
  };

  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Verificando status do pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">
            Pagamento Aprovado!
          </CardTitle>
          <CardDescription>
            Seu plano foi ativado com sucesso
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {paymentStatus && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold text-green-800">
                  Plano: {paymentStatus.subscription.plan.name}
                </h3>
                <p className="text-sm text-green-700">
                  Valor: {formatters.formatPrice(paymentStatus.subscription.plan.price)}
                </p>
                <p className="text-sm text-green-700">
                  VÃ¡lido atÃ©: {formatters.formatDate(new Date(paymentStatus.subscription.expires_at))}
                </p>
              </div>
              
              {paymentStatus.payment && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium text-gray-800">Detalhes do Pagamento</h4>
                  <p className="text-sm text-gray-600">
                    ID: {paymentStatus.payment.id}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: {paymentStatus.payment.status}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/seller/dashboard')}
              className="w-full"
              size="lg"
            >
              Ir para Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => router.push('/pricing')}
              className="w-full"
            >
              Ver Outros Planos
            </Button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Obrigado por escolher nossos serviÃ§os!</p>
            <p>Em caso de dÃºvidas, entre em contato conosco.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PaymentSuccessPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando status do pagamento...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
};

export default PaymentSuccessPage;

