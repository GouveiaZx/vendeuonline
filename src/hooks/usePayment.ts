import { useState, useCallback } from 'react';
import { useOrderStore } from '@/store/orderStore';
import { toast } from 'sonner';
import { formatters } from '@/utils/formatters';
import { CreatePaymentResponse, PaymentStatusResponse, PaymentInfo } from '@/types';

export interface PaymentData {
  planId: string;
  paymentMethod: 'pix' | 'credit_card';
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
    phone: string;
    mobilePhone?: string;
  };
  installmentCount?: number;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  subscriptionId?: string;
  pixCode?: string;
  pixQrCode?: string;
  paymentUrl?: string;
  externalReference?: string;
  error?: string;
}

export const usePayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const { updateOrderStatus } = useOrderStore();

  const processPayment = useCallback(async (data: PaymentData): Promise<PaymentResult> => {
    setIsProcessing(true);
    setPaymentResult(null);

    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = (await res.json()) as CreatePaymentResponse;

      if (!res.ok || 'error' in json) {
        const errorMsg = 'error' in json ? json.error : 'Erro ao criar pagamento';
        toast.error(errorMsg);
        const result: PaymentResult = { success: false, error: errorMsg };
        setPaymentResult(result);
        return result;
      }

      const success = json;
      const result: PaymentResult = {
        success: true,
        paymentId: success.payment_id,
        subscriptionId: success.subscription_id,
        pixCode: success.pix_code,
        pixQrCode: success.pix_qr_code,
        paymentUrl: success.payment_url,
        externalReference: success.external_reference,
      };

      setPaymentResult(result);

      // Atualizar status do pedido (quando houver) - mantemos compatibilidade
      if (success.payment_id && success.external_reference) {
        // Heurística simples: pedidos externos são tratados como pendentes até confirmação
        updateOrderStatus(success.external_reference, 'PENDING');
      }

      toast.success('Pagamento criado com sucesso');
      return result;
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar pagamento';
      toast.error(errorMessage);
      const result: PaymentResult = { success: false, error: errorMessage };
      setPaymentResult(result);
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [updateOrderStatus]);

  const checkPaymentStatus = useCallback(async (params: { subscription_id?: string; payment_id?: string; }): Promise<PaymentStatusResponse | null> => {
    try {
      const search = new URLSearchParams();
      if (params.subscription_id) search.set('subscription_id', params.subscription_id);
      if (params.payment_id) search.set('payment_id', params.payment_id);

      const res = await fetch(`/api/payments/status?${search.toString()}`);
      const json = (await res.json()) as PaymentStatusResponse | { error: string };

      if (!res.ok || 'error' in json) {
        const msg = 'error' in json ? json.error : 'Erro ao buscar status do pagamento';
        toast.error(msg);
        return null;
      }

      return json as PaymentStatusResponse;
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      toast.error('Erro ao verificar status do pagamento');
      return null;
    }
  }, []);

  // Para PIX, o QR Code já vem no create (pix_qr_code/pix_code). Mantemos função para compatibilidade.
  const getPixQrCode = useCallback(async (_paymentId: string) => {
    if (paymentResult?.pixQrCode || paymentResult?.pixCode) {
      return { encodedImage: paymentResult.pixQrCode ?? '', payload: paymentResult.pixCode ?? '' };
    }
    return null;
  }, [paymentResult]);



  const clearPaymentResult = useCallback(() => {
    setPaymentResult(null);
  }, []);

  return {
    isProcessing,
    paymentResult,
    processPayment,
    checkPaymentStatus,
    getPixQrCode,
    clearPaymentResult,
  };
};

export default usePayment;