// ============================================================================
// ARQUIVO CENTRAL DE TIPOS - PROJETO VENDEU ONLINE (VERSÃO LIMPA)
// ============================================================================

// ============================================================================
// ENUMS E CONSTANTES
// ============================================================================

export type UserType = 'BUYER' | 'SELLER' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'BANNED'
export type SellerPlan = 'GRATUITO' | 'MICRO_EMPRESA' | 'PEQUENA_EMPRESA' | 'EMPRESA_SIMPLES' | 'EMPRESA_PLUS'

// Order related enums
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'BOLETO' | 'WHATSAPP'
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED'

// Compatibility with external APIs (lowercase versions)
export type OrderStatusLower = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentBillingType = 'PIX' | 'CREDIT_CARD' | 'BOLETO' | string
export type PaymentStatusType = 'PENDING' | 'CONFIRMED' | 'RECEIVED' | 'OVERDUE' | 'REFUNDED' | 'AWAITING_RISK_ANALYSIS' | string
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PENDING' | string

// Coupon related enums
export type CouponType = 'percentage' | 'fixed_amount'
export type CouponStatus = 'active' | 'inactive' | 'expired' | 'used_up'
export type CouponCategoryType = 'general' | 'first_purchase' | 'category_specific' | 'product_specific' | 'store_specific'

export enum CouponValidationError {
  COUPON_NOT_FOUND = 'COUPON_NOT_FOUND',
  COUPON_EXPIRED = 'COUPON_EXPIRED',
  COUPON_INACTIVE = 'COUPON_INACTIVE',
  COUPON_NOT_STARTED = 'COUPON_NOT_STARTED',
  COUPON_NOT_YET_VALID = 'COUPON_NOT_YET_VALID',
  MINIMUM_ORDER_VALUE_NOT_MET = 'MINIMUM_ORDER_VALUE_NOT_MET',
  USAGE_LIMIT_EXCEEDED = 'USAGE_LIMIT_EXCEEDED',
  USER_LIMIT_EXCEEDED = 'USER_LIMIT_EXCEEDED',
  FIRST_PURCHASE_ONLY = 'FIRST_PURCHASE_ONLY',
  STORE_RESTRICTION = 'STORE_RESTRICTION',
  CATEGORY_RESTRICTION = 'CATEGORY_RESTRICTION',
  PRODUCT_RESTRICTION = 'PRODUCT_RESTRICTION',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  ALREADY_APPLIED = 'ALREADY_APPLIED'
}

// Chat related enums
export type ChatSenderType = 'customer' | 'agent' | 'system'
export type ChatMessageType = 'text' | 'image' | 'file' | 'audio' | 'video'
export type ChatStatus = 'active' | 'waiting' | 'closed'
export type ChatPriority = 'low' | 'medium' | 'high'
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed'

// ============================================================================
// INTERFACES BASE PARA USUÁRIOS
// ============================================================================

export interface BaseUser {
  id: string
  name: string
  email: string
  phone: string
  city: string
  state: string
  type: UserType
  avatar?: string
  isVerified: boolean
  createdAt: string
  updatedAt: string
  status?: UserStatus
  lastLogin?: string
}

// Perfil específico para compradores
export interface BuyerProfile {
  id: string
  userId: string
  wishlistCount?: number
  orderCount?: number
  addresses?: Address[]
}

// Perfil específico para vendedores  
export interface SellerProfile {
  id: string
  userId: string
  storeName: string
  storeDescription: string
  storeSlug: string
  cnpj?: string
  address: string
  zipCode: string
  category: string
  plan: SellerPlan
  planUpdatedAt?: string
  isActive: boolean
  rating: number
  totalSales: number
  commission: number
  store?: Store
}

// Perfil específico para administradores
export interface AdminProfile {
  id: string
  userId: string
  permissions: string[]
  lastLogin?: string
}

