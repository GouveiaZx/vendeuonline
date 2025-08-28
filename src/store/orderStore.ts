import { create } from 'zustand'
import { persist } from 'zustand/middleware'
// Removido imports React hooks - stores Zustand não devem usar React hooks

// Interface Product local para evitar dependência circular
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  sellerId: string;
  sellerName?: string;
  category: string;
  description: string;
}

// Interface simplificada para User para evitar dependência circular
interface User {
  id: string;
  name: string;
  email: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  sellerId: string;
  sellerName: string;
  addedAt: Date;
}

export interface ShippingAddress {
  id?: string;
  userId?: string; // Added to match Address interface
  name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  isDefault?: boolean; // Added to match Address interface
  createdAt?: string; // Added to match Address interface
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  total: number;
  sellerId?: string;
  subtotal?: number;
  product?: {
    id: string;
    name: string;
    image?: string;
  };
  specifications?: any[];
}

export type OrderStatus = 
  | 'PENDING'      // Aguardando pagamento
  | 'CONFIRMED'    // Pagamento confirmado
  | 'PROCESSING'   // Em preparação
  | 'SHIPPED'      // Enviado
  | 'DELIVERED'    // Entregue
  | 'CANCELLED'    // Cancelado
  | 'REFUNDED';    // Reembolsado

export type PaymentMethod = 
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'PIX'
  | 'BOLETO'
  | 'WHATSAPP';

export type PaymentStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  storeId: string;
  buyer: Pick<User, 'id' | 'name' | 'email'>;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  shippingCost?: number; // Alias para shipping
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  shippingAddressId: string;
  billingAddressId?: string;
  trackingCode?: string;
  carrier?: string;
  estimatedDelivery?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStore {
  // Cart state
  cartItems: CartItem[];
  cartTotal: number;
  cartCount: number;
  
  // Orders state
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  
  // Cache and performance
  lastFetchTime: number | null;
  cacheTimeout: number;
  
  // Shipping
  shippingAddresses: ShippingAddress[];
  selectedShippingAddress: ShippingAddress | null;
  
  // Cart actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartItemsByStore: () => Record<string, CartItem[]>;
  
  // Order actions
  createOrder: (shippingAddress: ShippingAddress, notes?: string) => Promise<Order>;
  fetchOrders: () => Promise<void>;
  getOrders: (userId?: string, forceRefresh?: boolean) => Promise<Order[]>;
  getOrderById: (orderId: string) => Order | null;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;
  syncOrders: (options?: { since?: Date; limit?: number; offset?: number; force?: boolean; optimistic?: boolean }) => Promise<{ orders: Order[]; hasMore: boolean }>;
  prefetchOrders: (userId?: string) => Promise<void>;
  batchUpdateOrders: (updates: Array<{ orderId: string; status: OrderStatus }>) => Promise<void>;
  subscribeToUpdates: (callback: (orders: Order[]) => void) => () => void;
  
  // Shipping actions
  addShippingAddress: (address: Omit<ShippingAddress, 'id'>) => void;
  updateShippingAddress: (id: string, address: Partial<ShippingAddress>) => void;
  deleteShippingAddress: (id: string) => void;
  setSelectedShippingAddress: (address: ShippingAddress | null) => void;
  
  // Utility actions
  calculateShipping: (items: CartItem[], address: ShippingAddress) => Promise<number>;
  clearError: () => void;
  setCurrentOrder: (order: Order | null) => void;
}

// Mock shipping calculation
const calculateShippingCost = async (items: CartItem[], address: ShippingAddress): Promise<number> => {
  // Simulação de cálculo de frete baseado no peso e distância
  const baseShipping = 15.00;
  const weightFactor = items.reduce((acc, item) => acc + (item.quantity * 0.5), 0); // 0.5kg por item
  const distanceFactor = address.state === 'RS' ? 1 : 1.5; // Frete mais caro para outros estados
  
  return Math.round((baseShipping + (weightFactor * 2)) * distanceFactor * 100) / 100;
};

