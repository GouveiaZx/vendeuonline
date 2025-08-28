'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import StoreStatusNotifications from '@/components/notifications/StoreStatusNotifications';

export default function SellerNotificationsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/seller')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Painel
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Notificações
                </h1>
                <p className="text-gray-600 mt-1">
                  Acompanhe as atualizações de status da sua loja
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notificações */}
        <div className="space-y-6">
          <StoreStatusNotifications 
            userId={user.id}
            showUnreadOnly={false}
            maxItems={50}
          />
        </div>
      </div>
    </div>
  );
}