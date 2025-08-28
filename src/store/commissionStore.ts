import { create } from 'zustand';
import { apiRequest } from '@/lib/api';
import {
  CommissionRate,
  CreateCommissionRateData,
  CommissionTransaction,
  CommissionPayout,
  CreateCommissionPayoutData,
  CommissionTransactionFilters,
  CommissionPayoutFilters,
  CommissionTransactionResponse,
  CommissionPayoutResponse,
  CommissionStatsResponse,
  StoreCommissionStats,
  CategoryCommissionStats
} from '@/types';

interface CommissionStore {
  // Estado
  commissionRates: CommissionRate[];
  rates: CommissionRate[]; // Alias para compatibilidade
  transactions: CommissionTransaction[];
  payouts: CommissionPayout[];
  storeStats: StoreCommissionStats[];
  categoryStats: CategoryCommissionStats[];
  stats: CommissionStatsResponse['data'] | null;
  loading: boolean;
  error: string | null;
  
  // Filtros
  transactionFilters: CommissionTransactionFilters;
  payoutFilters: CommissionPayoutFilters;
  
  // Paginação
  transactionPagination: {
    page: number;
    limit: number;
    total: number;
  };
  payoutPagination: {
    page: number;
    limit: number;
    total: number;
  };
  
  // Actions - Commission Rates
  fetchCommissionRates: () => Promise<void>;
  fetchRates: () => Promise<void>; // Alias para compatibilidade
  createCommissionRate: (data: CreateCommissionRateData) => Promise<CommissionRate>;
  createRate: (data: CreateCommissionRateData) => Promise<CommissionRate>; // Alias para compatibilidade
  updateCommissionRate: (id: string, data: Partial<CreateCommissionRateData>) => Promise<CommissionRate>;
  updateRate: (id: string, data: Partial<CreateCommissionRateData>) => Promise<CommissionRate>; // Alias para compatibilidade
  deleteCommissionRate: (id: string) => Promise<void>;
  deleteRate: (id: string) => Promise<void>; // Alias para compatibilidade
  toggleCommissionRateStatus: (id: string) => Promise<void>;
  
  // Actions - Transactions
  fetchTransactions: (filters?: CommissionTransactionFilters, page?: number, limit?: number) => Promise<void>;
  updateTransactionStatus: (id: string, status: CommissionTransaction['status']) => Promise<void>;
  
  // Actions - Payouts
  fetchPayouts: (filters?: CommissionPayoutFilters, page?: number, limit?: number) => Promise<void>;
  createPayout: (data: CreateCommissionPayoutData) => Promise<CommissionPayout>;
  updatePayoutStatus: (id: string, data: { status: CommissionPayout['status'], notes?: string, paymentReference?: string }) => Promise<void>;
  processPayouts: (storeId: string, period: string) => Promise<CommissionPayout>;
  
  // Actions - Stats
  fetchStats: (period?: string) => Promise<void>;
  
  // Actions - Filters
  setTransactionFilters: (filters: Partial<CommissionTransactionFilters>) => void;
  setPayoutFilters: (filters: Partial<CommissionPayoutFilters>) => void;
  clearFilters: () => void;
  
  // Actions - Utils
  clearError: () => void;
  reset: () => void;
}

