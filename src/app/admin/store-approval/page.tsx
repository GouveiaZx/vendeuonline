'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import StoreApprovalDashboard from '@/components/admin/StoreApprovalDashboard';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export default function StoreApprovalPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        toast.error('Você precisa estar logado para acessar esta página');
        router.push('/login');
        return;
      }

      if (!user?.admin) {
        toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
        router.push('/');
        return;
      }

      setIsAuthorized(true);
      setLoading(false);
    };

    checkAuth();
  }, [isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Painel
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Aprovação de Lojas</h1>
            <p className="text-gray-600 mt-1">
              Gerencie e modere as solicitações de aprovação de lojas
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <StoreApprovalDashboard />
    </div>
  );
}