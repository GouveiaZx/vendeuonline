/**
 * STORE UNIFICADO DE AUTENTICAÇÃO E GESTÃO DE USUÁRIOS
 * 
 * Este store combina as funcionalidades do authStore e userStore anteriores,
 * eliminando duplicação de código e estados conflitantes.
 * 
 * Features unificadas:
 * - Autenticação (login/register/logout)
 * - Gestão de usuários (CRUD para admins)
 * - Cache inteligente
 * - Error handling padronizado
 * - Loading states otimizados
 * - Persistence seletiva
 */

import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { apiRequestWithRetry, handleApiError, checkApiHealth } from '@/utils/errorHandler'
import { apiRequest as apiRequestLib } from '@/lib/api'
import { getSSRSafeTimestamp } from '@/lib/ssrUtils'
import { 
  User, 
  AuthState, 
  AuthActions, 
  LoginCredentials, 
  RegisterData, 
  UserType,
  UserStatus 
} from '@/types'

// ============================================================================
// INTERFACES ESTENDIDAS
// ============================================================================

interface UnifiedAuthState extends AuthState {
  // Lista de usuários (para admin)
  users: User[]
  selectedUser: User | null
  
  // Filtros para listagem de usuários
  filters: {
    search: string
    status: string
    type: string
    page: number
    limit: number
  }
  
  // Estados de loading específicos
  loadingStates: {
    auth: boolean
    users: boolean
    userUpdate: boolean
    userDelete: boolean
  }
  
  // Cache de dados
  cache: {
    users: {
      data: User[]
      timestamp: number
      ttl: number
    } | null
  }
  
  // Estatísticas (para admin dashboard)
  stats: {
    totalUsers: number
    totalBuyers: number
    totalSellers: number
    totalAdmins: number
    activeUsers: number
  } | null
}

interface UnifiedAuthActions extends AuthActions {
  // Ações de gestão de usuários (admin)
  fetchUsers: (refresh?: boolean) => Promise<void>
  fetchUser: (userId: string) => Promise<void>
  updateUserStatus: (userId: string, status: UserStatus) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  promoteUser: (userId: string, newType: UserType) => Promise<void>
  
  // Ações de filtros e paginação
  setFilters: (filters: Partial<UnifiedAuthState['filters']>) => void
  resetFilters: () => void
  nextPage: () => void
  prevPage: () => void
  
  // Ações de cache
  clearCache: () => void
  refreshCache: () => Promise<void>
  
  // Ações de loading
  setLoadingState: (key: keyof UnifiedAuthState['loadingStates'], loading: boolean) => void
  
  // Ações específicas para diferentes tipos de usuário
  updateProfile: (updates: Partial<User>) => Promise<void>
  fetchUserStats: () => Promise<void>
  
  // Ações de validação e verificação
  verifyEmail: (token: string) => Promise<void>
  resendVerificationEmail: () => Promise<void>
  
  // Ações de senha
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (token: string, newPassword: string) => Promise<{ user: User; redirectPath: string }>
  
  // Ações de autorização e verificação (faltantes)
  hasPermission: (permission: string) => boolean
  hasRole: (role: UserType) => boolean
  canAccess: (requiredRole: UserType | UserType[]) => boolean
  getRedirectPath: () => string
  
  // Ações específicas para testes e funcionalidades avançadas
  setUser: (user: User | null) => void
  useAdminActions: () => any
  useSellerActions: () => any  
  useBuyerActions: () => any
  useRoleBasedRedirect: () => any
  useRouteAccess: (requiredRole: UserType | UserType[], requiredPermissions?: string[]) => any
}

export type UnifiedAuthStore = UnifiedAuthState & UnifiedAuthActions

// ============================================================================
// UTILITÁRIOS
// ============================================================================

const getStoredToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth-token')
  }
  return null
}

const setStoredToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth-token', token)
  }
}

const removeStoredToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth-token')
  }
}

// Cache utilities
const isCacheValid = (cache: { timestamp: number; ttl: number } | null): boolean => {
  if (!cache) return false
  const now = getSSRSafeTimestamp()
  return now - cache.timestamp < cache.ttl
}