// Generate unique ID - SSR safe
const generateId = () => {
  // Usar crypto.randomUUID quando disponível, senão fallback para timestamp + random
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback para ambientes onde crypto.randomUUID não está disponível
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${timestamp}-${random}`;
};

export const useOrderStore = create<OrderStore>()(persist(
  (set, get) => ({
    // Initial state
    cartItems: [],
    cartTotal: 0,
    cartCount: 0,
    orders: [],
    currentOrder: null,
    isLoading: false,
    error: null,
    lastFetchTime: null,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    shippingAddresses: [],
    selectedShippingAddress: null,

    // Cart actions
    addToCart: (product: Product, quantity = 1) => {
      set((state) => {
        const existingItem = state.cartItems.find(item => item.productId === product.id);
        
        let newCartItems: CartItem[];
        
        if (existingItem) {
          // Update quantity if item already exists
          newCartItems = state.cartItems.map(item =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          // Add new item to cart
          const newItem: CartItem = {
            id: generateId(),
            productId: product.id,
            product,
            quantity,
            price: product.price,
            sellerId: product.sellerId,
            sellerName: product.sellerName || 'Vendedor',
            addedAt: new Date() // Este é usado apenas para timestamp interno, não para renderização
          };
          newCartItems = [...state.cartItems, newItem];
        }
        
        const cartTotal = newCartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        const cartCount = newCartItems.reduce((count, item) => count + item.quantity, 0);
        
        return {
          cartItems: newCartItems,
          cartTotal,
          cartCount
        };
      });
    },

    removeFromCart: (productId: string) => {
      set((state) => {
        const newCartItems = state.cartItems.filter(item => item.productId !== productId);
        const cartTotal = newCartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        const cartCount = newCartItems.reduce((count, item) => count + item.quantity, 0);
        
        return {
          cartItems: newCartItems,
          cartTotal,
          cartCount
        };
      });
    },

    updateCartItemQuantity: (productId: string, quantity: number) => {
      if (quantity <= 0) {
        get().removeFromCart(productId);
        return;
      }
      
      set((state) => {
        const newCartItems = state.cartItems.map(item =>
          item.productId === productId
            ? { ...item, quantity }
            : item
        );
        
        const cartTotal = newCartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        const cartCount = newCartItems.reduce((count, item) => count + item.quantity, 0);
        
        return {
          cartItems: newCartItems,
          cartTotal,
          cartCount
        };
      });
    },

    clearCart: () => {
      set({
        cartItems: [],
        cartTotal: 0,
        cartCount: 0
      });
    },

    getCartItemsByStore: () => {
      const { cartItems } = get();
      return cartItems.reduce((acc, item) => {
        const storeId = item.sellerId;
        if (!acc[storeId]) {
          acc[storeId] = [];
        }
        acc[storeId].push(item);
        return acc;
      }, {} as Record<string, CartItem[]>);
    },

    // Cache management
    clearCache: () => {
      set({ lastFetchTime: null });
    },
    
    setCacheTimeout: (timeout: number) => {
      set({ cacheTimeout: timeout });
    },

    // Server synchronization
    syncOrders: async (options: { 
      since?: Date; 
      limit?: number; 
      offset?: number; 
      force?: boolean;
      optimistic?: boolean;
    } = {}) => {
      const { since, limit = 50, offset = 0, force = false, optimistic = true } = options;
      const { lastFetchTime, orders } = get();

      set({ isLoading: true, error: null });

      try {
        // Build query parameters
        const params = new URLSearchParams();
        if (since) params.append('since', since.toISOString());
        if (limit) params.append('limit', limit.toString());
        if (offset) params.append('offset', offset.toString());

        const url = `/api/orders/sync?${params.toString()}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'If-Modified-Since': since?.toISOString() || (lastFetchTime ? new Date(lastFetchTime).toISOString() : ''),
          },
          credentials: 'include',
        });

        if (response.status === 304) {
          // Not modified, use cached data
          set({ isLoading: false });
          return { orders, hasMore: false };
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const { orders: serverOrders, hasMore, lastSync } = data;

        // Merge server data with local changes (optimistic updates)
        let updatedOrders = [...orders];
        
        if (optimistic) {
          // Preserve local changes that haven't been synced yet
          const localChanges = orders.filter(order => 
            order.updatedAt && (!lastSync || new Date(order.updatedAt) > new Date(lastSync))
          );
          
          // Remove duplicates and merge
          const serverOrderMap = new Map(serverOrders.map((o: Order) => [o.id, o]));
          updatedOrders = orders.filter(order => !serverOrderMap.has(order.id));
          updatedOrders.push(...serverOrders);
          
          // Re-apply local changes
          localChanges.forEach(localOrder => {
            const index = updatedOrders.findIndex(o => o.id === localOrder.id);
            if (index >= 0) {
              updatedOrders[index] = { ...updatedOrders[index], ...localOrder };
            }
          });
        } else {
          updatedOrders = serverOrders;
        }

        set({ 
          orders: updatedOrders,
          isLoading: false,
          lastFetchTime: Date.now() // Timestamp interno, não afeta renderização
        });

        return { orders: updatedOrders, hasMore };
      } catch (error: any) {
        console.error('Error syncing orders:', error);
        set({ 
          isLoading: false, 
          error: error.message || 'Erro ao sincronizar pedidos' 
        });
        throw error;
      }
    },

    // Real-time updates
    subscribeToUpdates: (callback: (orders: Order[]) => void) => {
      let eventSource: EventSource | null = null;
      
      try {
        eventSource = new EventSource('/api/orders/updates', {
          withCredentials: true
        });

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const { type, order } = data;

            set((state) => {
              let updatedOrders = [...state.orders];
              
              switch (type) {
                case 'created':
                  updatedOrders.unshift(order);
                  break;
                case 'updated':
                  const index = updatedOrders.findIndex(o => o.id === order.id);
                  if (index >= 0) {
                    updatedOrders[index] = { ...updatedOrders[index], ...order };
                  } else {
                    updatedOrders.unshift(order);
                  }
                  break;
                case 'deleted':
                  updatedOrders = updatedOrders.filter(o => o.id !== order.id);
                  break;
              }

              callback(updatedOrders);
              return { orders: updatedOrders, lastFetchTime: Date.now() };
            });
          } catch (error) {
            console.error('Error processing SSE update:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);
          // Attempt to reconnect after 5 seconds
          setTimeout(() => {
            get().subscribeToUpdates(callback);
          }, 5000);
        };

      } catch (error) {
        console.error('Error establishing SSE connection:', error);
      }

      return () => {
        if (eventSource) {
          eventSource.close();
        }
      };
    },

    // Performance optimization
    prefetchOrders: async (userId?: string) => {
      const { orders } = get();
      
      // Use background fetching for better UX
      setTimeout(async () => {
        try {
          await get().syncOrders({ 
            limit: 100, 
            offset: orders.length,
            force: false 
          });
        } catch (error) {
          // Silent fail for prefetch
          console.debug('Prefetch failed:', error);
        }
      }, 100);
    },

    // Batch operations for performance
    batchUpdateOrders: async (updates: Array<{ orderId: string; status: OrderStatus }>) => {
      set({ isLoading: true, error: null });

      try {
        const response = await fetch('/api/orders/batch', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ updates }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedOrders = await response.json();
        
        set((state) => ({
          orders: state.orders.map(order => {
            const update = updatedOrders.find((u: any) => u.id === order.id);
            return update ? { ...order, ...update } : order;
          }),
          isLoading: false,
          lastFetchTime: Date.now() // Timestamp interno, não afeta renderização
        }));

        return updatedOrders;
      } catch (error: any) {
        console.error('Error batch updating orders:', error);
        set({ 
          isLoading: false, 
          error: error.message || 'Erro ao atualizar pedidos em lote' 
        });
        throw error;
      }
    },

    // Order actions
    createOrder: async (shippingAddress: ShippingAddress, notes?: string) => {
      const { cartItems, clearCart } = get();
      
      if (cartItems.length === 0) {
        throw new Error('Carrinho vazio');
      }
      
      set({ isLoading: true, error: null });
      
      try {
        // Calculate shipping
        const shippingCost = await calculateShippingCost(cartItems, shippingAddress);
        
        // Convert cart items to order items
        const orderItems: OrderItem[] = cartItems.map(item => ({
          id: generateId(),
          productId: item.productId,
          productName: item.product.name,
          productImage: item.product.image,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
          subtotal: item.price * item.quantity,
          sellerId: item.sellerId,
          product: {
            id: item.product.id,
            name: item.product.name,
            image: item.product.image
          },
          specifications: []
        }));
        
        const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
        const total = subtotal + shippingCost;
        
        // Import auth store to get current user
        const { useAuthStore } = await import('./authStore');
        const authStore = useAuthStore.getState();
        
        if (!authStore.user || !authStore.isAuthenticated) {
          throw new Error('Usuário não autenticado');
        }

        // Create order
        const newOrder: Order = {
          id: generateId(),
          buyerId: authStore.user.id,
          sellerId: orderItems[0]?.sellerId || 'unknown',
          storeId: 'store-' + (orderItems[0]?.sellerId || 'unknown'),
          buyer: {
            id: authStore.user.id,
            name: authStore.user.name,
            email: authStore.user.email
          },
          items: orderItems,
          subtotal,
          shipping: shippingCost,
          tax: 0,
          discount: 0,
          total,
          status: 'PENDING',
          paymentMethod: 'PIX',
          paymentStatus: 'PENDING',
          shippingAddress,
          shippingAddressId: 'address-' + generateId(),
          notes,
          createdAt: new Date().toISOString(), // Para API - não afeta renderização inicial
          updatedAt: new Date().toISOString() // Para API - não afeta renderização inicial
        };
        
        set((state) => ({
          orders: [...state.orders, newOrder],
          currentOrder: newOrder,
          isLoading: false
        }));
        
        // Clear cart after successful order creation
        clearCart();
        
        return newOrder;
      } catch (error: any) {
        set({ 
          isLoading: false, 
          error: error.message || 'Erro ao criar pedido' 
        });
        throw error;
      }
    },

    fetchOrders: async (forceRefresh = false) => {
      // Use the new syncOrders method for better performance
      try {
        await get().syncOrders({ force: forceRefresh });
      } catch (error) {
        console.error('Error in fetchOrders:', error);
      }
    },

    getOrders: async (userId?: string, forceRefresh = false) => {
      try {
        const result = await get().syncOrders({ 
          force: forceRefresh,
          limit: 100
        });
        return result.orders;
      } catch (error) {
        console.error('Error in getOrders:', error);
        throw error;
      }
    },

    getOrderById: (orderId: string) => {
      const { orders } = get();
      return orders.find(order => order.id === orderId) || null;
    },

    updateOrderStatus: async (orderId: string, status: OrderStatus) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedOrder = await response.json();
        
        set((state) => ({
          orders: state.orders.map(order => 
            order.id === orderId ? { ...order, ...updatedOrder } : order
          ),
          currentOrder: state.currentOrder?.id === orderId 
            ? { ...state.currentOrder, ...updatedOrder }
            : state.currentOrder,
          isLoading: false,
          lastFetchTime: null // Invalidate cache to force refresh on next fetch
        }));
      } catch (error: any) {
        console.error('Error updating order status:', error);
        set({ 
          isLoading: false, 
          error: error.message || 'Erro ao atualizar status do pedido' 
        });
      }
    },

    cancelOrder: async (orderId: string, reason?: string) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await fetch(`/api/orders/${orderId}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ reason }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedOrder = await response.json();
        
        set((state) => ({
          orders: state.orders.map(order => 
            order.id === orderId ? { ...order, ...updatedOrder } : order
          ),
          currentOrder: state.currentOrder?.id === orderId 
            ? { ...state.currentOrder, ...updatedOrder }
            : state.currentOrder,
          isLoading: false,
          lastFetchTime: null // Invalidate cache to force refresh on next fetch
        }));
      } catch (error: any) {
        console.error('Error canceling order:', error);
        set({ 
          isLoading: false, 
          error: error.message || 'Erro ao cancelar pedido' 
        });
      }
    },

    // Shipping actions
    addShippingAddress: (address: Omit<ShippingAddress, 'id'>) => {
      const newAddress: ShippingAddress = {
        ...address,
        id: generateId()
      };
      
      set((state) => ({
        shippingAddresses: [...state.shippingAddresses, newAddress]
      }));
    },

    updateShippingAddress: (id: string, address: Partial<ShippingAddress>) => {
      set((state) => ({
        shippingAddresses: state.shippingAddresses.map(addr =>
          addr.id === id ? { ...addr, ...address } : addr
        )
      }));
    },

    deleteShippingAddress: (id: string) => {
      set((state) => ({
        shippingAddresses: state.shippingAddresses.filter(addr => addr.id !== id),
        selectedShippingAddress: state.selectedShippingAddress?.id === id 
          ? null 
          : state.selectedShippingAddress
      }));
    },

    setSelectedShippingAddress: (address: ShippingAddress | null) => {
      set({ selectedShippingAddress: address });
    },

    // Utility actions
    calculateShipping: async (items: CartItem[], address: ShippingAddress) => {
      return await calculateShippingCost(items, address);
    },

    clearError: () => {
      set({ error: null });
    },

    setCurrentOrder: (order: Order | null) => {
      set({ currentOrder: order });
    }
  }),
  {
    name: 'order-store',
    partialize: (state) => ({
      cartItems: state.cartItems,
      cartTotal: state.cartTotal,
      cartCount: state.cartCount,
      shippingAddresses: state.shippingAddresses,
      selectedShippingAddress: state.selectedShippingAddress,
      cacheTimeout: state.cacheTimeout
    })
  }
));

// Hook for easier usage
export const useCart = () => {
  const store = useOrderStore();
  
  return {
    items: store.cartItems,
    total: store.cartTotal,
    count: store.cartCount,
    addItem: store.addToCart,
    removeItem: store.removeFromCart,
    updateQuantity: store.updateCartItemQuantity,
    clear: store.clearCart,
    isEmpty: store.cartItems.length === 0,
    getItemsByStore: store.getCartItemsByStore
  };
};

export const useOrders = () => {
  const store = useOrderStore();
  
  return {
    orders: store.orders,
    currentOrder: store.currentOrder,
    isLoading: store.isLoading,
    error: store.error,
    createOrder: store.createOrder,
    fetchOrders: store.fetchOrders,
    getOrders: store.getOrders,
    getOrderById: store.getOrderById,
    updateOrderStatus: store.updateOrderStatus,
    cancelOrder: store.cancelOrder,
    clearError: store.clearError,
    // New methods
    syncOrders: store.syncOrders,
    subscribeToUpdates: store.subscribeToUpdates,
    prefetchOrders: store.prefetchOrders,
    batchUpdateOrders: store.batchUpdateOrders
  };
};

// Hook movido para src/hooks/useOrderSubscription.ts para evitar React hooks em stores Zustand

export const useShipping = () => {
  const store = useOrderStore();
  
  return {
    addresses: store.shippingAddresses,
    selectedAddress: store.selectedShippingAddress,
    addAddress: store.addShippingAddress,
    updateAddress: store.updateShippingAddress,
    deleteAddress: store.deleteShippingAddress,
    selectAddress: store.setSelectedShippingAddress,
    calculateShipping: store.calculateShipping
  };
};