// Interface User unificada
export interface User extends BaseUser {
  buyer?: BuyerProfile
  seller?: SellerProfile
  admin?: AdminProfile
  
  // Propriedades calculadas (opcionais)
  storeCount?: number
  orderCount?: number
  exp?: number
}

// Interface para Store com contadores (usada em componentes virtualizados)
export interface StoreWithCounts extends Omit<Store, 'reviewCount'> {
  productCount: number
  reviewCount: number
  _count?: {
    products: number;
    reviews: number;
  };
}

// ============================================================================
// INTERFACES PARA AUTENTICAÇÃO
// ============================================================================

export interface AuthTokenPayload {
  userId: string
  email: string
  type: UserType
  iat?: number
  exp?: number
  expiresIn?: string
  isAdmin?: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  phone: string
  password: string
  type: UserType
  city: string
  state: string
  storeName?: string
  storeDescription?: string
  cnpj?: string
  address?: string
  zipCode?: string
  category?: string
}

export interface AuthResponse {
  user: User
  token: string
  message?: string
}

// ============================================================================
// INTERFACES PARA STORES (ZUSTAND)
// ============================================================================

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  error: string | null
}

export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<{ user: User; redirectPath: string }>
  register: (userData: RegisterData) => Promise<{ user: User; redirectPath: string }>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  setLoading: (loading: boolean) => void
  checkAuth: () => Promise<void>
  clearError: () => void
}

export type AuthStore = AuthState & AuthActions

// ============================================================================
// INTERFACES PARA LOJA E PRODUTOS
// ============================================================================

export interface Store {
  id: string
  sellerId: string
  name: string
  slug: string
  description: string
  logo?: string
  banner?: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  email: string
  whatsapp?: string
  website?: string
  category: string
  socialMedia?: {
    instagram?: string
    facebook?: string
    twitter?: string
    youtube?: string
  }
  seoTitle?: string
  seoDescription?: string
  rating: number
  reviewCount: number
  productCount: number
  salesCount: number
  isVerified: boolean
  isActive: boolean
  isFeatured?: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductImage {
  id: string
  url: string
  alt: string
  order: number
}

export interface Product {
  id: string
  sellerId: string
  storeId?: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  price: number
  comparePrice?: number
  costPrice?: number
  sku?: string
  barcode?: string
  category: string
  subcategory?: string
  brand?: string
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  images: string[] | ProductImage[]
  image?: string // Compatibility: first image URL
  specifications?: Record<string, any>
  tags: string[]
  stock: number
  minStock?: number
  trackStock: boolean
  allowBackorder: boolean
  isActive: boolean
  isFeatured: boolean
  rating: number
  reviewCount: number
  salesCount: number
  viewCount: number
  seoTitle?: string
  seoDescription?: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// INTERFACES PARA ENDEREÇOS
// ============================================================================

export interface Address {
  id: string
  buyerId: string
  name: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  isDefault: boolean
  createdAt: string
}

// ============================================================================
// INTERFACES PARA PEDIDOS
// ============================================================================

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  product?: Product
}

export interface Order {
  id: string
  buyerId: string
  sellerId?: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
  paymentMethod: PaymentMethod
  paymentId?: string
  paymentStatus?: PaymentStatus
  shippingAddress: Address
  billingAddress?: Address
  trackingCode?: string
  notes?: string
  createdAt: string
  updatedAt: string
  buyer?: User
  seller?: User
}

// ============================================================================
// INTERFACES PARA REVIEWS
// ============================================================================

export interface Review {
  id: string
  userId: string
  productId?: string
  storeId?: string
  orderId?: string
  rating: number
  title?: string
  comment?: string
  images?: string[]
  isVerified: boolean
  isReported: boolean
  helpfulCount: number
  createdAt: string
  updatedAt: string
  user?: User
  product?: Product
  store?: Store
}

// ============================================================================
// INTERFACES PARA WISHLIST
// ============================================================================

export interface Wishlist {
  id: string
  buyerId: string
  productId: string
  createdAt: string
  product?: Product
}

// ============================================================================
// INTERFACES PARA API RESPONSES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  statusCode?: number
  timestamp?: string
  requestId?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ============================================================================
// INTERFACES PARA FILTROS E BUSCA
// ============================================================================

export interface SearchFilters {
  // Text search
  q?: string
  query?: string
  search?: string
  