const createCacheEntry = <T>(data: T, ttl: number = 5 * 60 * 1000): { data: T; timestamp: number; ttl: number } => ({
  data,
  timestamp: getSSRSafeTimestamp(),
  ttl
})

// Redirecionamento baseado no tipo de usuário
const getRedirectPath = (userType: UserType): string => {
  switch (userType) {
    case 'ADMIN':
      return '/admin'
    case 'SELLER':
      return '/seller'
    case 'BUYER':
    default:
      return '/'
  }
}

// ============================================================================
// API HELPERS
// ============================================================================

const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = getStoredToken()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...Object.fromEntries(new Headers(options.headers || {}).entries())
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  const response = await apiRequestLib(url, {
    ...options,
    headers,
  })
  
  if (!response.success) {
    throw new Error(response.error || 'Erro na requisição')
  }
  
  return response.data
}

// ============================================================================
// ESTADO INICIAL E CACHE
// ============================================================================

const initialAuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  token: getStoredToken(),
  error: null,
  users: [],
  selectedUser: null,
  filters: {
    search: '',
    status: 'all',
    type: 'all',
    page: 1,
    limit: 20
  },
  loadingStates: {
    auth: false,
    users: false,
    userUpdate: false,
    userDelete: false
  },
  cache: {
    users: null
  },
  stats: null,
};

// Cache do getServerSnapshot para evitar loop infinito
const cachedAuthSnapshot = () => initialAuthState;

// ============================================================================
// STORE PRINCIPAL
// ============================================================================

