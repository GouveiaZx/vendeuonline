import { useState, useCallback } from 'react';
import { asaasService, AsaasCustomer, AsaasPayment, AsaasPaymentResponse, AsaasCreditCardPayment, AsaasPixPayment } from '../services/asaasService';
import { useOrderStore } from '../store/orderStore';
import { toast } from 'sonner';

export interface PaymentData {
  customer: {
    name: string;
    email: string;
    phone?: string;
    cpfCnpj: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  payment: {
    value: number;
    description?: string;
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
    dueDate?: string;
    installmentCount?: number;
    creditCard?: {
      holderName: string;
      number: string;
      expiryMonth: string;
      expiryYear: string;
      ccv: string;
    };
  };
  orderId?: string;
}

export interface PaymentResult {
  success: boolean;
  payment?: AsaasPaymentResponse;
  customer?: AsaasCustomer;
  error?: string;
}

export const usePayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const { updateOrderStatus } = useOrderStore();

  const processPayment = useCallback(async (paymentData: PaymentData): Promise<PaymentResult> => {
    setIsProcessing(true);
    setPaymentResult(null);

    try {
      // 1. Criar ou buscar cliente
      let customer: AsaasCustomer;
      
      try {
        // Tentar buscar cliente existente pelo CPF/CNPJ
        const existingCustomers = await asaasService.listCustomers({
          cpfCnpj: paymentData.customer.cpfCnpj,
          limit: 1
        });

        if (existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0];
          // Atualizar dados do cliente se necessário
          customer = await asaasService.updateCustomer(customer.id!, paymentData.customer);
        } else {
          // Criar novo cliente
          customer = await asaasService.createCustomer(paymentData.customer);
        }
      } catch (error) {
        console.error('Erro ao gerenciar cliente:', error);
        throw new Error('Erro ao processar dados do cliente');
      }

      // 2. Criar cobrança
      let payment: AsaasPaymentResponse;
      
      const basePaymentData: AsaasPayment = {
        customer: customer.id!,
        billingType: paymentData.payment.billingType,
        value: paymentData.payment.value,
        dueDate: paymentData.payment.dueDate || asaasService.formatDate(new Date()),
        description: paymentData.payment.description || 'Compra no Marketplace',
        externalReference: paymentData.orderId,
      };

      if (paymentData.payment.billingType === 'CREDIT_CARD' && paymentData.payment.creditCard) {
        const creditCardPayment: AsaasCreditCardPayment = {
          ...basePaymentData,
          billingType: 'CREDIT_CARD',
          installmentCount: paymentData.payment.installmentCount || 1,
          creditCard: paymentData.payment.creditCard,
          creditCardHolderInfo: {
            name: paymentData.customer.name,
            email: paymentData.customer.email,
            cpfCnpj: paymentData.customer.cpfCnpj,
            postalCode: paymentData.customer.postalCode || '',
            addressNumber: paymentData.customer.addressNumber || '',
            addressComplement: paymentData.customer.complement,
            phone: paymentData.customer.phone || '',
            mobilePhone: paymentData.customer.phone,
          },
        };
        payment = await asaasService.createPayment(creditCardPayment);
      } else if (paymentData.payment.billingType === 'PIX') {
        const pixPayment: AsaasPixPayment = {
          ...basePaymentData,
          billingType: 'PIX',
        };
        payment = await asaasService.createPayment(pixPayment);
      } else {
        // Boleto
        payment = await asaasService.createPayment(basePaymentData);
      }

      // 3. Atualizar status do pedido se fornecido
      if (paymentData.orderId) {
        if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
          updateOrderStatus(paymentData.orderId, 'paid');
        } else {
          updateOrderStatus(paymentData.orderId, 'pending');
        }
      }

      const result: PaymentResult = {
        success: true,
        payment,
        customer,
      };

      setPaymentResult(result);
      toast.success('Pagamento processado com sucesso!');
      
      return result;
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar pagamento';
      
      const result: PaymentResult = {
        success: false,
        error: errorMessage,
      };

      setPaymentResult(result);
      toast.error(`Erro no pagamento: ${errorMessage}`);
      
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [updateOrderStatus]);

  const checkPaymentStatus = useCallback(async (paymentId: string): Promise<AsaasPaymentResponse | null> => {
    try {
      const payment = await asaasService.getPayment(paymentId);
      return payment;
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      toast.error('Erro ao verificar status do pagamento');
      return null;
    }
  }, []);

  const getPixQrCode = useCallback(async (paymentId: string) => {
    try {
      const qrCode = await asaasService.getPixQrCode(paymentId);
      return qrCode;
    } catch (error) {
      console.error('Erro ao obter QR Code PIX:', error);
      toast.error('Erro ao gerar QR Code PIX');
      return null;
    }
  }, []);

  const formatCurrency = useCallback((value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }, []);

  const clearPaymentResult = useCallback(() => {
    setPaymentResult(null);
  }, []);

  return {
    isProcessing,
    paymentResult,
    processPayment,
    checkPaymentStatus,
    getPixQrCode,
    formatCurrency,
    clearPaymentResult,
  };
};

export default usePayment;