  // Category filters
  category?: string
  subcategory?: string
  categories?: string[]
  brand?: string
  
  // Price filters
  minPrice?: number
  maxPrice?: number
  priceRange?: [number, number] | { min?: number; max?: number; } | string
  
  // Location filters
  city?: string
  state?: string
  location?: { lat: number; lng: number; radius: number; } | string
  radius?: number
  lat?: number
  lng?: number
  
  // Product filters
  inStock?: boolean
  hasDiscount?: boolean
  rating?: number
  minRating?: number
  
  // Store filters
  storeId?: string
  storeIds?: string[]
  storeName?: string
  verified?: boolean
  
  // Sorting and pagination
  sortBy?: 'relevance' | 'name' | 'price' | 'rating' | 'newest' | 'oldest' | 'sales' | 'popularity' | 'distance' | 'price_asc' | 'price_desc'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
  
  // Search type
  type?: 'products' | 'stores' | 'all'
  
  // Options
  includeSuggestions?: boolean
  includeFilters?: boolean
}

export interface SearchResult<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters?: SearchFilters
  facets?: Record<string, Array<{ value: string; count: number }>>
}

// ============================================================================
// TIPOS PARA SEARCH ADICIONAIS (que estavam faltando)
// ============================================================================

export interface SearchSuggestions {
  products: Array<{
    id: string;
    name: string;
    image?: string;
    price: number;
    category?: string;
  }>;
  stores: Array<{
    id: string;
    name: string;
    slug: string;
    image?: string;
    category?: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    productCount?: number;
  }>;
  keywords: string[];
}

export interface SearchPagination {
  page: number;
  currentPage: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SearchAggregatedFilters {
  priceRange: {
    min: number;
    max: number;
  };
  categories: string[];
  locations: Array<{
    city: string;
    state: string;
    count: number;
  }>;
  ratings: Array<{
    rating: number;
    count: number;
  }>;
  brands: Array<{
    name: string;
    count: number;
  }>;
}

// Removido - usando SearchFilters única

export interface SearchResultComprehensive<T = any> extends Omit<SearchResult<T>, 'filters' | 'pagination'> {
  products?: SearchProduct[];
  stores?: SearchStoreData[];
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    productCount?: number;
  }>;
  pagination?: SearchPagination;
  aggregations?: SearchAggregatedFilters;
  filters?: SearchAggregatedFilters;
  suggestions?: SearchSuggestions;
}

export interface SearchHistory {
  recent: Array<{
    query: string;
    resultsCount: number;
  }>;
  trending: Array<string | {
    query: string;
    resultsCount: number;
  }>;
}

export interface SearchState {
  query: string;
  filters: SearchFilters;
  results: SearchResultComprehensive | null;
  isLoading: boolean;
  error: string | null;
  suggestions: SearchSuggestions | null;
  history: SearchHistory;
  showFilters: boolean;
  showSuggestions: boolean;
}

export interface SearchActions {
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  search: (query?: string, filters?: Partial<SearchFilters>) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
  getSuggestions: (query: string) => Promise<void>;
  saveSearch: (query: string) => void;
  getHistory: () => string[];
  clearHistory: () => void;
  deleteSearch: (query: string) => void;
  loadHistory: () => Promise<void>;
  toggleFilters: () => void;
  toggleSuggestions: () => void;
}

// SearchStore para Zustand (Store de estado)
export interface SearchStoreState extends SearchState, SearchActions {}

export interface SearchApiResponse {
  success: boolean;
  data: SearchResult;
  message?: string;
}