export const useAuthStore = create<UnifiedAuthStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Usar estado inicial cacheado
        ...initialAuthState,

        // ================================================================
        // AÇÕES DE AUTENTICAÇÃO
        // ================================================================
        
        login: async (credentials: LoginCredentials & { userType?: UserType }) => {
          set(state => ({ 
            ...state,
            loadingStates: { ...state.loadingStates, auth: true },
            error: null 
          }))
          
          try {
            const isApiHealthy = await checkApiHealth()
            if (!isApiHealthy) {
              throw new Error('API não está disponível no momento')
            }
            
            // Determinar endpoint baseado no tipo de usuário
            let endpoint = '/api/auth/login'
            if (credentials.userType === 'ADMIN') {
              endpoint = '/api/auth/login/admin'
            } else if (credentials.userType === 'SELLER') {
              endpoint = '/api/auth/login/seller'
            }
            
            const response = await apiRequestWithRetry(endpoint, {
              method: 'POST',
              body: JSON.stringify(credentials),
            })
            
            const { user: apiUser, token } = response
            
            // Verificar se o tipo de usuário corresponde ao esperado
            if (credentials.userType && apiUser.type !== credentials.userType) {
              throw new Error(`Tipo de usuário inválido. Esperado: ${credentials.userType}, Recebido: ${apiUser.type}`)
            }
            
            // Armazenar token
            setStoredToken(token)
            
            set(state => ({
              ...state,
              user: apiUser,
              isAuthenticated: true,
              token,
              loadingStates: { ...state.loadingStates, auth: false },
              error: null
            }))
            
            return { user: apiUser, redirectPath: getRedirectPath(apiUser.type) }
            
          } catch (error) {
            const apiError = handleApiError(error)
            set(state => ({ 
              ...state,
              loadingStates: { ...state.loadingStates, auth: false },
              error: apiError.message,
              user: null,
              isAuthenticated: false,
              token: null
            }))
            removeStoredToken()
            throw apiError
          }
        },

        register: async (userData: RegisterData & { userType?: UserType }) => {
          set(state => ({ 
            ...state,
            loadingStates: { ...state.loadingStates, auth: true },
            error: null 
          }))
          
          try {
            const isApiHealthy = await checkApiHealth()
            if (!isApiHealthy) {
              throw new Error('API não está disponível no momento')
            }
            
            // Determinar endpoint baseado no tipo de usuário
            let endpoint = '/api/auth/register'
            if (userData.userType === 'SELLER') {
              endpoint = '/api/auth/register/seller'
            } else if (userData.userType === 'ADMIN') {
              endpoint = '/api/auth/register/admin'
            }
            
            const response = await apiRequestWithRetry(endpoint, {
              method: 'POST',
              body: JSON.stringify(userData),
            })
            
            const { user: apiUser, token } = response
            
            setStoredToken(token)
            
            set(state => ({
              ...state,
              user: apiUser,
              isAuthenticated: true,
              token,
              loadingStates: { ...state.loadingStates, auth: false },
              error: null
            }))
            
            return { user: apiUser, redirectPath: getRedirectPath(apiUser.type) }
            
          } catch (error) {
            const apiError = handleApiError(error)
            set(state => ({ 
              ...state,
              loadingStates: { ...state.loadingStates, auth: false },
              error: apiError.message,
              user: null,
              isAuthenticated: false,
              token: null
            }))
            removeStoredToken()
            throw apiError
          }
        },

        logout: () => {
          removeStoredToken()
          set({
            user: null,
            isAuthenticated: false,
            token: null,
            error: null,
            users: [],
            selectedUser: null,
            stats: null,
            cache: { users: null },
            loadingStates: {
              auth: false,
              users: false,
              userUpdate: false,
              userDelete: false
            },
            filters: {
              search: '',
              status: 'all',
              type: 'all',
              page: 1,
              limit: 20
            }
          })
        },

        checkAuth: async () => {
          const token = getStoredToken()
          
          if (!token) {
            set({
              user: null,
              isAuthenticated: false,
              token: null,
              loadingStates: { ...get().loadingStates, auth: false }
            })
            return
          }
          
          set(state => ({ 
            ...state,
            loadingStates: { ...state.loadingStates, auth: true },
            error: null 
          }))
          
          try {
            const isApiHealthy = await checkApiHealth()
            if (!isApiHealthy) {
              set(state => ({ 
                ...state,
                loadingStates: { ...state.loadingStates, auth: false }
              }))
              return
            }
            
            const response = await apiRequestWithRetry('/api/auth/me')
            
            set(state => ({
              ...state,
              user: response.user,
              isAuthenticated: true,
              token,
              loadingStates: { ...state.loadingStates, auth: false },
              error: null
            }))
            
          } catch (error) {
            // Log error apenas em desenvolvimento
            if (process.env.NODE_ENV === 'development') {
              console.error('Erro ao verificar autenticação:', error)
            }
            removeStoredToken()
            set({
              user: null,
              isAuthenticated: false,
              token: null,
              loadingStates: { ...get().loadingStates, auth: false },
              error: null
            })
          }
        },

        // ================================================================
        // AÇÕES DE GESTÃO DE USUÁRIOS (ADMIN)
        // ================================================================
        
        fetchUsers: async (refresh = false) => {
          const state = get()
          
          // Verificar cache se não for refresh
          if (!refresh && isCacheValid(state.cache.users)) {
            set({ users: state.cache.users!.data })
            return
          }
          
          set(state => ({ 
            ...state,
            loadingStates: { ...state.loadingStates, users: true },
            error: null 
          }))
          
          try {
            const { filters } = state
            const queryParams = new URLSearchParams({
              page: filters.page.toString(),
              limit: filters.limit.toString(),
              ...(filters.search && { search: filters.search }),
              ...(filters.status !== 'all' && { status: filters.status }),
              ...(filters.type !== 'all' && { type: filters.type })
            })
            
            const response = await apiRequest(`/api/admin/users?${queryParams}`)
            
            set(state => ({
              ...state,
              users: response.data || [],
              cache: {
                ...state.cache,
                users: createCacheEntry(response.data || [])
              },
              loadingStates: { ...state.loadingStates, users: false }
            }))
            
          } catch (error) {
            // Log error apenas em desenvolvimento
            if (process.env.NODE_ENV === 'development') {
              console.error('Erro ao buscar usuários:', error)
            }
            set(state => ({
              ...state,
              users: [],
              error: 'Erro ao carregar usuários',
              loadingStates: { ...state.loadingStates, users: false }
            }))
          }
        },

        fetchUser: async (userId: string) => {
          set(state => ({ 
            ...state,
            loadingStates: { ...state.loadingStates, userUpdate: true },
            error: null 
          }))
          
          try {
            const user = await apiRequest(`/api/admin/users/${userId}`)
            
            set(state => ({
              ...state,
              selectedUser: user,
              loadingStates: { ...state.loadingStates, userUpdate: false }
            }))
            
          } catch (error) {
            console.error('Erro ao buscar usuário:', error)
            set(state => ({
              ...state,
              error: 'Erro ao carregar usuário',
              loadingStates: { ...state.loadingStates, userUpdate: false }
            }))
          }
        },

        updateUserStatus: async (userId: string, status: UserStatus) => {
          set(state => ({ 
            ...state,
            loadingStates: { ...state.loadingStates, userUpdate: true },
            error: null 
          }))
          
          try {
            await apiRequest(`/api/admin/users/${userId}/status`, {
              method: 'PATCH',
              body: JSON.stringify({ status })
            })
            
            // Atualizar localmente
            const { users } = get()
            const updatedUsers = users.map(user => 
              user.id === userId ? { ...user, status } : user
            )
            
            set(state => ({
              ...state,
              users: updatedUsers,
              cache: { users: null }, // Invalidar cache
              loadingStates: { ...state.loadingStates, userUpdate: false }
            }))
            
          } catch (error) {
            console.error('Erro ao atualizar status do usuário:', error)
            set(state => ({
              ...state,
              error: 'Erro ao atualizar status do usuário',
              loadingStates: { ...state.loadingStates, userUpdate: false }
            }))
          }
        },

        deleteUser: async (userId: string) => {
          set(state => ({ 
            ...state,
            loadingStates: { ...state.loadingStates, userDelete: true },
            error: null 
          }))
          
          try {
            await apiRequest(`/api/admin/users/${userId}`, {
              method: 'DELETE'
            })
            
            // Remover localmente
            const { users } = get()
            const updatedUsers = users.filter(user => user.id !== userId)
            
            set(state => ({
              ...state,
              users: updatedUsers,
              cache: { users: null }, // Invalidar cache
              loadingStates: { ...state.loadingStates, userDelete: false }
            }))
            
          } catch (error) {
            console.error('Erro ao excluir usuário:', error)
            set(state => ({
              ...state,
              error: 'Erro ao excluir usuário',
              loadingStates: { ...state.loadingStates, userDelete: false }
            }))
          }
        },

        promoteUser: async (userId: string, newType: UserType) => {
          set(state => ({ 
            ...state,
            loadingStates: { ...state.loadingStates, userUpdate: true },
            error: null 
          }))
          
          try {
            await apiRequest(`/api/admin/users/${userId}/promote`, {
              method: 'PATCH',
              body: JSON.stringify({ type: newType })
            })
            
            // Atualizar localmente
            const { users } = get()
            const updatedUsers = users.map(user => 
              user.id === userId ? { ...user, type: newType } : user
            )
            
            set(state => ({
              ...state,
              users: updatedUsers,
              cache: { users: null },
              loadingStates: { ...state.loadingStates, userUpdate: false }
            }))
            
          } catch (error) {
            console.error('Erro ao promover usuário:', error)
            set(state => ({
              ...state,
              error: 'Erro ao promover usuário',
              loadingStates: { ...state.loadingStates, userUpdate: false }
            }))
          }
        },

        // ================================================================
        // AÇÕES UTILITÁRIAS
        // ================================================================
        
        updateUser: (userData: Partial<User>) => {
          const { user } = get()
          if (user) {
            set({ user: { ...user, ...userData } })
          }
        },

        setLoadingState: (key, loading) => {
          set(state => ({
            ...state,
            loadingStates: { ...state.loadingStates, [key]: loading }
          }))
        },

        setFilters: (newFilters) => {
          set(state => ({
            ...state,
            filters: { ...state.filters, ...newFilters }
          }))
        },

        resetFilters: () => {
          set(state => ({
            ...state,
            filters: {
              search: '',
              status: 'all',
              type: 'all',
              page: 1,
              limit: 20
            }
          }))
        },

        nextPage: () => {
          set(state => ({
            ...state,
            filters: { ...state.filters, page: state.filters.page + 1 }
          }))
        },

        prevPage: () => {
          const { filters } = get()
          if (filters.page > 1) {
            set(state => ({
              ...state,
              filters: { ...state.filters, page: state.filters.page - 1 }
            }))
          }
        },

        clearCache: () => {
          set(state => ({
            ...state,
            cache: { users: null }
          }))
        },

        refreshCache: async () => {
          await get().fetchUsers(true)
        },

        clearError: () => {
          set({ error: null })
        },

        setLoading: (loading) => {
          set(state => ({ 
            ...state,
            loadingStates: { ...state.loadingStates, auth: loading }
          }))
        },

        // ================================================================
        // AÇÕES ESPECÍFICAS POR TIPO DE USUÁRIO
        // ================================================================
        
        updateProfile: async (updates: Partial<User>) => {
          set(state => ({ 
            ...state,
            loadingStates: { ...state.loadingStates, userUpdate: true },
            error: null 
          }))
          
          try {
            const response = await apiRequest('/api/user/profile', {
              method: 'PATCH',
              body: JSON.stringify(updates)
            })
            
            set(state => ({
              ...state,
              user: response.user,
              loadingStates: { ...state.loadingStates, userUpdate: false }
            }))
            
          } catch (error) {
            console.error('Erro ao atualizar perfil:', error)
            set(state => ({
              ...state,
              error: 'Erro ao atualizar perfil',
              loadingStates: { ...state.loadingStates, userUpdate: false }
            }))
            throw error
          }
        },

        fetchUserStats: async () => {
          set(state => ({ 
            ...state,
            loadingStates: { ...state.loadingStates, users: true },
            error: null 
          }))
          
          try {
            const response = await apiRequest('/api/admin/stats')
            
            set(state => ({
              ...state,
              stats: response,
              loadingStates: { ...state.loadingStates, users: false }
            }))
            
          } catch (error) {
            console.error('Erro ao buscar estatísticas:', error)
            set(state => ({
              ...state,
              error: 'Erro ao carregar estatísticas',
              loadingStates: { ...state.loadingStates, users: false }
            }))
          }
        },

        verifyEmail: async (token: string) => {
          set(state => ({ 
            ...state,
            loadingStates: { ...state.loadingStates, auth: true },
            error: null 
          }))
          
          try {
            await apiRequest('/api/auth/verify-email', {
              method: 'POST',
              body: JSON.stringify({ token })
            })
            
            // Atualizar status do usuário
            const { user } = get()
            if (user) {
              set(state => ({
                ...state,
                user: { ...user, emailVerified: true },
                loadingStates: { ...state.loadingStates, auth: false }
              }))
            }
            
          } catch (error) {
            console.error('Erro ao verificar email:', error)
            set(state => ({
              ...state,
              error: 'Erro ao verificar email',
              loadingStates: { ...state.loadingStates, auth: false }
            }))
            throw error
          }
        },

        resendVerificationEmail: async () => {
          set(state => ({ 
            ...state,
            loadingStates: { ...state.loadingStates, auth: true },
            error: null 
          }))
          
          try {
            await apiRequest('/api/auth/resend-verification', {
              method: 'POST'
            })
            
            set(state => ({
              ...state,
              loadingStates: { ...state.loadingStates, auth: false }
            }))
            
          } catch (error) {
            console.error('Erro ao reenviar email:', error)
            set(state => ({
              ...state,
              error: 'Erro ao reenviar email de verificação',
              loadingStates: { ...state.loadingStates, auth: false }
            }))
            throw error
          }
        },

        changePassword: async (currentPassword: string, newPassword: string) => {
          set(state => ({ 
            ...state,
            loadingStates: { ...state.loadingStates, userUpdate: true },
            error: null 
          }))
          
          try {
            await apiRequest('/api/user/change-password', {
              method: 'PATCH',
              body: JSON.stringify({ currentPassword, newPassword })
            })
            
            set(state => ({
              ...state,
              loadingStates: { ...state.loadingStates, userUpdate: false }
            }))
            
          } catch (error) {
            console.error('Erro ao alterar senha:', error)
            set(state => ({
              ...state,
              error: 'Erro ao alterar senha',
              loadingStates: { ...state.loadingStates, userUpdate: false }
            }))
            throw error
          }
        },

        requestPasswordReset: async (email: string) => {
          set(state => ({ 
            ...state,
            loadingStates: { ...state.loadingStates, auth: true },
            error: null 
          }))
          
          try {
            await apiRequest('/api/auth/forgot-password', {
              method: 'POST',
              body: JSON.stringify({ email })
            })
            
            set(state => ({
              ...state,
              loadingStates: { ...state.loadingStates, auth: false }
            }))
            
          } catch (error) {
            console.error('Erro ao solicitar reset de senha:', error)
            set(state => ({
              ...state,
              error: 'Erro ao solicitar redefinição de senha',
              loadingStates: { ...state.loadingStates, auth: false }
            }))
            throw error
          }
        },

        resetPassword: async (token: string, newPassword: string) => {
          set(state => ({ 
            ...state,
            loadingStates: { ...state.loadingStates, auth: true },
            error: null 
          }))
          
          try {
            const response = await apiRequest('/api/auth/reset-password', {
              method: 'POST',
              body: JSON.stringify({ token, password: newPassword })
            })
            
            const { user: apiUser, token: authToken } = response
            
            setStoredToken(authToken)
            
            set(state => ({
              ...state,
              user: apiUser,
              isAuthenticated: true,
              token: authToken,
              loadingStates: { ...state.loadingStates, auth: false }
            }))
            
            return { user: apiUser, redirectPath: getRedirectPath(apiUser.type) }
            
          } catch (error) {
            console.error('Erro ao redefinir senha:', error)
            set(state => ({
              ...state,
              error: 'Erro ao redefinir senha',
              loadingStates: { ...state.loadingStates, auth: false }
            }))
            throw error
          }
        },

        // ================================================================
        // AÇÕES DE AUTORIZAÇÃO E VERIFICAÇÃO
        // ================================================================
        
        hasPermission: (permission: string) => {
          const { user } = get()
          if (!user || user.type !== 'ADMIN' || !user.admin) return false
          return user.admin.permissions.includes(permission)
        },

        hasRole: (role: UserType) => {
          const { user } = get()
          return user?.type === role
        },

        canAccess: (requiredRole: UserType | UserType[]) => {
          const { user } = get()
          if (!user) return false
          
          if (Array.isArray(requiredRole)) {
            return requiredRole.includes(user.type)
          }
          
          return user.type === requiredRole
        },

        getRedirectPath: () => {
          const { user } = get()
          return user ? getRedirectPath(user.type) : '/login'
        },

        // Implementações para testes e funcionalidades avançadas
        setUser: (user: User | null) => {
          set(state => ({ 
            ...state, 
            user, 
            isAuthenticated: !!user 
          }))
        },

        useAdminActions: () => {
          const { user, canAccess } = get()
          return {
            canViewStats: user?.type === 'ADMIN' && canAccess('ADMIN'),
            canManageUsers: user?.type === 'ADMIN' && canAccess('ADMIN'),
            fetchUserStats: async () => {
              // Implementação seria aqui
            },
            fetchUsers: async () => {
              // Implementação seria aqui  
            }
          }
        },

        useSellerActions: () => {
          const { user, canAccess } = get()
          return {
            canManageProducts: user?.type === 'SELLER' && canAccess('SELLER'),
            canViewOrders: user?.type === 'SELLER' && canAccess('SELLER')
          }
        },

        useBuyerActions: () => {
          const { user, canAccess } = get()
          return {
            canPurchase: user?.type === 'BUYER' && canAccess('BUYER'),
            canReview: user?.type === 'BUYER' && canAccess('BUYER')
          }
        },

        useRoleBasedRedirect: () => {
          const { user, getRedirectPath } = get()
          return {
            redirectPath: user ? getRedirectPath() : '/login',
            shouldRedirect: !!user
          }
        },

        useRouteAccess: (requiredRole: UserType | UserType[], requiredPermissions?: string[]) => {
          const { canAccess, hasPermission, user, isAuthenticated, loadingStates } = get()
          
          const hasAccess = () => {
            if (!isAuthenticated) return false
            
            // Verificar role
            const hasRole = canAccess(requiredRole)
            if (!hasRole) return false
            
            // Verificar permissões específicas (para admins)
            if (requiredPermissions && requiredPermissions.length > 0) {
              return requiredPermissions.every(permission => hasPermission(permission))
            }
            
            return true
          }
          
          return {
            hasAccess: hasAccess(),
            user,
            isAuthenticated,
            isLoading: loadingStates.auth
          }
        }
      }),
      {
        name: 'unified-auth-storage',
        skipHydration: true,
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated
        })
      }
    )
  )
)

