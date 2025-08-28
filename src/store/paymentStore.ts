import { create } from 'zustand';
import { apiRequest } from '@/lib/api';
import {
  createCustomer,
  createPixPayment,
  createCreditCardPayment,
  getPaymentStatus as getAsaasPayment,
  AsaasCustomer,
  AsaasPaymentResponse
} from '@/lib/asaas';
import { toast } from 'sonner';

export interface PaymentMethod {
  id: string;
  type: 'pix' | 'credit_card' | 'debit_card' | 'boleto';
  name: string;
  icon: string;
  enabled: boolean;
  processingTime: string;
  fee?: number;
}

export interface PaymentData {
  method: PaymentMethod;
  amount: number;
  installments?: number;
  cardData?: {
    number: string;
    holderName: string;
    expiryDate: string;
    cvv: string;
    cpf: string;
  };
  pixData?: {
    cpf: string;
    email: string;
  };
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'cancelled';
  pixCode?: string;
  pixQrCode?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface PaymentStore {
  payments: Payment[];
  currentPayment: Payment | null;
  isProcessing: boolean;
  loading: boolean;
  error: string | null;
  
  // Payment methods
  paymentMethods: PaymentMethod[];
  
  // Actions
  fetchPaymentMethods: () => Promise<void>;
  createPayment: (orderId: string, paymentData: PaymentData) => Promise<Payment>;
  processPayment: (paymentId: string) => Promise<boolean>;
  getPayment: (paymentId: string) => Payment | null;
  getPaymentsByOrder: (orderId: string) => Payment[];
  getPaymentStatus: (paymentId: string) => Promise<void>;
  updatePaymentStatus: (paymentId: string, status: Payment['status']) => void;
  generatePixCode: (amount: number) => string;
  generatePixQrCode: (pixCode: string) => string;
  clearError: () => void;
  setCurrentPayment: (payment: Payment | null) => void;
}



export const usePaymentStore = create<PaymentStore>((set, get) => ({
  payments: [],
  currentPayment: null,
  isProcessing: false,
  loading: false,
  error: null,
  paymentMethods: [],

  fetchPaymentMethods: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest('/api/payment/methods');
      set({ paymentMethods: response.data || [], loading: false });
    } catch (error: any) {
      console.error('Erro ao buscar métodos de pagamento:', error);
      set({ 
        paymentMethods: [], 
        loading: false, 
        error: 'Erro ao carregar métodos de pagamento' 
      });
    }
  },

  createPayment: async (orderId: string, paymentData: PaymentData) => {
    set({ isProcessing: true, error: null });
    
    try {
      // Primeiro, criar ou obter cliente no Asaas
      let customerId: string;
      
      if (paymentData.method.type === 'pix' && paymentData.pixData) {
        const customerData: AsaasCustomer = {
          name: 'Cliente Marketplace',
          email: paymentData.pixData.email,
          cpfCnpj: paymentData.pixData.cpf,
          externalReference: orderId
        };
        
        const customer = await createCustomer(customerData);
        customerId = customer.id!;
      } else if (paymentData.cardData) {
        const customerData: AsaasCustomer = {
          name: paymentData.cardData.holderName,
          email: 'cliente@marketplace.com', // Seria obtido do contexto do usuário
          cpfCnpj: paymentData.cardData.cpf,
          externalReference: orderId
        };
        
        const customer = await createCustomer(customerData);
        customerId = customer.id!;
      } else {
        throw new Error('Dados de pagamento inválidos');
      }

      let asaasPayment: AsaasPaymentResponse | null;

      // Criar pagamento baseado no método
      if (paymentData.method.type === 'pix') {
        asaasPayment = await createPixPayment({
          customerId,
          amount: paymentData.amount,
          description: `Pedido #${orderId} - Marketplace`,
          externalReference: orderId
        });
      } else if (paymentData.method.type === 'credit_card' && paymentData.cardData) {
        asaasPayment = await createCreditCardPayment({
          customerId,
          amount: paymentData.amount,
          description: `Pedido #${orderId} - Marketplace`,
          externalReference: orderId,
          installmentCount: paymentData.installments || 1,
          creditCard: {
            holderName: paymentData.cardData.holderName,
            number: paymentData.cardData.number,
            expiryMonth: paymentData.cardData.expiryDate.split('/')[0],
            expiryYear: paymentData.cardData.expiryDate.split('/')[1],
            ccv: paymentData.cardData.cvv
          },
          creditCardHolderInfo: {
            name: paymentData.cardData.holderName,
            email: 'cliente@marketplace.com',
            cpfCnpj: paymentData.cardData.cpf,
            postalCode: '99700000',
            addressNumber: '123',
            phone: '5454999999999'
          }
        });
      } else {
        throw new Error('Método de pagamento não suportado');
      }

      if (!asaasPayment) {
        throw new Error('Falha ao criar pagamento no Asaas');
      }

      // Mapear status do Asaas para status interno
      const mapAsaasStatus = (status: string): Payment['status'] => {
         switch (status) {
           case 'PENDING':
             return 'pending';
           case 'RECEIVED':
           case 'CONFIRMED':
             return 'approved';
           case 'OVERDUE':
           case 'REFUNDED':
             return 'rejected';
           default:
             return 'pending';
         }
       };

      const payment: Payment = {
        id: asaasPayment.id,
        orderId,
        amount: paymentData.amount,
        method: paymentData.method,
        status: mapAsaasStatus(asaasPayment.status),
        createdAt: new Date(asaasPayment.dateCreated),
        updatedAt: new Date(asaasPayment.dateCreated),
        transactionId: asaasPayment.id,
        pixCode: asaasPayment.pixTransaction?.payload,
        pixQrCode: asaasPayment.pixTransaction?.encodedImage ? `data:image/png;base64,${asaasPayment.pixTransaction.encodedImage}` : undefined,
        expiresAt: asaasPayment.pixTransaction?.expirationDate ? new Date(asaasPayment.pixTransaction.expirationDate) : undefined
      };

      set(state => ({
        payments: [...state.payments, payment],
        currentPayment: payment,
        isProcessing: false
      }));

      return payment;
    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
      set({ 
        error: error.message || 'Erro ao criar pagamento', 
        isProcessing: false 
      });
      throw error;
    }
  },

  processPayment: async (paymentId: string) => {
    set({ isProcessing: true, error: null });
    
    try {
      const payment = get().getPayment(paymentId);
      if (!payment) {
        throw new Error('Pagamento não encontrado');
      }

      // Update status to processing
      get().updatePaymentStatus(paymentId, 'processing');

      const response = await apiRequest(`/api/payment/${paymentId}/process`, {
        method: 'POST'
      });

      const newStatus = response.data.status;
      get().updatePaymentStatus(paymentId, newStatus);
      set({ isProcessing: false });
      return newStatus === 'approved';
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      set({ 
        error: 'Erro ao processar pagamento. Tente novamente.',
        isProcessing: false 
      });
      return false;
    }
  },

  getPayment: (paymentId: string) => {
    return get().payments.find(p => p.id === paymentId) || null;
  },

  getPaymentsByOrder: (orderId: string) => {
    return get().payments.filter(p => p.orderId === orderId);
  },

  getPaymentStatus: async (paymentId: string) => {
    set({ loading: true, error: null });
    try {
      const asaasPayment = await getAsaasPayment(paymentId);
      
      if (!asaasPayment) {
        throw new Error('Pagamento não encontrado');
      }

      // Mapear status do Asaas para status interno
      const mapAsaasStatus = (status: string): Payment['status'] => {
         switch (status) {
           case 'PENDING':
             return 'pending';
           case 'RECEIVED':
           case 'CONFIRMED':
             return 'approved';
           case 'OVERDUE':
           case 'REFUNDED':
             return 'rejected';
           default:
             return 'pending';
         }
       };
      
      // Atualizar o pagamento com o status mais recente
      const updatedPayment = {
        status: mapAsaasStatus(asaasPayment.status),
        updatedAt: new Date(),
        pixCode: asaasPayment.pixTransaction?.payload,
        pixQrCode: asaasPayment.pixTransaction?.encodedImage ? `data:image/png;base64,${asaasPayment.pixTransaction.encodedImage}` : undefined,
        expiresAt: asaasPayment.pixTransaction?.expirationDate ? new Date(asaasPayment.pixTransaction.expirationDate) : undefined
      };
      
      set(state => ({
        payments: state.payments.map(p => 
          p.id === paymentId ? { ...p, ...updatedPayment } : p
        ),
        currentPayment: state.currentPayment?.id === paymentId 
          ? { ...state.currentPayment, ...updatedPayment }
          : state.currentPayment,
        loading: false
      }));
    } catch (error: any) {
      console.error('Erro ao buscar status do pagamento:', error);
      set({ 
        loading: false,
        error: 'Erro ao buscar status do pagamento'
      });
    }
  },

  updatePaymentStatus: (paymentId: string, status: Payment['status']) => {
    const state = get();
    const currentPayment = state.payments.find(p => p.id === paymentId);
    const previousStatus = currentPayment?.status;
    
    set(state => ({
      payments: state.payments.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status, updatedAt: new Date() }
          : payment
      ),
      currentPayment: state.currentPayment?.id === paymentId 
        ? { ...state.currentPayment, status, updatedAt: new Date() }
        : state.currentPayment
    }));
    
