import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
import { User } from './authStore';

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
  name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  subtotal: number;
  sellerId: string;
  sellerName: string;
}

export type OrderStatus = 
  | 'pending'      // Aguardando pagamento
  | 'paid'         // Pagamento confirmado
  | 'processing'   // Em preparação
  | 'shipped'      // Enviado
  | 'delivered'    // Entregue
  | 'cancelled';   // Cancelado

export interface Order {
  id: string;
  buyerId: string;
  buyer: Pick<User, 'id' | 'name' | 'email'>;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  paymentId?: string;
  paymentMethod?: string;
  shippingAddress: ShippingAddress;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  trackingCode?: string;
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
  getOrders: (userId?: string) => Promise<void>;
  getOrderById: (orderId: string) => Order | null;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;
  
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

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
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
            addedAt: new Date()
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
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
          sellerId: item.sellerId,
          sellerName: item.sellerName
        }));
        
        const subtotal = orderItems.reduce((total, item) => total + item.subtotal, 0);
        const total = subtotal + shippingCost;
        
        // Create order
        const newOrder: Order = {
          id: generateId(),
          buyerId: 'current-user-id', // TODO: Get from auth store
          buyer: {
            id: 'current-user-id',
            name: 'Usuário Atual',
            email: 'usuario@email.com'
          },
          items: orderItems,
          subtotal,
          shippingCost,
          total,
          status: 'pending',
          shippingAddress,
          notes,
          createdAt: new Date(),
          updatedAt: new Date()
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

    fetchOrders: async () => {
      set({ isLoading: true, error: null });
      
      try {
        // TODO: Implement API call to fetch orders
        // For now, return existing orders from state
        const { orders } = get();
        
        set({ 
          orders,
          isLoading: false 
        });
      } catch (error: any) {
        set({ 
          isLoading: false, 
          error: error.message || 'Erro ao buscar pedidos' 
        });
      }
    },

    getOrders: async (userId?: string) => {
      set({ isLoading: true, error: null });
      
      try {
        // TODO: Implement API call to fetch orders
        // For now, return existing orders from state
        const { orders } = get();
        
        set({ 
          orders: userId ? orders.filter(order => order.buyerId === userId) : orders,
          isLoading: false 
        });
      } catch (error: any) {
        set({ 
          isLoading: false, 
          error: error.message || 'Erro ao buscar pedidos' 
        });
      }
    },

    getOrderById: (orderId: string) => {
      const { orders } = get();
      return orders.find(order => order.id === orderId) || null;
    },

    updateOrderStatus: async (orderId: string, status: OrderStatus) => {
      set({ isLoading: true, error: null });
      
      try {
        const now = new Date();
        
        set((state) => ({
          orders: state.orders.map(order => {
            if (order.id === orderId) {
              const updatedOrder = {
                ...order,
                status,
                updatedAt: now
              };
              
              // Set specific timestamps based on status
              switch (status) {
                case 'paid':
                  updatedOrder.paidAt = now;
                  break;
                case 'shipped':
                  updatedOrder.shippedAt = now;
                  break;
                case 'delivered':
                  updatedOrder.deliveredAt = now;
                  break;
                case 'cancelled':
                  updatedOrder.cancelledAt = now;
                  break;
              }
              
              return updatedOrder;
            }
            return order;
          }),
          currentOrder: state.currentOrder?.id === orderId 
            ? { ...state.currentOrder, status, updatedAt: now }
            : state.currentOrder,
          isLoading: false
        }));
      } catch (error: any) {
        set({ 
          isLoading: false, 
          error: error.message || 'Erro ao atualizar status do pedido' 
        });
      }
    },

    cancelOrder: async (orderId: string, reason?: string) => {
      await get().updateOrderStatus(orderId, 'cancelled');
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
      selectedShippingAddress: state.selectedShippingAddress
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
    clearError: store.clearError
  };
};

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