// ============================================================================
// HOOKS ESPECIALIZADOS
// ============================================================================

// Hook personalizado para hidratar o store
import React from 'react'

export const useAuthStoreHydration = () => {
  React.useEffect(() => {
    useAuthStore.persist.rehydrate()
  }, [])
}

// Removido useAuth duplicado - usar hooks/useAuth.ts

export const useUserManagement = () => {
  const {
    users,
    selectedUser,
    filters,
    loadingStates,
    fetchUsers,
    fetchUser,
    updateUserStatus,
    deleteUser,
    promoteUser,
    setFilters,
    resetFilters,
    nextPage,
    prevPage,
    error
  } = useAuthStore()
  
  return {
    users,
    selectedUser,
    filters,
    isLoading: loadingStates.users,
    isUpdating: loadingStates.userUpdate,
    isDeleting: loadingStates.userDelete,
    error,
    fetchUsers,
    fetchUser,
    updateUserStatus,
    deleteUser,
    promoteUser,
    setFilters,
    resetFilters,
    nextPage,
    prevPage
  }
}

export const usePermissions = () => {
  const { user, hasPermission, hasRole, canAccess } = useAuthStore()
  
  const isAdmin = user?.type === 'ADMIN'
  const isSeller = user?.type === 'SELLER'
  const isBuyer = user?.type === 'BUYER'
  
  return {
    hasPermission,
    hasRole,
    canAccess,
    isAdmin,
    isSeller,
    isBuyer,
    permissions: user?.admin?.permissions || [],
    userType: user?.type,
    isAuthenticated: !!user
  }
}