export const useCommissionStore = create<CommissionStore>((set, get) => ({
  // Estado inicial
  commissionRates: [],
  get rates() { return get().commissionRates; }, // Alias para compatibilidade
  transactions: [],
  payouts: [],
  storeStats: [],
  categoryStats: [],
  stats: null,
  loading: false,
  error: null,
  
  // Filtros iniciais
  transactionFilters: {},
  payoutFilters: {},
  
  // Paginação inicial
  transactionPagination: {
    page: 1,
    limit: 20,
    total: 0
  },
  payoutPagination: {
    page: 1,
    limit: 20,
    total: 0
  },
  
  // Commission Rates Actions
  fetchCommissionRates: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest('/api/admin/commission-rates');
      set({ 
        commissionRates: response.data || [],
        loading: false 
      });
    } catch (error: any) {
      console.error('Erro ao buscar taxas de comissão:', error);
      set({
        error: 'Erro ao carregar taxas de comissão',
        loading: false
      });
    }
  },
  
  createCommissionRate: async (data: CreateCommissionRateData) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest('/api/admin/commission-rates', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      const newRate = response.data || response;
      const { commissionRates } = get();
      set({ 
        commissionRates: [...commissionRates, newRate],
        loading: false 
      });
      
      return newRate;
    } catch (error: any) {
      console.error('Erro ao criar taxa de comissão:', error);
      set({
        error: 'Erro ao criar taxa de comissão',
        loading: false
      });
      throw error;
    }
  },
  
  updateCommissionRate: async (id: string, data: Partial<CreateCommissionRateData>) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(`/api/admin/commission-rates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      const updatedRate = response.data || response;
      const { commissionRates } = get();
      set({ 
        commissionRates: commissionRates.map(rate => 
          rate.id === id ? updatedRate : rate
        ),
        loading: false 
      });
      
      return updatedRate;
    } catch (error: any) {
      console.error('Erro ao atualizar taxa de comissão:', error);
      set({
        error: 'Erro ao atualizar taxa de comissão',
        loading: false
      });
      throw error;
    }
  },
  
  deleteCommissionRate: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await apiRequest(`/api/admin/commission-rates/${id}`, {
        method: 'DELETE'
      });
      
      const { commissionRates } = get();
      set({ 
        commissionRates: commissionRates.filter(rate => rate.id !== id),
        loading: false 
      });
    } catch (error: any) {
      console.error('Erro ao excluir taxa de comissão:', error);
      set({
        error: 'Erro ao excluir taxa de comissão',
        loading: false
      });
    }
  },
  
  toggleCommissionRateStatus: async (id: string) => {
    const { commissionRates } = get();
    const rate = commissionRates.find(r => r.id === id);
    if (!rate) return;
    
    await get().updateCommissionRate(id, { isActive: !rate.isActive });
  },
  
  // Transactions Actions
  fetchTransactions: async (filters?: CommissionTransactionFilters, page = 1, limit = 20) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      
      const response = await apiRequest(
        `/api/commission/transactions?${queryParams}`
      );
      
      const transactionData = response.data || response;
      
      set({ 
        transactions: transactionData.data || transactionData || [],
        transactionPagination: {
          page: transactionData.page || 1,
          limit: transactionData.limit || 20,
          total: transactionData.total || 0
        },
        loading: false 
      });
    } catch (error: any) {
      console.error('Erro ao buscar transações de comissão:', error);
      set({
        error: 'Erro ao carregar transações de comissão',
        loading: false
      });
    }
  },
  
  updateTransactionStatus: async (id: string, status: CommissionTransaction['status']) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(`/api/commission/transactions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      
      const updatedTransaction = response.data || response;
      const { transactions } = get();
      set({ 
        transactions: transactions.map(transaction => 
          transaction.id === id ? updatedTransaction : transaction
        ),
        loading: false 
      });
    } catch (error: any) {
      console.error('Erro ao atualizar status da transação:', error);
      set({
        error: 'Erro ao atualizar status da transação',
        loading: false
      });
    }
  },
  
  // Payouts Actions
  fetchPayouts: async (filters?: CommissionPayoutFilters, page = 1, limit = 20) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      
      const response = await apiRequest(
        `/api/commission/payouts?${queryParams}`
      );
      
      const payoutData = response.data || response;
      
      set({ 
        payouts: payoutData.data || payoutData || [],
        payoutPagination: {
          page: payoutData.page || 1,
          limit: payoutData.limit || 20,
          total: payoutData.total || 0
        },
        loading: false 
      });
    } catch (error: any) {
      console.error('Erro ao buscar repasses de comissão:', error);
      set({
        error: 'Erro ao carregar repasses de comissão',
        loading: false
      });
    }
  },
  
  createPayout: async (data: CreateCommissionPayoutData) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest('/api/commission/payouts', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      const newPayout = response.data || response;
      const { payouts } = get();
      set({ 
        payouts: [newPayout, ...payouts],
        loading: false 
      });
      
      return newPayout;
    } catch (error: any) {
      console.error('Erro ao criar repasse:', error);
      set({
        error: 'Erro ao criar repasse',
        loading: false
      });
      throw error;
    }
  },
  
  updatePayoutStatus: async (id: string, data: { status: CommissionPayout['status'], notes?: string, paymentReference?: string }) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(`/api/commission/payouts/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
      
      const updatedPayout = response.data || response;
      const { payouts } = get();
      set({ 
        payouts: payouts.map(payout => 
          payout.id === id ? updatedPayout : payout
        ),
        loading: false 
      });
    } catch (error: any) {
      console.error('Erro ao atualizar status do repasse:', error);
      set({
        error: 'Erro ao atualizar status do repasse',
        loading: false
      });
    }
  },
  
  processPayouts: async (storeId: string, period: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest('/api/commission/payouts/process', {
        method: 'POST',
        body: JSON.stringify({ storeId, period })
      });
      
      const payout = response.data || response;
      const { payouts } = get();
      set({ 
        payouts: [payout, ...payouts],
        loading: false 
      });
      
      return payout;
    } catch (error: any) {
      console.error('Erro ao processar repasses:', error);
      set({
        error: 'Erro ao processar repasses',
        loading: false
      });
      throw error;
    }
  },
  
  // Stats Actions
  fetchStats: async (filters?: any) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, String(value));
        });
      }
      
      const response = await apiRequest(
        `/api/commission/stats?${queryParams}`
      );
      
      const statsData = response.data || response;
      set({ 
        stats: statsData,
        storeStats: statsData.storeStats || [],
        categoryStats: statsData.categoryStats || [],
        loading: false 
      });
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas de comissão:', error);
      set({
        error: 'Erro ao carregar estatísticas de comissão',
        loading: false
      });
    }
  },
  
  // Filter Actions
  setTransactionFilters: (filters: Partial<CommissionTransactionFilters>) => {
    const { transactionFilters } = get();
    set({ transactionFilters: { ...transactionFilters, ...filters } });
  },
  
  setPayoutFilters: (filters: Partial<CommissionPayoutFilters>) => {
    const { payoutFilters } = get();
    set({ payoutFilters: { ...payoutFilters, ...filters } });
  },
  
  clearFilters: () => {
    set({ 
      transactionFilters: {},
      payoutFilters: {} 
    });
  },
  
  // Utility Actions
  clearError: () => {
    set({ error: null });
  },
  
  reset: () => {
    set({
      commissionRates: [],
      transactions: [],
      payouts: [],
      storeStats: [],
      categoryStats: [],
      stats: null,
      loading: false,
      error: null,
      transactionFilters: {},
      payoutFilters: {},
      transactionPagination: {
        page: 1,
        limit: 20,
        total: 0
      },
      payoutPagination: {
        page: 1,
        limit: 20,
        total: 0
      }
    });
  },

  // Aliases para compatibilidade
  fetchRates: async () => {
    return get().fetchCommissionRates();
  },
  
  createRate: async (data: CreateCommissionRateData) => {
    return get().createCommissionRate(data);
  },
  
  updateRate: async (id: string, data: Partial<CreateCommissionRateData>) => {
    return get().updateCommissionRate(id, data);
  },
  
  deleteRate: async (id: string) => {
    return get().deleteCommissionRate(id);
  }
}));