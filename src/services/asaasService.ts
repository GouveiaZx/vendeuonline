// Serviço para integração com a API de pagamento Asaas

import { formatters } from '@/utils/formatters';

const ASAAS_API_KEY = process.env.ASAAS_API_KEY as string;
const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL as string;

export interface AsaasCustomer {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
}

export interface AsaasPayment {
  id?: string;
  customer: string; // Customer ID
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  dueDate: string; // YYYY-MM-DD
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

export interface AsaasCreditCardPayment extends AsaasPayment {
  billingType: 'CREDIT_CARD';
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
}

export interface AsaasPixPayment extends AsaasPayment {
  billingType: 'PIX';
}

export interface AsaasPaymentResponse {
  object: string;
  id: string;
  dateCreated: string;
  customer: string;
  paymentLink?: string;
  value: number;
  netValue: number;
  originalValue?: number;
  interestValue?: number;
  description?: string;
  billingType: string;
  pixTransaction?: {
    encodedImage: string;
    payload: string;
    expirationDate: string;
  };
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
  dueDate: string;
  originalDueDate: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  installmentNumber?: number;
  invoiceUrl: string;
  invoiceNumber: string;
  externalReference?: string;
  discount?: {
    value: number;
    limitDate?: string;
    dueDateLimitDays: number;
    type: string;
  };
  interest?: {
    value: number;
    type: string;
  };
  fine?: {
    value: number;
    type: string;
  };
  postalService: boolean;
  custody?: string;
  refunds?: any[];
}

class AsaasService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = ASAAS_API_KEY;
    this.baseUrl = ASAAS_BASE_URL;
    if (!this.apiKey || !this.baseUrl) {
      throw new Error('Asaas API key/base URL não configurados nas variáveis de ambiente');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'access_token': this.apiKey,
    };

    const config: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.errors?.[0]?.description || 
          errorData.message || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Asaas API Error:', error);
      throw error;
    }
  }

  // Customer methods
  async createCustomer(customerData: AsaasCustomer): Promise<AsaasCustomer> {
    return this.makeRequest<AsaasCustomer>('/customers', 'POST', customerData);
  }

  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    return this.makeRequest<AsaasCustomer>(`/customers/${customerId}`);
  }

  async updateCustomer(customerId: string, customerData: Partial<AsaasCustomer>): Promise<AsaasCustomer> {
    return this.makeRequest<AsaasCustomer>(`/customers/${customerId}`, 'PUT', customerData);
  }

  async listCustomers(params?: {
    name?: string;
    email?: string;
    cpfCnpj?: string;
    groupName?: string;
    externalReference?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ object: string; hasMore: boolean; totalCount: number; limit: number; offset: number; data: AsaasCustomer[] }> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/customers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest(endpoint);
  }

  // Payment methods
  async createPayment(paymentData: AsaasPayment | AsaasCreditCardPayment | AsaasPixPayment): Promise<AsaasPaymentResponse> {
    return this.makeRequest<AsaasPaymentResponse>('/payments', 'POST', paymentData);
  }

  async getPayment(paymentId: string): Promise<AsaasPaymentResponse> {
    return this.makeRequest<AsaasPaymentResponse>(`/payments/${paymentId}`);
  }

  async updatePayment(paymentId: string, paymentData: Partial<AsaasPayment>): Promise<AsaasPaymentResponse> {
    return this.makeRequest<AsaasPaymentResponse>(`/payments/${paymentId}`, 'PUT', paymentData);
  }

  async deletePayment(paymentId: string): Promise<{ deleted: boolean; id: string }> {
    return this.makeRequest(`/payments/${paymentId}`, 'DELETE');
  }

  async listPayments(params?: {
    customer?: string;
    customerGroupName?: string;
    billingType?: string;
    status?: string;
    subscription?: string;
    installment?: string;
    externalReference?: string;
    paymentDate?: string;
    estimatedCreditDate?: string;
    pixQrCodeId?: string;
    anticipated?: boolean;
    dateCreated?: string;
    estimatedDueDate?: string;
    dueDate?: string;
    user?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ object: string; hasMore: boolean; totalCount: number; limit: number; offset: number; data: AsaasPaymentResponse[] }> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest(endpoint);
  }

  // PIX specific methods
  async getPixQrCode(paymentId: string): Promise<{
    encodedImage: string;
    payload: string;
    expirationDate: string;
  }> {
    return this.makeRequest(`/payments/${paymentId}/pixQrCode`);
  }

  // Utility methods
  // Usar formatadores consolidados
  formatCurrency = formatters.formatCurrency;
  formatDate = formatters.formatDate;

  parseCurrency(value: string): number {
    return Math.round(parseFloat(value) * 100);
  }

  // Webhook validation
  validateWebhook(payload: string, signature: string, secret: string): boolean {
    // Implementar validação de webhook se necessário
    // Por enquanto, retorna true para desenvolvimento
    return true;
  }
}

export const asaasService = new AsaasService();
export default asaasService;