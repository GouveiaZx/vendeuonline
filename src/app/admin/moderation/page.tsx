'use client';

import { useEffect } from 'react';
import { useAuthStore, usePermissions } from '@/store/authStore';
import ModerationDashboard from '@/components/admin/ModerationDashboard';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ModerationPage() {
  const { user } = useAuthStore();
  const { isAdmin } = usePermissions();

  useEffect(() => {
    // Verificar autenticação e permissões
    if (!user || !isAdmin) {
      window.location.href = '/';
    }
  }, [user, isAdmin]);

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/admin'}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Painel
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Moderação de Reviews</h1>
                <p className="text-gray-600">Gerencie avaliações, reports e filtros de moderação</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ModerationDashboard />
      </div>
    </div>
  );
}