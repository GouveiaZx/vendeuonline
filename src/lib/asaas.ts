import axios from 'axios';

// Configuração da API Asaas
const ASAAS_API_KEY = import.meta.env.VITE_ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjFiNWQ2OWZmLWI1NDUtNGUwMy04NDJhLTNlODBlZDU1MWEzNTo6JGFhY2hfMDIwODU0NDUtYzViZS00NTdiLTg4YzUtMjRhZjAxNjg5Y2Nl';
const ASAAS_BASE_URL = import.meta.env.VITE_ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3';

// Cliente Axios configurado para Asaas
const asaasApi = axios.create({
  baseURL: ASAAS_BASE_URL,
  headers: {
    'access_token': ASAAS_API_KEY,
    'Content-Type': 'application/json',
  },
});

// Tipos para Asaas
export interface AsaasCustomer {
  id?: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  externalReference?: string;
}

export interface AsaasPayment {
  id?: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'DEBIT_CARD';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  discount?: {
    value: number;
    dueDateLimitDays: number;
  };
  interest?: {
    value: number;
  };
  fine?: {
    value: number;
  };
  postalService?: boolean;
  split?: Array<{
    walletId: string;
    fixedValue?: number;
    percentualValue?: number;
  }>;
}

export interface AsaasPaymentResponse {
  id: string;
  dateCreated: string;
  customer: string;
  paymentLink?: string;
  value: number;
  netValue: number;
  originalValue?: number;
  interestValue?: number;
  description: string;
  billingType: string;
  pixTransaction?: {
    encodedImage: string;
    payload: string;
    expirationDate: string;
  };
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'REFUND_IN_PROGRESS' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
  dueDate: string;
  originalDueDate: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  installmentNumber?: number;
  invoiceUrl: string;
  invoiceNumber?: string;
  externalReference?: string;
  deleted: boolean;
  anticipated: boolean;
  anticipable: boolean;
}

export interface PixPaymentData {
  customerId: string;
  amount: number;
  description: string;
  externalReference?: string;
}

export interface CreditCardPaymentData {
  customerId: string;
  amount: number;
  description: string;
  externalReference?: string;
  creditCard: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo: {
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

// Funções da API Asaas

/**
 * Criar cliente no Asaas
 */
export async function createCustomer(customerData: AsaasCustomer): Promise<AsaasCustomer> {
  try {
    const response = await asaasApi.post('/customers', customerData);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao criar cliente no Asaas:', error.response?.data || error.message);
    throw new Error('Falha ao criar cliente no Asaas');
  }
}

/**
 * Buscar cliente por ID
 */
export async function getCustomer(customerId: string): Promise<AsaasCustomer | null> {
  try {
    const response = await asaasApi.get(`/customers/${customerId}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Erro ao buscar cliente no Asaas:', error.response?.data || error.message);
    throw new Error('Falha ao buscar cliente no Asaas');
  }
}

/**
 * Criar pagamento PIX
 */
export async function createPixPayment(paymentData: PixPaymentData): Promise<AsaasPaymentResponse | null> {
  try {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1); // Vencimento para amanhã

    const asaasPayment: AsaasPayment = {
      customer: paymentData.customerId,
      billingType: 'PIX',
      value: paymentData.amount,
      dueDate: dueDate.toISOString().split('T')[0],
      description: paymentData.description,
      externalReference: paymentData.externalReference,
    };

    const response = await asaasApi.post('/payments', asaasPayment);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao criar pagamento PIX no Asaas:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Criar pagamento com cartão de crédito
 */
export async function createCreditCardPayment(paymentData: CreditCardPaymentData): Promise<AsaasPaymentResponse | null> {
  try {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);

    const asaasPayment = {
      customer: paymentData.customerId,
      billingType: 'CREDIT_CARD',
      value: paymentData.amount,
      dueDate: dueDate.toISOString().split('T')[0],
      description: paymentData.description,
      externalReference: paymentData.externalReference,
      installmentCount: paymentData.installmentCount || 1,
      creditCard: paymentData.creditCard,
      creditCardHolderInfo: paymentData.creditCardHolderInfo,
    };

    const response = await asaasApi.post('/payments', asaasPayment);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao criar pagamento com cartão no Asaas:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Buscar status de pagamento
 */
export async function getPaymentStatus(paymentId: string): Promise<AsaasPaymentResponse | null> {
  try {
    const response = await asaasApi.get(`/payments/${paymentId}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Erro ao buscar pagamento no Asaas:', error.response?.data || error.message);
    throw new Error('Falha ao buscar pagamento no Asaas');
  }
}

/**
 * Listar pagamentos
 */
export async function listPayments(filters?: {
  customer?: string;
  status?: string;
  dateCreated?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: AsaasPaymentResponse[]; hasMore: boolean; totalCount: number } | null> {
  try {
    const params = new URLSearchParams();
    
    if (filters?.customer) params.append('customer', filters.customer);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateCreated) params.append('dateCreated[ge]', filters.dateCreated);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await asaasApi.get(`/payments?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao listar pagamentos no Asaas:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Cancelar pagamento
 */
export async function cancelPayment(paymentId: string): Promise<boolean> {
  try {
    await asaasApi.delete(`/payments/${paymentId}`);
    return true;
  } catch (error: any) {
    console.error('Erro ao cancelar pagamento no Asaas:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Estornar pagamento
 */
export async function refundPayment(paymentId: string, value?: number, description?: string): Promise<boolean> {
  try {
    const refundData: any = {};
    if (value) refundData.value = value;
    if (description) refundData.description = description;

    await asaasApi.post(`/payments/${paymentId}/refund`, refundData);
    return true;
  } catch (error: any) {
    console.error('Erro ao estornar pagamento no Asaas:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Validar webhook do Asaas
 */
export function validateAsaasWebhook(payload: string, signature: string): boolean {
  // Em produção, implementar validação real do webhook
  // Por enquanto, retorna true para desenvolvimento
  return true;
}

export default {
  createCustomer,
  getCustomer,
  createPixPayment,
  createCreditCardPayment,
  getPaymentStatus,
  listPayments,
  cancelPayment,
  refundPayment,
  validateAsaasWebhook,
};