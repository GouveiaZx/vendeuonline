'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Settings, Save, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationPreferences {
  // Notificações de Pedidos
  orderConfirmed: boolean;
  orderShipped: boolean;
  orderDelivered: boolean;
  orderCancelled: boolean;
  
  // Notificações de Vendas (para vendedores)
  newSale: boolean;
  paymentReceived: boolean;
  lowStock: boolean;
  
  // Notificações de Marketing
  promotions: boolean;
  newProducts: boolean;
  recommendations: boolean;
  
  // Canais de Notificação
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  
  // Configurações Avançadas
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
  frequency: 'instant' | 'hourly' | 'daily';
}

const defaultPreferences: NotificationPreferences = {
  // Pedidos - habilitados por padrão
  orderConfirmed: true,
  orderShipped: true,
  orderDelivered: true,
  orderCancelled: true,
  
  // Vendas - habilitados por padrão
  newSale: true,
  paymentReceived: true,
  lowStock: true,
  
  // Marketing - desabilitados por padrão
  promotions: false,
  newProducts: false,
  recommendations: false,
  
  // Canais
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  
  // Avançadas
  quietHours: false,
  quietStart: '22:00',
  quietEnd: '08:00',
  frequency: 'instant'
};

export const NotificationSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { notifySuccess } = useNotifications();

  useEffect(() => {
    // Carregar preferências salvas do localStorage
    const savedPreferences = localStorage.getItem('notificationPreferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.error('Erro ao carregar preferências:', error);
      }
    }
  }, []);

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean | string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simular salvamento no servidor
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Salvar no localStorage
      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
      
      setHasChanges(false);
      toast.success('Preferências salvas com sucesso!');
      
      notifySuccess(
        'Configurações Atualizadas',
        'Suas preferências de notificação foram salvas.'
      );
    } catch (error) {
      toast.error('Erro ao salvar preferências. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPreferences(defaultPreferences);
    setHasChanges(true);
    toast.info('Configurações restauradas para o padrão');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações de Notificação</h1>
            <p className="text-gray-600">Personalize como e quando você recebe notificações</p>
          </div>
        </div>
        
        {hasChanges && (
          <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            {isLoading ? (
              <Settings className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        )}
      </div>

      {/* Notificações de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-green-600" />
            <span>Notificações de Pedidos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="orderConfirmed" className="font-medium">Pedido Confirmado</Label>
              <p className="text-sm text-gray-600">Receber notificação quando um pedido for confirmado</p>
            </div>
            <Switch
              id="orderConfirmed"
              checked={preferences.orderConfirmed}
              onCheckedChange={(checked) => handlePreferenceChange('orderConfirmed', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="orderShipped" className="font-medium">Pedido Enviado</Label>
              <p className="text-sm text-gray-600">Receber notificação quando um pedido for enviado</p>
            </div>
            <Switch
              id="orderShipped"
              checked={preferences.orderShipped}
              onCheckedChange={(checked) => handlePreferenceChange('orderShipped', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="orderDelivered" className="font-medium">Pedido Entregue</Label>
              <p className="text-sm text-gray-600">Receber notificação quando um pedido for entregue</p>
            </div>
            <Switch
              id="orderDelivered"
              checked={preferences.orderDelivered}
              onCheckedChange={(checked) => handlePreferenceChange('orderDelivered', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="orderCancelled" className="font-medium">Pedido Cancelado</Label>
              <p className="text-sm text-gray-600">Receber notificação quando um pedido for cancelado</p>
            </div>
            <Switch
              id="orderCancelled"
              checked={preferences.orderCancelled}
              onCheckedChange={(checked) => handlePreferenceChange('orderCancelled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notificações de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-purple-600" />
            <span>Notificações de Vendas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="newSale" className="font-medium">Nova Venda</Label>
              <p className="text-sm text-gray-600">Receber notificação quando alguém comprar seus produtos</p>
            </div>
            <Switch
              id="newSale"
              checked={preferences.newSale}
              onCheckedChange={(checked) => handlePreferenceChange('newSale', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="paymentReceived" className="font-medium">Pagamento Recebido</Label>
              <p className="text-sm text-gray-600">Receber notificação quando um pagamento for confirmado</p>
            </div>
            <Switch
              id="paymentReceived"
              checked={preferences.paymentReceived}
              onCheckedChange={(checked) => handlePreferenceChange('paymentReceived', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="lowStock" className="font-medium">Estoque Baixo</Label>
              <p className="text-sm text-gray-600">Receber notificação quando o estoque estiver baixo</p>
            </div>
            <Switch
              id="lowStock"
              checked={preferences.lowStock}
              onCheckedChange={(checked) => handlePreferenceChange('lowStock', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Canais de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <span>Canais de Notificação</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <Label htmlFor="emailNotifications" className="font-medium">Email</Label>
                <p className="text-sm text-gray-600">Receber notificações por email</p>
              </div>
            </div>
            <Switch
              id="emailNotifications"
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <Label htmlFor="pushNotifications" className="font-medium">Push Notifications</Label>
                <p className="text-sm text-gray-600">Receber notificações no navegador</p>
              </div>
            </div>
            <Switch
              id="pushNotifications"
              checked={preferences.pushNotifications}
              onCheckedChange={(checked) => handlePreferenceChange('pushNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex items-center justify-between pt-6">
        <Button variant="outline" onClick={handleReset}>
          Restaurar Padrão
        </Button>
        
        <div className="flex items-center space-x-3">
          {!hasChanges && (
            <div className="flex items-center text-green-600 text-sm">
              <Check className="w-4 h-4 mr-1" />
              Configurações salvas
            </div>
          )}
          
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <Settings className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;