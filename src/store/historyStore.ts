import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/logger';

interface HistoryItem {
  id: string;
  type: 'product' | 'store' | 'search';
  data: any;
  timestamp: string;
}

interface HistoryStore {
  items: HistoryItem[];
  loading: boolean;
  error: string | null;
  fetchHistory: () => Promise<void>;
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => Promise<void>;
  removeFromHistory: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      error: null,

      fetchHistory: async () => {
        set({ loading: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            set({ items: [], loading: false });
            return;
          }

          const { data, error } = await supabase
            .from('user_history')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false })
            .limit(50);

          if (error) throw error;

          set({ items: data || [], loading: false });
        } catch (error: any) {
          logError('Erro ao buscar histórico', error);
          set({ 
            items: [], 
            loading: false,
            error: 'Erro ao carregar histórico'
          });
        }
      },

      addToHistory: async (item) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const newItem = {
            ...item,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            user_id: user.id
          };

          await supabase.from('user_history').insert([newItem]);
          get().fetchHistory();
        } catch (error: any) {
          logError('Erro ao adicionar ao histórico', error);
        }
      },

      removeFromHistory: async (id: string) => {
        try {
          set({ loading: true });
          await supabase.from('user_history').delete().eq('id', id);
          set((state) => ({
            items: state.items.filter(item => item.id !== id),
            loading: false
          }));
        } catch (error: any) {
          logError('Erro ao remover do histórico', error);
          set({ 
            error: 'Erro ao remover do histórico',
            loading: false
          });
        }
      },

      clearHistory: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          set({ loading: true });
          await supabase.from('user_history').delete().eq('user_id', user.id);
          set({ items: [], loading: false });
        } catch (error: any) {
          logError('Erro ao limpar histórico', error);
          set({ 
            error: 'Erro ao limpar histórico',
            loading: false
          });
        }
      },
    }),
    {
      name: 'history-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);