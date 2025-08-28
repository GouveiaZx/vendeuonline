// Tipos TypeScript para o banco de dados Supabase
// Gerados automaticamente mas podem ser customizados

export type UserType = 'ADMIN' | 'SELLER' | 'BUYER';

export type SecurityEventType = 
  | 'ADMIN_LOGIN'
  | 'ADMIN_REGISTER'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_SUCCESS'
  | 'PROFILE_UPDATE'
  | 'FAILED_LOGIN_ATTEMPT'
  | 'ACCOUNT_LOCKED'
  | 'SUSPICIOUS_ACTIVITY';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          password: string;
          phone: string | null;
          type: UserType;
          city: string | null;
          state: string | null;
          avatar: string | null;
          is_verified: boolean;
          password_changed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          password: string;
          phone?: string | null;
          type?: UserType;
          city?: string | null;
          state?: string | null;
          avatar?: string | null;
          is_verified?: boolean;
          password_changed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          password?: string;
          phone?: string | null;
          type?: UserType;
          city?: string | null;
          state?: string | null;
          avatar?: string | null;
          is_verified?: boolean;
          password_changed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      admins: {
        Row: {
          id: string;
          user_id: string;
          security_question: string | null;
          security_answer: string | null;
          permissions: string[];
          last_login_at: string | null;
          login_attempts: number;
          is_active: boolean;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          security_question?: string | null;
          security_answer?: string | null;
          permissions?: string[];
          last_login_at?: string | null;
          login_attempts?: number;
          is_active?: boolean;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          security_question?: string | null;
          security_answer?: string | null;
          permissions?: string[];
          last_login_at?: string | null;
          login_attempts?: number;
          is_active?: boolean;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      sellers: {
        Row: {
          id: string;
          user_id: string;
          store_name: string;
          store_description: string | null;
          store_slug: string;
          address: string | null;
          zip_code: string | null;
          category: string;
          plan: string;
          is_active: boolean;
          rating: number;
          total_sales: number;
          commission: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          store_name: string;
          store_description?: string | null;
          store_slug: string;
          address?: string | null;
          zip_code?: string | null;
          category?: string;
          plan?: string;
          is_active?: boolean;
          rating?: number;
          total_sales?: number;
          commission?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          store_name?: string;
          store_description?: string | null;
          store_slug?: string;
          address?: string | null;
          zip_code?: string | null;
          category?: string;
          plan?: string;
          is_active?: boolean;
          rating?: number;
          total_sales?: number;
          commission?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      buyers: {
        Row: {
          id: string;
          user_id: string;
          preferences: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          preferences?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          preferences?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      security_events: {
        Row: {
          id: string;
          event_type: SecurityEventType;
          user_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: SecurityEventType;
          user_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: SecurityEventType;
          user_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Record<string, any>;
          created_at?: string;
        };
      };
      password_reset_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          expires_at: string;
          used: boolean;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          expires_at: string;
          used?: boolean;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          expires_at?: string;
          used?: boolean;
          used_at?: string | null;
          created_at?: string;
        };
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          token_hash: string;
          ip_address: string | null;
          user_agent: string | null;
          is_active: boolean;
          expires_at: string;
          created_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          token_hash: string;
          ip_address?: string | null;
          user_agent?: string | null;
          is_active?: boolean;
          expires_at: string;
          created_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          token_hash?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          is_active?: boolean;
          expires_at?: string;
          created_at?: string;
          ended_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cleanup_expired_tokens: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      user_type: UserType;
      security_event_type: SecurityEventType;
    };
  };
}

// Tipos derivados para uso na aplicação
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Admin = Database['public']['Tables']['admins']['Row'];
export type AdminInsert = Database['public']['Tables']['admins']['Insert'];
export type AdminUpdate = Database['public']['Tables']['admins']['Update'];

export type Seller = Database['public']['Tables']['sellers']['Row'];
export type SellerInsert = Database['public']['Tables']['sellers']['Insert'];
export type SellerUpdate = Database['public']['Tables']['sellers']['Update'];

export type Buyer = Database['public']['Tables']['buyers']['Row'];
export type BuyerInsert = Database['public']['Tables']['buyers']['Insert'];
export type BuyerUpdate = Database['public']['Tables']['buyers']['Update'];

export type SecurityEvent = Database['public']['Tables']['security_events']['Row'];
export type SecurityEventInsert = Database['public']['Tables']['security_events']['Insert'];

export type PasswordResetToken = Database['public']['Tables']['password_reset_tokens']['Row'];
export type PasswordResetTokenInsert = Database['public']['Tables']['password_reset_tokens']['Insert'];

export type UserSession = Database['public']['Tables']['user_sessions']['Row'];
export type UserSessionInsert = Database['public']['Tables']['user_sessions']['Insert'];

// Tipos compostos para dados relacionados
export interface UserWithProfile extends User {
  admin?: Admin;
  seller?: Seller;
  buyer?: Buyer;
}

export interface UserWithStore extends User {
  seller?: Seller;
  stores?: any[]; // Tipo da tabela stores seria definido em outro arquivo
}

// Utilitários de tipo
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Constantes derivadas dos enums
export const USER_TYPES: UserType[] = ['ADMIN', 'SELLER', 'BUYER'] as const;
export const SECURITY_EVENT_TYPES: SecurityEventType[] = [
  'ADMIN_LOGIN',
  'ADMIN_REGISTER',
  'PASSWORD_RESET_REQUEST',
  'PASSWORD_RESET_SUCCESS',
  'PROFILE_UPDATE',
  'FAILED_LOGIN_ATTEMPT',
  'ACCOUNT_LOCKED',
  'SUSPICIOUS_ACTIVITY'
] as const;