export const useStoreData = () => {
  const user = useAuthStore(state => state.user)
  
  return {
    sellerId: user?.seller?.id,
    storeName: user?.seller?.storeName,
    rating: user?.seller?.rating || 0,
    totalSales: user?.seller?.totalSales || 0,
    plan: user?.seller?.plan,
    isVerified: user?.seller?.store?.isVerified || false,
    hasSeller: !!(user?.seller)
  }
}

export const useBuyerData = () => {
  const user = useAuthStore(state => state.user)
  
  return {
    buyerId: user?.buyer?.id,
    wishlistCount: user?.buyer?.wishlistCount || 0,
    orderCount: user?.buyer?.orderCount || 0,
    hasBuyer: !!(user?.buyer)
  }
}

export const useAuthInit = () => {
  const { checkAuth, loadingStates, isAuthenticated } = useAuthStore()
  
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'test') {
      checkAuth()
    }
  }, [checkAuth])
  
  return {
    isLoading: loadingStates.auth,
    isAuthenticated,
    isInitialized: !loadingStates.auth
  }
}

// Hook para redirecionamento automático baseado em role
export const useRoleBasedRedirect = () => {
  const { user, getRedirectPath } = useAuthStore()
  
  const getDefaultPath = () => getRedirectPath()
  
  const shouldRedirect = (currentPath: string) => {
    if (!user) return false
    
    const defaultPath = getDefaultPath()
    const userType = user.type
    
    // Regras de redirecionamento
    if (userType === 'ADMIN' && !currentPath.startsWith('/admin')) {
      return defaultPath
    }
    
    if (userType === 'SELLER' && !currentPath.startsWith('/seller')) {
      return defaultPath
    }
    
    if (userType === 'BUYER' && (currentPath.startsWith('/admin') || currentPath.startsWith('/seller'))) {
      return defaultPath
    }
    
    return false
  }
  
  return {
    getDefaultPath,
    shouldRedirect,
    userType: user?.type
  }
}

