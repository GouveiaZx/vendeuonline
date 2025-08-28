'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Clock, RefreshCw, Copy, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  };
  payment: {
    id: string;
    status: string;
    payment_method_id: string;
    transaction_amount: number;
    point_of_interaction?: {
      transaction_data?: {
        qr_code?: string;
        qr_code_base64?: string;
        ticket_url?: string;
      };
    };
  } | null;
}

const PaymentPendingContent: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [autoCheck, setAutoCheck] = useState(true);
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

  // Auto-check a cada 10 segundos
  useEffect(() => {
    if (!autoCheck || !paymentId) return;

    const interval = setInterval(() => {
      checkPaymentStatus(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [autoCheck, paymentId]);

  const checkPaymentStatus = async (silent = false) => {
    if (!silent) setChecking(true);
    
    try {
      const response = await fetch(`/api/payments/status?payment_id=${paymentId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPaymentStatus(data);
        
        // Se o pagamento foi aprovado, redirecionar para sucesso
        if (data.subscription.status === 'active' || data.payment?.status === 'approved') {
          setAutoCheck(false);
          toast.success('Pagamento aprovado!');
          router.push(`/payment/success?payment_id=${paymentId}`);
          return;
        }
        
        // Se foi rejeitado, redirecionar para falha
        if (data.payment?.status === 'rejected' || data.payment?.status === 'cancelled') {
          setAutoCheck(false);
          router.push(`/payment/failure?payment_id=${paymentId}&status=${data.payment.status}`);
          return;
        }
      } else {
        if (!silent) {
          toast.error('Erro ao verificar status do pagamento');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      if (!silent) {
        toast.error('Erro ao verificar status do pagamento');
      }
    } finally {
      setLoading(false);
      if (!silent) setChecking(false);
    }
  };

  const copyPixCode = () => {
    if (paymentStatus?.payment?.point_of_interaction?.transaction_data?.qr_code) {
      navigator.clipboard.writeText(paymentStatus.payment.point_of_interaction.transaction_data.qr_code);
      toast.success('CÃ³digo PIX copiado!');
    }
  };

  

  const getPaymentMethodText = (methodId: string) => {
    switch (methodId) {
      case 'pix':
        return 'PIX';
      case 'bolbradesco':
      case 'boleto':
        return 'Boleto BancÃ¡rio';
      default:
        return methodId;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Clock className="h-8 w-8 animate-pulse mx-auto text-orange-500" />
          <p className="text-muted-foreground">Verificando status do pagamento...</p>
        </div>
      </div>
    );
  }

  const isPix = paymentStatus?.payment?.payment_method_id === 'pix';
  const isBoleto = paymentStatus?.payment?.payment_method_id?.includes('boleto') || 
                   paymentStatus?.payment?.payment_method_id?.includes('bol');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Clock className="h-16 w-16 text-orange-500 animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold text-orange-700">
            Pagamento Pendente
          </CardTitle>
          <CardDescription>
            {isPix ? 'Aguardando confirmaÃ§Ã£o do PIX' : 
             isBoleto ? 'Aguardando pagamento do boleto' : 
             'Aguardando confirmaÃ§Ã£o do pagamento'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {paymentStatus && (
            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold text-orange-800">
                  Plano: {paymentStatus.subscription.plan.name}
                </h3>
                <p className="text-sm text-orange-700">
                  Valor: {formatters.formatPrice(paymentStatus.subscription.plan.price)}
                </p>
                {paymentStatus.payment && (
                  <p className="text-sm text-orange-700">
                    MÃ©todo: {getPaymentMethodText(paymentStatus.payment.payment_method_id)}
                  </p>
                )}
              </div>
              
              {/* PIX QR Code */}
              {isPix && paymentStatus.payment?.point_of_interaction?.transaction_data && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium text-blue-800">Pague com PIX</h4>
                  
                  {paymentStatus.payment.point_of_interaction.transaction_data.qr_code_base64 && (
                    <div className="text-center">
                      <img 
                        src={`data:image/png;base64,${paymentStatus.payment.point_of_interaction.transaction_data.qr_code_base64}`}
                        alt="QR Code PIX"
                        className="mx-auto max-w-48 h-auto"
                      />
                    </div>
                  )}
                  
                  {paymentStatus.payment.point_of_interaction.transaction_data.qr_code && (
                    <div className="space-y-2">
                      <p className="text-sm text-blue-700">Ou copie o cÃ³digo PIX:</p>
                      <div className="flex gap-2">
                        <code className="flex-1 p-2 bg-white rounded text-xs break-all">
                          {paymentStatus.payment.point_of_interaction.transaction_data.qr_code}
                        </code>
                        <Button size="sm" onClick={copyPixCode}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Boleto */}
              {isBoleto && paymentStatus.payment?.point_of_interaction?.transaction_data?.ticket_url && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium text-blue-800">Boleto BancÃ¡rio</h4>
                  <Button 
                    onClick={() => window.open(paymentStatus.payment?.point_of_interaction?.transaction_data?.ticket_url, '_blank')}
                    className="w-full"
                  >
                    Visualizar Boleto
                  </Button>
                  <p className="text-sm text-blue-700">
                    O boleto tem vencimento em 3 dias Ãºteis.
                  </p>
                </div>
              )}
            </div>
          )}
          
          <Alert className="border-orange-200 bg-orange-50">
            <AlertDescription className="text-orange-800">
              {isPix ? 'ApÃ³s realizar o PIX, a confirmaÃ§Ã£o Ã© automÃ¡tica e instantÃ¢nea.' :
               isBoleto ? 'ApÃ³s o pagamento do boleto, a confirmaÃ§Ã£o pode levar atÃ© 2 dias Ãºteis.' :
               'Estamos aguardando a confirmaÃ§Ã£o do seu pagamento.'}
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <Button 
              onClick={() => checkPaymentStatus()}
              disabled={checking}
              className="w-full"
              variant="outline"
            >
              {checking ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar Status
                </>
              )}
            </Button>
            
            <Button 
              variant="ghost"
              onClick={() => router.push('/pricing')}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Planos
            </Button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Esta pÃ¡gina atualiza automaticamente.</p>
            <p>VocÃª serÃ¡ redirecionado quando o pagamento for confirmado.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PaymentPendingPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando status do pagamento...</p>
        </div>
      </div>
    }>
      <PaymentPendingContent />
    </Suspense>
  );
};

export default PaymentPendingPage;