    // Notificar mudanças de status importantes
    if (previousStatus !== status) {
      switch (status) {
        case 'approved':
          toast.success('Pagamento Aprovado!', {
            description: 'Seu pagamento foi processado com sucesso.',
            duration: 5000
          });
          break;
        case 'rejected':
          toast.error('Pagamento Rejeitado', {
            description: 'Houve um problema com seu pagamento. Tente novamente.',
            duration: 6000
          });
          break;
        case 'processing':
          toast.info('Processando Pagamento', {
            description: 'Seu pagamento está sendo processado...',
            duration: 4000
          });
          break;
      }
    }
  },

  generatePixCode: (amount: number) => {
    // Generate a mock PIX code
    const timestamp = Date.now().toString();
    const randomPart = Math.random().toString(36).substr(2, 10).toUpperCase();
    return `00020126580014BR.GOV.BCB.PIX0136${timestamp}${randomPart}5204000053039865802BR5925MARKETPLACE MULTIVENDEDOR6009SAO PAULO62070503***6304${amount.toFixed(2).replace('.', '')}`;
  },

  generatePixQrCode: (pixCode: string) => {
    // In a real implementation, this would generate an actual QR code
    // For now, we'll return a placeholder URL
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}`;
  },

  clearError: () => {
    set({ error: null });
  },

  setCurrentPayment: (payment: Payment | null) => {
    set({ currentPayment: payment });
  }
}));

// Hook for easier usage
export const usePayment = () => {
  const store = usePaymentStore();
  
  return {
    ...store,
    isPixPayment: store.currentPayment?.method.type === 'pix',
    isCardPayment: ['credit_card', 'debit_card'].includes(store.currentPayment?.method.type || ''),
    isPending: store.currentPayment?.status === 'pending',
    isProcessing: store.currentPayment?.status === 'processing',
    isApproved: store.currentPayment?.status === 'approved',
    isRejected: store.currentPayment?.status === 'rejected'
  };
};