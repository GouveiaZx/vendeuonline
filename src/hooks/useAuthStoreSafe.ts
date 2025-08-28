/**
 * Hook SSR-safe para acessar o authStore
 * Evita erros de hidratação e invalid hook calls
 */

import { useSyncExternalStore } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useProductStore } from '@/store/productStore';
import { useStoreStore } from '@/store/storeStore';
import { useOrderStore } from '@/store/orderStore';
import { useWishlistStore } from '@/store/wishlistStore';
import type { User } from '@/types';

export function useAuthStoreSafe() {
  const user = useSyncExternalStore(
    useAuthStore.subscribe,
    () => useAuthStore.getState().user,
    () => null
  );
  
  const isAuthenticated = useSyncExternalStore(
    useAuthStore.subscribe,
    () => useAuthStore.getState().isAuthenticated,
    () => false
  );
  
  const isLoading = useSyncExternalStore(
    useAuthStore.subscribe,
    () => useAuthStore.getState().loadingStates?.auth || false,
    () => false
  );
  
  const error = useSyncExternalStore(
    useAuthStore.subscribe,
    () => useAuthStore.getState().error,
    () => null
  );
  
  const token = useSyncExternalStore(
    useAuthStore.subscribe,
    () => useAuthStore.getState().token,
    () => null
  );

  // Actions (safe to call directly)
  const actions = useAuthStore.getState();
  
  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    token,
    login: actions.login,
    register: actions.register,
    logout: actions.logout,
    updateUser: actions.updateUser,
    checkAuth: actions.checkAuth,
    updateProfile: actions.updateProfile
  };
}

export function useNotificationStoreSafe() {
  const unreadCount = useSyncExternalStore(
    useNotificationStore.subscribe,
    () => useNotificationStore.getState().unreadCount || 0,
    () => 0
  );
  
  const notifications = useSyncExternalStore(
    useNotificationStore.subscribe,
    () => useNotificationStore.getState().notifications || [],
    () => []
  );

  // Actions (safe to call directly)
  const actions = useNotificationStore.getState();
  
  return {
    unreadCount,
    notifications,
    fetchNotifications: actions.fetchNotifications,
    markAsRead: actions.markAsRead,
    markAllAsRead: actions.markAllAsRead,
    removeNotification: actions.removeNotification
  };
}

export function useProductStoreSafe() {
  const products = useSyncExternalStore(
    useProductStore.subscribe,
    () => useProductStore.getState().products || [],
    () => []
  );
  
  const filteredProducts = useSyncExternalStore(
    useProductStore.subscribe,
    () => useProductStore.getState().filteredProducts || [],
    () => []
  );
  
  const loading = useSyncExternalStore(
    useProductStore.subscribe,
    () => useProductStore.getState().loading || false,
    () => false
  );
  
  const error = useSyncExternalStore(
    useProductStore.subscribe,
    () => useProductStore.getState().error,
    () => null
  );
  
  const filters = useSyncExternalStore(
    useProductStore.subscribe,
    () => useProductStore.getState().filters,
    () => ({
      search: '',
      category: '',
      minPrice: 0,
      maxPrice: 0,
      brands: [],
      conditions: [],
      freeShippingOnly: false,
      minRating: 0,
      location: '',
      city: '',
      state: '',
      sortBy: 'relevance' as const
    })
  );
  
  const pagination = useSyncExternalStore(
    useProductStore.subscribe,
    () => useProductStore.getState().pagination,
    () => ({
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    })
  );

  // Actions (safe to call directly)
  const actions = useProductStore.getState();
  
  return {
    products,
    filteredProducts,
    loading,
    error,
    filters,
    pagination,
    fetchProducts: actions.fetchProducts,
    setFilters: actions.setFilters,
    clearFilters: actions.clearFilters,
    applyFilters: actions.applyFilters,
    addProduct: actions.addProduct,
    updateProduct: actions.updateProduct,
    deleteProduct: actions.deleteProduct
  };
}

export function useStoreStoreSafe() {
  const stores = useSyncExternalStore(
    useStoreStore.subscribe,
    () => useStoreStore.getState().stores || [],
    () => []
  );
  
  const currentStore = useSyncExternalStore(
    useStoreStore.subscribe,
    () => useStoreStore.getState().currentStore,
    () => null
  );
  
  const loading = useSyncExternalStore(
    useStoreStore.subscribe,
    () => useStoreStore.getState().loading || false,
    () => false
  );
  
  const error = useSyncExternalStore(
    useStoreStore.subscribe,
    () => useStoreStore.getState().error,
    () => null
  );
  
  const pagination = useSyncExternalStore(
    useStoreStore.subscribe,
    () => useStoreStore.getState().pagination,
    () => ({
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    })
  );

  // Actions (safe to call directly)
  const actions = useStoreStore.getState();
  
  return {
    stores,
    currentStore,
    loading,
    error,
    pagination,
    fetchStores: actions.fetchStores,
    fetchStoreById: actions.fetchStoreById,
    createStore: actions.createStore,
    updateStore: actions.updateStore,
    deleteStore: actions.deleteStore,
    setCurrentStore: actions.setCurrentStore
  };
}

export function useCartSafe() {
  const cartItems = useSyncExternalStore(
    useOrderStore.subscribe,
    () => useOrderStore.getState().cartItems || [],
    () => []
  );
  
  const cartTotal = useSyncExternalStore(
    useOrderStore.subscribe,
    () => useOrderStore.getState().cartTotal || 0,
    () => 0
  );
  
  const cartCount = useSyncExternalStore(
    useOrderStore.subscribe,
    () => useOrderStore.getState().cartCount || 0,
    () => 0
  );

  // Actions (safe to call directly)
  const actions = useOrderStore.getState();
  
  return {
    items: cartItems,
    total: cartTotal,
    count: cartCount,
    addItem: actions.addToCart,
    removeItem: actions.removeFromCart,
    updateQuantity: actions.updateCartQuantity,
    clearCart: actions.clearCart
  };
}

export function useWishlistStoreSafe() {
  const items = useSyncExternalStore(
    useWishlistStore.subscribe,
    () => useWishlistStore.getState().items || [],
    () => []
  );
  
  const loading = useSyncExternalStore(
    useWishlistStore.subscribe,
    () => useWishlistStore.getState().loading || false,
    () => false
  );

  // Actions (safe to call directly)
  const actions = useWishlistStore.getState();
  
  return {
    items,
    loading,
    isInWishlist: actions.isInWishlist,
    addToWishlist: actions.addToWishlist,
    removeFromWishlist: actions.removeFromWishlist,
    clearWishlist: actions.clearWishlist
  };
}