export interface SuggestionsApiResponse {
  success: boolean;
  data: SearchSuggestions;
  message?: string;
}

export interface HistoryApiResponse {
  success: boolean;
  data: { history: string[] };
  message?: string;
}

// ============================================================================
// INTERFACES PARA BANNERS
// ============================================================================

export interface Banner {
  id: string
  title: string
  description?: string
  imageUrl: string
  link?: string
  isActive: boolean
  position: number
  startDate?: Date
  endDate?: Date
  clicks?: number
  impressions?: number
  createdAt: Date
  updatedAt: Date
}

export interface BannerFilters {
  isActive?: boolean
  search?: string
  position?: number
}

// ============================================================================
// CONFIGURAÇÕES E TIPOS AUXILIARES
// ============================================================================

export interface AppConfig {
  name: string
  url: string
  version: string
  environment: 'development' | 'staging' | 'production'
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ============================================================================
// TIPOS UTILITÁRIOS
// ============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// ============================================================================
// INTERFACES PARA CUPONS DE DESCONTO
// ============================================================================

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minimumOrderValue: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerCustomer: number;
  usedCount: number;
  isActive: boolean;
  isAutoApply: boolean;
  autoApplyCategory?: string;
  autoApplyFirstPurchase: boolean;
  startDate: string;
  endDate?: string;
  storeId?: string;
  storeName?: string;
  applicableCategories?: string[];
  applicableProducts?: string[];
  applicableStores?: string[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CouponValidation {
  isValid: boolean;
  message?: string;
  errors?: Array<{
    message: string;
    code: CouponValidationError;
  }>;
  discountAmount?: number;
  finalTotal?: number;
  appliedRules?: string[];
  couponId?: string;
  couponName?: string;
  discountType?: CouponType;
  discountValue?: number;
}

export interface CouponApplication {
  couponId: string;
  couponCode: string;
  couponName: string;
  discountType: CouponType;
  discountValue: number;
  discountAmount: number;
  finalTotal: number;
  savings: number;
  success?: boolean;
  usageId?: string;
  errorMessage?: string;
  originalTotal?: number;
}

export interface CouponContext {
  userId?: string;
  orderId?: string;
  storeId?: string;
  categories?: string[];
  productIds?: string[];
  orderTotal?: number;
  orderValue?: number;
  cartTotal: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    category?: string;
    storeId?: string;
  }>;
  isFirstPurchase?: boolean;
  appliedCoupons?: string[];
}

export interface AppliedCoupon {
  id: string;
  code: string;
  name: string;
  discountType: CouponType;
  discountValue: number;
  discountAmount: number;
  savings: number;
  usageId?: string;
  appliedAt?: string;
}

export interface AvailableCoupon {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: CouponType;
  discountValue: number;
  type: CouponType;
  value: number;
  isAutoApply: boolean;
  estimatedSavings?: number;
  canApply?: boolean;
  reason?: string;
  estimatedDiscount?: number;
  isApplicable?: boolean;
  isAutomatic?: boolean;
  isFirstPurchase?: boolean;
  applicableStores?: string[];
  applicableCategories?: string[];
  applicableProducts?: string[];
  minimumOrderValue?: number;
  maximumDiscountAmount?: number;
  endDate?: string;
  usageLimit?: number;
  usedCount?: number;
}

export interface AutoCoupon {
  id: string;
  name: string;
  code: string;
  description: string;
  type: CouponType;
  value: number;
  condition: 'first_purchase' | 'category' | 'minimum_amount' | 'product_specific';
  conditionValue?: string | number;
  isActive: boolean;
  priority: number;
  estimatedSavings?: number;
  savings?: number;
  isCategory?: boolean;
  isFirstPurchase?: boolean;
}

// ============================================================================
// TIPOS PARA CUPONS ADICIONAIS (que estavam faltando)
// ============================================================================

export interface CouponUsage {
  id: string;
  couponId: string;
  userId: string;
  userName?: string;
  orderId?: string;
  usedAt: string;
  discountAmount: number;
}

export interface CouponStats {
  id: string;
  couponId: string;
  totalUsage: number;
  totalOrders: number;
  totalDiscount: number;
  uniqueUsers: number;
  conversionRate: number;
  averageOrderValue: number;
  topCategories: Array<{ category: string; count: number }>;
  usageByDay: Array<{ date: string; count: number; discount: number }>;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponData {
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minimumOrderValue?: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerCustomer?: number;
  isActive?: boolean;
  isAutoApply?: boolean;
  autoApplyCategory?: string;
  autoApplyFirstPurchase?: boolean;
  startDate: string;
  endDate?: string;
  storeId?: string;
  applicableCategories?: string[];
  applicableProducts?: string[];
  applicableStores?: string[];
}

export interface UpdateCouponData extends Partial<CreateCouponData> {
  id: string;
}

export interface CouponFilter {
  search?: string;
  status?: CouponStatus;
  type?: CouponType;
  storeId?: string;
  category?: string;
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'code' | 'value' | 'usedCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// INTERFACES PARA PAGAMENTOS
// ============================================================================

export interface CreatePaymentSuccessResponse {
  success: true;
  payment_id: string;
  payment_url?: string;
  pix_code?: string;
  pix_qr_code?: string;
  subscription_id: string;
  external_reference: string;
}

export interface ApiErrorResponse {
  error: string;
  success?: false;
}

export type CreatePaymentResponse = CreatePaymentSuccessResponse | ApiErrorResponse;

export interface PlanSummary {
  id: string;
  name: string;
  slug: string;
  price: number;
  features: string[];
}

export interface SubscriptionInfo {
  id: string;
  status: SubscriptionStatus;
  plan: PlanSummary;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentInfo {
  id: string;
  status: PaymentStatusType;
  billing_type: PaymentBillingType;
  value: number;
  net_value?: number;
  date_created?: string;
  due_date?: string;
  payment_date?: string | null;
  invoice_url?: string | null;
}

export interface PaymentStatusResponse {
  subscription: SubscriptionInfo;
  payment: PaymentInfo | null;
}

// ============================================================================
// INTERFACES PARA COMISSÕES
// ============================================================================

export interface CommissionRate {
  id: string;
  categoryId: string;
  categoryName?: string;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
  minAmount?: number;
  maxAmount?: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionTransaction {
  id: string;
  orderId: string;
  storeId: string;
  storeName?: string;
  categoryId: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  commissionType: 'percentage' | 'fixed';
  status: 'pending' | 'calculated' | 'paid' | 'cancelled';
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionPayout {
  id: string;
  storeId: string;
  storeName?: string;
  period: string;
  amount: number;
  totalCommission: number;
  totalPayout: number;
  transactionCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedAt?: string;
  processedBy?: string;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// TIPOS PARA COMMISSION ADICIONAIS (que estavam faltando)
// ============================================================================

export interface CreateCommissionRateData {
  categoryId: string;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
  minAmount?: number;
  maxAmount?: number;
  isActive?: boolean;
}

export interface CreateCommissionPayoutData {
  storeId: string;
  period: string;
  paymentMethod?: string;
  notes?: string;
}

export interface StoreCommissionStats {
  storeId: string;
  storeName: string;
  totalCommission: number;
  totalPayout: number;
  pendingCommission: number;
  transactionCount: number;
  lastPayoutDate?: string;
}

export interface CategoryCommissionStats {
  categoryId: string;
  categoryName: string;
  totalCommission: number;
  transactionCount: number;
  averageCommissionRate: number;
}

export interface CommissionTransactionFilters {
  storeId?: string;
  categoryId?: string;
  status?: 'pending' | 'calculated' | 'paid' | 'cancelled';
  dateFrom?: string;
  dateTo?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'amount' | 'commissionAmount';
  sortOrder?: 'asc' | 'desc';
}

export interface CommissionPayoutFilters {
  storeId?: string;
  sellerId?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  period?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'amount' | 'period';
  sortOrder?: 'asc' | 'desc';
}

export interface CommissionTransactionResponse {
  success: boolean;
  data: {
    transactions: CommissionTransaction[];
    pagination: PaginationResponse['pagination'];
    stats?: {
      total: number;
      pending: number;
      paid: number;
      totalAmount: number;
      totalCommission: number;
    };
  };
  message?: string;
}

export interface CommissionPayoutResponse {
  success: boolean;
  data: {
    payouts: CommissionPayout[];
    pagination: PaginationResponse['pagination'];
    stats?: {
      total: number;
      pending: number;
      completed: number;
      totalAmount: number;
      averageAmount: number;
    };
  };
  message?: string;
}

export interface CommissionStatsResponse {
  success: boolean;
  data: {
    overview: {
      totalCommission: number;
      totalPayout: number;
      pendingCommission: number;
      completedPayouts: number;
    };
    summary: {
      totalCommission: number;
      totalPayout: number;
      pendingCommission: number;
      completedPayouts: number;
      averageCommissionRate: number;
      totalOrders: number;
      paidCommission: number;
      totalOrderValue: number;
    };
    storeStats: StoreCommissionStats[];
    categoryStats: CategoryCommissionStats[];
    monthlyTrends: Array<{
      month: string;
      commission: number;
      payout: number;
    }>;
  };
  message?: string;
}

// ============================================================================
// INTERFACES PARA CHAT E WHATSAPP
// ============================================================================

export interface ChatMessage {
  id: string;
  sessionId: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderType: ChatSenderType;
  content: string;
  type: ChatMessageType;
  messageType: ChatMessageType;
  timestamp: Date;
  read: boolean;
  isRead: boolean;
  status: MessageStatus;
  metadata?: {
    whatsappMessageId?: string;
    [key: string]: any;
  };
}

export interface ChatSession {
  id: string;
  customer_phone: string;
  customer_name?: string;
  status: ChatStatus;
  priority: ChatPriority;
  category?: string;
  tags?: string[];
  assigned_agent_id?: string;
  store_id?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INTERFACES CONSOLIDADAS PARA BUSCA
// ============================================================================

// Removido - SearchFiltersComprehensive duplicada, usando SearchFilters consolidada

export interface SearchProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  comparePrice?: number;
  rating: number;
  reviewCount: number;
  salesCount: number;
  image?: string;
  images: Array<{
    url: string;
    alt: string;
    order: number;
  }>;
  specifications?: Array<{
    name: string;
    value: string;
  }>;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  store: {
    id: string;
    name: string;
    slug: string;
    rating: number;
    city: string;
    state: string;
    isVerified: boolean;
  };
  storeId: string;
  storeName: string;
  sellerId: string;
  stock: number;
  inStock: boolean;
  discount?: number;
  createdAt: string;
}

// SearchStoreData para representar loja nos resultados de busca
export interface SearchStoreData {
  id: string;
  name: string;
  description?: string;
  rating: number;
  reviewCount: number;
  productCount: number;
  salesCount: number;
  city: string;
  state: string;
  category: string;
  sellerId: string;
  location?: string;
  isVerified: boolean;
  logo?: string;
  banner?: string;
  createdAt: string;
}

// SearchResultComprehensive já definida acima como extending SearchResult

// ============================================================================
// ALIASES FOR COMPATIBILITY
// ============================================================================

// Compatibility with existing code
export type { UserType as UserRole }
export type { BaseUser as UserProfile }

// Note: SearchFilters and SearchResult are already defined above
// Keeping SearchFiltersComprehensive and SearchResultComprehensive as extended versions

// Compatibility aliases for orders (to bridge differences between files)
export type { OrderStatusLower as OrderStatusCompat }

// Re-export for backward compatibility
export type { CouponValidation as CouponCodeValidation }