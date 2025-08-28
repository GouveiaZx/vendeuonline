'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRouteAccess } from '@/store/authStore';
import { UserType } from '@/types';
import { AlertTriangle, Shield, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: UserType | UserType[];
  requiredPermissions?: string[];
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredPermissions = [],
  fallbackPath,
  showAccessDenied = true
}: ProtectedRouteProps) {
  const router = useRouter();
  const { hasAccess, isAuthenticated, userType, isLoading } = useRouteAccess(
    requiredRole,
    requiredPermissions
  );

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!hasAccess && fallbackPath) {
      router.replace(fallbackPath);
      return;
    }
  }, [isAuthenticated, hasAccess, isLoading, router, fallbackPath]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-600 mb-4">Você precisa estar logado para acessar esta página.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  // Access denied
  if (!hasAccess && showAccessDenied) {
    const roleNames = {
      ADMIN: 'Administrador',
      SELLER: 'Vendedor',
      BUYER: 'Comprador'
    };

    const requiredRoleText = Array.isArray(requiredRole)
      ? requiredRole.map(r => roleNames[r]).join(' ou ')
      : roleNames[requiredRole];

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-2">
            Esta página é restrita para usuários do tipo: <strong>{requiredRoleText}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Seu tipo de usuário atual: <strong>{userType ? roleNames[userType] : 'Indefinido'}</strong>
          </p>
          
          {requiredPermissions.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-yellow-800">Permissões Necessárias:</p>
                  <ul className="text-xs text-yellow-700 mt-1">
                    {requiredPermissions.map((permission, index) => (
                      <li key={index}>• {permission}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={() => router.back()}
              className="w-full bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir para Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Access granted
  return <>{children}</>;
}

// Componentes especializados para diferentes roles
export function AdminOnly({ 
  children, 
  requiredPermissions = [],
  fallbackPath = '/'
}: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute 
      requiredRole="ADMIN" 
      requiredPermissions={requiredPermissions}
      fallbackPath={fallbackPath}
    >
      {children}
    </ProtectedRoute>
  );
}

export function SellerOnly({ 
  children, 
  fallbackPath = '/'
}: Omit<ProtectedRouteProps, 'requiredRole' | 'requiredPermissions'>) {
  return (
    <ProtectedRoute 
      requiredRole="SELLER"
      fallbackPath={fallbackPath}
    >
      {children}
    </ProtectedRoute>
  );
}

export function BuyerOnly({ 
  children, 
  fallbackPath = '/'
}: Omit<ProtectedRouteProps, 'requiredRole' | 'requiredPermissions'>) {
  return (
    <ProtectedRoute 
      requiredRole="BUYER"
      fallbackPath={fallbackPath}
    >
      {children}
    </ProtectedRoute>
  );
}

export function AuthenticatedOnly({ 
  children 
}: { children: React.ReactNode }) {
  return (
    <ProtectedRoute 
      requiredRole={['ADMIN', 'SELLER', 'BUYER']}
      showAccessDenied={false}
    >
      {children}
    </ProtectedRoute>
  );
}