// Hook para verificação de acesso a rotas
export const useRouteAccess = (requiredRole: UserType | UserType[], requiredPermissions?: string[]) => {
  const { canAccess, hasPermission, user, isAuthenticated, loadingStates } = useAuthStore()
  
  const hasAccess = React.useMemo(() => {
    if (!isAuthenticated) return false
    
    // Verificar role
    const hasRole = canAccess(requiredRole)
    if (!hasRole) return false
    
    // Verificar permissões específicas (para admins)
    if (requiredPermissions && requiredPermissions.length > 0) {
      return requiredPermissions.every(permission => hasPermission(permission))
    }
    
    return true
  }, [canAccess, hasPermission, isAuthenticated, requiredRole, requiredPermissions])
  
  return {
    hasAccess,
    isAuthenticated,
    userType: user?.type,
    isLoading: loadingStates.auth // Usar loading state correto
  }
}

// Hook para funcionalidades específicas do admin
export const useAdminActions = () => {
  const {
    fetchUsers,
    fetchUser,
    updateUserStatus,
    deleteUser,
    promoteUser,
    fetchUserStats,
    users,
    selectedUser,
    stats,
    loadingStates
  } = useAuthStore()
  
  const { hasPermission } = usePermissions()
  
  return {
    // Dados
    users,
    selectedUser,
    stats,
    
    // Estados de loading
    isLoading: loadingStates.users,
    isUpdating: loadingStates.userUpdate,
    isDeleting: loadingStates.userDelete,
    
    // Ações
    fetchUsers,
    fetchUser,
    updateUserStatus: hasPermission('users.update') ? updateUserStatus : undefined,
    deleteUser: hasPermission('users.delete') ? deleteUser : undefined,
    promoteUser: hasPermission('users.promote') ? promoteUser : undefined,
    fetchUserStats: hasPermission('analytics.view') ? fetchUserStats : undefined,
    
    // Permissões
    canManageUsers: hasPermission('users.manage'),
    canViewStats: hasPermission('analytics.view')
  }
}

