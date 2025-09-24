import { create } from "zustand";
import { apiRequest } from "@/lib/api";
import { logger } from "@/lib/logger";


export interface PaymentMethod {
  id: string;
  type: "pix" | "credit_card" | "debit_card" | "boleto";
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
  status: "pending" | "processing" | "approved" | "rejected" | "cancelled";
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
  updatePaymentStatus: (paymentId: string, status: Payment["status"]) => void;
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
      const response = await apiRequest("/api/payment/methods");
      set({ paymentMethods: response.data || [], loading: false });
    } catch (error: any) {
      logger.error("Erro ao buscar métodos de pagamento:", error);
      set({
        paymentMethods: [],
        loading: false,
        error: "Erro ao carregar métodos de pagamento",
      });
    }
  },

  createPayment: async (orderId: string, paymentData: PaymentData) => {
    set({ isProcessing: true, error: null });

    try {
      const response = await apiRequest("/api/payment/create", {
        method: "POST",
        body: JSON.stringify({
          orderId,
          paymentMethod: paymentData.method.type.toUpperCase(),
          amount: paymentData.amount,
          installments: paymentData.installments,
          cardData: paymentData.cardData,
          pixData: paymentData.pixData,
        }),
      });

      const payment: Payment = {
        id: response.data.id,
        orderId,
        amount: paymentData.amount,
        method: paymentData.method,
        status: response.data.status,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt),
        transactionId: response.data.transactionId,
        pixCode: response.data.pixCode,
        pixQrCode: response.data.pixQrCode,
        expiresAt: response.data.expiresAt ? new Date(response.data.expiresAt) : undefined,
      };

      set((state) => ({
        payments: [...state.payments, payment],
        currentPayment: payment,
        isProcessing: false,
      }));

      return payment;
    } catch (error: any) {
      logger.error("Erro ao criar pagamento:", error);
      set({
        error: "Erro ao criar pagamento",
        isProcessing: false,
      });
      throw error;
    }
  },

  processPayment: async (paymentId: string) => {
    set({ isProcessing: true, error: null });

    try {
      const payment = get().getPayment(paymentId);
      if (!payment) {
        throw new Error("Pagamento não encontrado");
      }

      // Update status to processing
      get().updatePaymentStatus(paymentId, "processing");

      const response = await apiRequest(`/api/payment/${paymentId}/process`, {
        method: "POST",
      });

      const newStatus = response.data.status;
      get().updatePaymentStatus(paymentId, newStatus);
      set({ isProcessing: false });
      return newStatus === "approved";
    } catch (error: any) {
      logger.error("Erro ao processar pagamento:", error);
      set({
        error: "Erro ao processar pagamento. Tente novamente.",
        isProcessing: false,
      });
      return false;
    }
  },

  getPayment: (paymentId: string) => {
    return get().payments.find((p) => p.id === paymentId) || null;
  },

  getPaymentsByOrder: (orderId: string) => {
    return get().payments.filter((p) => p.orderId === orderId);
  },

  getPaymentStatus: async (paymentId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(`/api/payment/${paymentId}/status`);

      // Atualizar o pagamento com o status mais recente
      const updatedPayment = {
        ...response.data.payment,
        updatedAt: new Date(),
      };

      set((state) => ({
        payments: state.payments.map((p) => (p.id === paymentId ? { ...p, ...updatedPayment } : p)),
        currentPayment:
          state.currentPayment?.id === paymentId
            ? { ...state.currentPayment, ...updatedPayment }
            : state.currentPayment,
        loading: false,
      }));
    } catch (error: any) {
      logger.error("Erro ao buscar status do pagamento:", error);
      set({
        loading: false,
        error: "Erro ao buscar status do pagamento",
      });
    }
  },

  updatePaymentStatus: (paymentId: string, status: Payment["status"]) => {
    set((state) => ({
      payments: state.payments.map((payment) =>
        payment.id === paymentId ? { ...payment, status, updatedAt: new Date() } : payment
      ),
      currentPayment:
        state.currentPayment?.id === paymentId
          ? { ...state.currentPayment, status, updatedAt: new Date() }
          : state.currentPayment,
    }));
  },

  generatePixCode: (amount: number) => {
    // Generate a mock PIX code
    const timestamp = Date.now().toString();
    const randomPart = Math.random().toString(36).substr(2, 10).toUpperCase();
    return `00020126580014BR.GOV.BCB.PIX0136${timestamp}${randomPart}5204000053039865802BR5925MARKETPLACE MULTIVENDEDOR6009SAO PAULO62070503***6304${amount.toFixed(2).replace(".", "")}`;
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
  },
}));

// Hook for easier usage
export const usePayment = () => {
  const store = usePaymentStore();

  return {
    ...store,
    isPixPayment: store.currentPayment?.method.type === "pix",
    isCardPayment: ["credit_card", "debit_card"].includes(store.currentPayment?.method.type || ""),
    isPending: store.currentPayment?.status === "pending",
    isProcessing: store.currentPayment?.status === "processing",
    isApproved: store.currentPayment?.status === "approved",
    isRejected: store.currentPayment?.status === "rejected",
  };
};
