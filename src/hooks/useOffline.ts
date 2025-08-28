import { useState, useEffect } from 'react';

interface OfflineData {
  products: any[];
  stores: any[];
  cart: any[];
  lastSync: number;
}

interface UseOfflineReturn {
  isOnline: boolean;
  mounted: boolean;
  offlineData: OfflineData;
  saveOfflineData: (key: keyof OfflineData, data: any) => void;
  getOfflineData: (key: keyof OfflineData) => any;
  clearOfflineData: () => void;
  syncWhenOnline: () => Promise<void>;
  saveData: (key: string, data: any) => void;
  getData: (key: string) => any;
  clearData: (key?: string) => void;
  syncData: () => Promise<void>;
}

const OFFLINE_STORAGE_KEY = 'vendeu-online-offline-data';

export const useOffline = (): UseOfflineReturn => {
  const [isOnline, setIsOnline] = useState(true); // Inicializar como true para evitar hidration mismatch
  const [mounted, setMounted] = useState(false);
  const [offlineData, setOfflineData] = useState<OfflineData>({
    products: [],
    stores: [],
    cart: [],
    lastSync: 0
  });

  useEffect(() => {
    // Marcar como montado e definir o estado real da conectividade
    setMounted(true);
    setIsOnline(navigator.onLine);
    
    // Carregar dados offline do localStorage
    const loadOfflineData = () => {
      try {
        const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
        if (stored) {
          const parsedData = JSON.parse(stored);
          setOfflineData(parsedData);
        }
      } catch (error) {
        console.error('Error loading offline data:', error);
      }
    };

    loadOfflineData();

    // Listeners para mudanças de conectividade
    const handleOnline = () => {
      setIsOnline(true);
      console.log('App is back online');
      // Sincronizar dados quando voltar online
      syncWhenOnline();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('App is offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Salvar dados offline
  const saveOfflineData = (key: keyof OfflineData, data: any) => {
    const newOfflineData = {
      ...offlineData,
      [key]: data,
      lastSync: Date.now()
    };
    
    setOfflineData(newOfflineData);
    
    try {
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(newOfflineData));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  };

  // Obter dados offline
  const getOfflineData = (key: keyof OfflineData) => {
    return offlineData[key];
  };

  // Limpar dados offline
  const clearOfflineData = () => {
    const emptyData: OfflineData = {
      products: [],
      stores: [],
      cart: [],
      lastSync: 0
    };
    
    setOfflineData(emptyData);
    localStorage.removeItem(OFFLINE_STORAGE_KEY);
  };

  // Sincronizar dados quando voltar online
  const syncWhenOnline = async () => {
    if (!isOnline) return;

    try {
      // Sincronizar carrinho se houver itens pendentes
      const cart = getOfflineData('cart');
      if (cart && Array.isArray(cart) && cart.length > 0) {
        // Aqui você implementaria a sincronização do carrinho com o servidor
        console.log('Syncing cart data:', cart);
        
        // Exemplo de sincronização (adapte conforme sua API)
        // await syncCartWithServer(cart);
      }

      // Atualizar dados de produtos e lojas
      try {
        const [productsResponse, storesResponse] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/stores')
        ]);

        if (productsResponse.ok) {
          const products = await productsResponse.json();
          saveOfflineData('products', products);
        }

        if (storesResponse.ok) {
          const stores = await storesResponse.json();
          saveOfflineData('stores', stores);
        }

        console.log('Offline data synced successfully');
      } catch (error) {
        console.error('Error syncing data:', error);
      }
    } catch (error) {
      console.error('Error during sync:', error);
    }
  };

  // Função para sincronizar dados quando voltar online
  const syncData = async () => {
    if (!isOnline) return;
    
    try {
      // Sincronizar carrinho offline com o servidor
      const offlineCart = getOfflineData('cart');
      if (offlineCart && Array.isArray(offlineCart) && offlineCart.length > 0) {
        console.log('Sincronizando carrinho offline:', offlineCart);
        // Aqui você faria a sincronização real com a API
        // await syncCartWithServer(offlineCart);
      }
      
      console.log('Dados sincronizados com sucesso');
    } catch (error) {
      console.error('Erro ao sincronizar dados:', error);
    }
  };

  // Funções genéricas para compatibilidade
  const saveData = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const getData = (key: string) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting data:', error);
      return null;
    }
  };

  const clearData = (key?: string) => {
    if (key) {
      localStorage.removeItem(key);
    } else {
      clearOfflineData();
    }
  };

  return {
    isOnline,
    mounted,
    offlineData,
    saveOfflineData,
    getOfflineData,
    clearOfflineData,
    syncWhenOnline,
    saveData,
    getData,
    clearData,
    syncData
  };
};

// Hook para cache de produtos offline
export const useOfflineProducts = () => {
  const { isOnline, saveOfflineData, getOfflineData } = useOffline();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      
      try {
        if (isOnline) {
          // Tentar carregar do servidor
          const response = await fetch('/api/products');
          if (response.ok) {
            const data = await response.json();
            setProducts(data);
            saveOfflineData('products', data);
          } else {
            throw new Error('Failed to fetch products');
          }
        } else {
          // Carregar do cache offline
          const cachedProducts = getOfflineData('products');
          setProducts(cachedProducts || []);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        // Fallback para dados offline
        const cachedProducts = getOfflineData('products');
        setProducts(cachedProducts || []);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [isOnline]);

  const saveProducts = (productsData: any[]) => {
    saveOfflineData('products', productsData);
    setProducts(productsData);
  };

  return { products, loading, isOnline, saveProducts };
};

// Hook para carrinho offline
export const useOfflineCart = () => {
  const { saveOfflineData, getOfflineData } = useOffline();
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    // Carregar carrinho do cache offline
    const cachedCart = getOfflineData('cart');
    if (cachedCart) {
      setCart(cachedCart);
    }
  }, []);

  const addToCart = (product: any) => {
    const newCart = [...cart, { ...product, addedAt: Date.now() }];
    setCart(newCart);
    saveOfflineData('cart', newCart);
  };

  const removeFromCart = (productId: string) => {
    const newCart = cart.filter(item => item.id !== productId);
    setCart(newCart);
    saveOfflineData('cart', newCart);
  };

  const clearCart = () => {
    setCart([]);
    saveOfflineData('cart', []);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const newCart = cart.map(item => 
      item.id === productId ? { ...item, quantity } : item
    );
    setCart(newCart);
    saveOfflineData('cart', newCart);
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    updateQuantity
  };
};