// Hook para funcionalidades do seller
export const useSellerActions = () => {
  const user = useAuthStore(state => state.user)
  const { updateProfile, loadingStates } = useAuthStore()
  
  const sellerData = user?.seller
  
  return {
    // Dados do seller
    sellerId: sellerData?.id,
    storeName: sellerData?.storeName,
    rating: sellerData?.rating || 0,
    totalSales: sellerData?.totalSales || 0,
    plan: sellerData?.plan,
    isVerified: sellerData?.store?.isVerified || false,
    storeData: sellerData?.store,
    
    // Estados
    isUpdating: loadingStates.userUpdate,
    
    // Ações
    updateProfile,
    
    // Status
    isSeller: !!sellerData,
    hasStore: !!(sellerData?.store)
  }
}

// Hook para funcionalidades do buyer
export const useBuyerActions = () => {
  const user = useAuthStore(state => state.user)
  const { updateProfile, loadingStates } = useAuthStore()
  
  const buyerData = user?.buyer
  
  return {
    // Dados do buyer
    buyerId: buyerData?.id,
    wishlistCount: buyerData?.wishlistCount || 0,
    orderCount: buyerData?.orderCount || 0,
    addresses: buyerData?.addresses || [],
    
    // Estados
    isUpdating: loadingStates.userUpdate,
    
    // Ações
    updateProfile,
    
    // Status
    isBuyer: !!buyerData,
    hasAddresses: !!(buyerData?.addresses?.length)
  }
}