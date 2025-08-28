import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStoreSafe } from './useAuthStoreSafe';
import type { User, LoginCredentials } from '@/types';

interface UseAuthOptions {
  redirectTo?: string;
  redirectIfFound?: boolean;
  requiredUserType?: 'buyer' | 'seller' | 'admin';
}

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ user: User; redirectPath: string }>;
  register: (userData: any) => Promise<{ user: User; redirectPath: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  hasPermission: (requiredType: 'buyer' | 'seller' | 'admin') => boolean;
  isUserType: (type: 'buyer' | 'seller' | 'admin') => boolean;
}

export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const {
    redirectTo,
    redirectIfFound = false,
    requiredUserType
  } = options;

  const router = useRouter();
  
  // Use the safe auth store hook
  const { user, isAuthenticated, isLoading, login, register, logout, updateUser } = useAuthStoreSafe();

  useEffect(() => {
    // Redirecionar se usuário não está autenticado e é necessário
    if (!isLoading && !isAuthenticated && redirectTo && !redirectIfFound) {
      router.push(redirectTo);
      return;
    }

    // Redirecionar se usuário está autenticado e não deveria estar
    if (!isLoading && isAuthenticated && redirectTo && redirectIfFound) {
      router.push(redirectTo);
      return;
    }

    // Verificar se usuário tem o tipo necessário
    if (!isLoading && isAuthenticated && user && requiredUserType) {
      // Mapear tipos lowercase para uppercase
      const userTypeMap: Record<string, string> = {
        'buyer': 'BUYER',
        'seller': 'SELLER', 
        'admin': 'ADMIN'
      };
      
      const mappedRequiredType = userTypeMap[requiredUserType];
      if (user.type !== mappedRequiredType && user.type !== 'ADMIN') {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, redirectTo, redirectIfFound, requiredUserType, router]);

  // Função para verificar permissões
  const hasPermission = (requiredType: 'buyer' | 'seller' | 'admin'): boolean => {
    if (!user) return false;
    
    // Admin tem acesso a tudo
    if (user.type === 'ADMIN') return true;
    
    // Verificar tipo específico
    return user.type === requiredType.toUpperCase();
  };

  // Função para verificar tipo específico do usuário
  const isUserType = (type: 'buyer' | 'seller' | 'admin'): boolean => {
    return user?.type === type.toUpperCase();
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    hasPermission,
    isUserType
  };
}

// Hook especÃ­fico para proteger pÃ¡ginas
export function useRequireAuth(requiredUserType?: 'buyer' | 'seller' | 'admin') {
  return useAuth({
    redirectTo: '/login',
    requiredUserType
  });
}

// Hook para redirecionar usuÃ¡rios autenticados (ex: pÃ¡ginas de login)
export function useRedirectIfAuthenticated(redirectTo: string = '/') {
  return useAuth({
    redirectTo,
    redirectIfFound: true
  });
}

// Hook para verificar se usuÃ¡rio Ã© admin
export function useRequireAdmin() {
  return useAuth({
    redirectTo: '/login',
    requiredUserType: 'admin'
  });
}

// Hook para verificar se usuÃ¡rio Ã© vendedor
export function useRequireSeller() {
  return useAuth({
    redirectTo: '/login',
    requiredUserType: 'seller'
  });
}

// Hook para verificar se usuÃ¡rio Ã© comprador
export function useRequireBuyer() {
  return useAuth({
    redirectTo: '/login',
    requiredUserType: 'buyer'
  });
}
