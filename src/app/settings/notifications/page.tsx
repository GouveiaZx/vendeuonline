'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationSettings from '@/components/notifications/NotificationSettings';
import PushNotificationSettings from '@/components/notifications/PushNotificationSettings';
import { useRouter } from 'next/navigation';

const NotificationSettingsPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </Button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">Configurações</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">Notificações</span>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <PushNotificationSettings />
          <NotificationSettings />
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;