import { create } from 'zustand';
import { apiRequest } from '@/lib/api';

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingPeriod: 'MONTHLY' | 'YEARLY';
  maxListings: number;
  listingDuration: number;
  featured: boolean;
  priority: boolean;
  support: 'BASIC' | 'PRIORITY' | 'DEDICATED';
  analytics: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    subscriptions: number;
  };
}

interface PlanStore {
  plans: Plan[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchPlans: () => Promise<void>;
  createPlan: (planData: Partial<Plan>) => Promise<void>;
  updatePlan: (id: string, planData: Partial<Plan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  clearError: () => void;
}

// Mock data temporário baseado na documentação (sem teste gratuito e sem destaques)
const mockPlans: Plan[] = [
  {
    id: '1',
    name: 'Micro-Empresa',
    description: 'Para microempreendedores',
    price: 24.90,
    billingPeriod: 'MONTHLY',
    maxListings: 2,
    listingDuration: 30,
    featured: false,
    priority: false,
    support: 'BASIC',
    analytics: true,
    customBranding: false,
    apiAccess: false,
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Pequena Empresa',
    description: 'Para pequenos negócios',
    price: 49.90,
    billingPeriod: 'MONTHLY',
    maxListings: 5,
    listingDuration: 30,
    featured: false,
    priority: true,
    support: 'PRIORITY',
    analytics: true,
    customBranding: false,
    apiAccess: false,
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Empresa Simples',
    description: 'Para empresas em crescimento',
    price: 99.90,
    billingPeriod: 'MONTHLY',
    maxListings: 10,
    listingDuration: 30,
    featured: false,
    priority: true,
    support: 'PRIORITY',
    analytics: true,
    customBranding: true,
    apiAccess: false,
    isActive: true,
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Empresa Plus',
    description: 'Para grandes negócios',
    price: 149.90,
    billingPeriod: 'MONTHLY',
    maxListings: 20,
    listingDuration: 30,
    featured: false,
    priority: true,
    support: 'DEDICATED',
    analytics: true,
    customBranding: true,
    apiAccess: true,
    isActive: true,
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const usePlanStore = create<PlanStore>((set, get) => ({
  plans: [],
  loading: false,
  error: null,

  fetchPlans: async () => {
    set({ loading: true, error: null });
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Usar dados mock temporariamente
      set({ plans: mockPlans, loading: false });
      
      // Comentado temporariamente até o banco estar disponível
      /*
      const response = await apiRequest('/api/plans');
      if (response.success) {
        set({ plans: response.data, loading: false });
      } else {
        set({ error: response.error || 'Erro ao carregar planos', loading: false });
      }
      */
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao carregar planos', 
        loading: false 
      });
    }
  },

  createPlan: async (planData) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest('/api/plans', {
        method: 'POST',
        body: JSON.stringify(planData)
      });
      
      if (response.success) {
        const { plans } = get();
        set({ 
          plans: [...plans, response.data],
          loading: false 
        });
      } else {
        set({ error: response.error || 'Erro ao criar plano', loading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao criar plano', 
        loading: false 
      });
    }
  },

  updatePlan: async (id, planData) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(`/api/plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(planData)
      });
      
      if (response.success) {
        const { plans } = get();
        set({ 
          plans: plans.map(plan => 
            plan.id === id ? { ...plan, ...response.data } : plan
          ),
          loading: false 
        });
      } else {
        set({ error: response.error || 'Erro ao atualizar plano', loading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao atualizar plano', 
        loading: false 
      });
    }
  },

  deletePlan: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(`/api/plans/${id}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        const { plans } = get();
        set({ 
          plans: plans.filter(plan => plan.id !== id),
          loading: false 
        });
      } else {
        set({ error: response.error || 'Erro ao excluir plano', loading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao excluir plano', 
        loading: false 
      });
    }
  },

  clearError: () => set({ error: null })
}));