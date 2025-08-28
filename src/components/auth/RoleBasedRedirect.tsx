'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useRoleBasedRedirect, useAuthInit } from '@/store/authStore';

interface RoleBasedRedirectProps {
  children: React.ReactNode;
}

export default function RoleBasedRedirect({ children }: RoleBasedRedirectProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { shouldRedirect, getDefaultPath, userType } = useRoleBasedRedirect();
  const { isAuthenticated, isInitialized } = useAuthInit();

  useEffect(() => {
    // Aguardar inicialização da autenticação
    if (!isInitialized) return;

    // Se não estiver autenticado e tentar acessar rotas protegidas
    if (!isAuthenticated) {
      const protectedRoutes = ['/admin', '/seller', '/buyer'];
      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
      
      if (isProtectedRoute) {
        router.replace('/login');
        return;
      }
    }

    // Se estiver autenticado, verificar redirecionamento baseado em role
    if (isAuthenticated) {
      const redirectPath = shouldRedirect(pathname);
      
      if (redirectPath) {
        console.log(`Redirecting ${userType} from ${pathname} to ${redirectPath}`);
        router.replace(redirectPath);
        return;
      }
    }
  }, [isAuthenticated, isInitialized, pathname, router, shouldRedirect, getDefaultPath, userType]);

  // Loading state durante inicialização
  if (!isInitialized) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}