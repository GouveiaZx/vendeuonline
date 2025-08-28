'use client';

import React, { useState, useEffect } from 'react';
import { Save, TestTube, Settings, MessageSquare, Key, Webhook, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppConfig {
  accessToken: string;
  verifyToken: string;
  webhookSecret: string;
  phoneNumberId: string;
  businessAccountId: string;
  appId: string;
  appSecret: string;
}

interface ConfigStatus {
  isValid: boolean;
  errors: string[];
  lastTested?: Date;
}

export default function WhatsAppAdminPage() {
  const [config, setConfig] = useState<WhatsAppConfig>({
    accessToken: '',
    verifyToken: '',
    webhookSecret: '',
    phoneNumberId: '',
    businessAccountId: '',
    appId: '',
    appSecret: ''
  });

  const [status, setStatus] = useState<ConfigStatus>({
    isValid: false,
    errors: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'templates' | 'webhook'>('config');

  // Carregar configuração atual
  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/whatsapp/config');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConfig(data.data.config);
          setStatus(data.data.status);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      toast.error('Erro ao carregar configuração do WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigChange = (field: keyof WhatsAppConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/whatsapp/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config })
      });

      const data = await response.json();
      if (data.success) {
        setStatus(data.data.status);
        toast.success('Configuração salva com sucesso!');
      } else {
        toast.error(data.error || 'Erro ao salvar configuração');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setIsLoading(false);
    }
  };

  const testConfiguration = async () => {
    try {
      setIsTesting(true);
      const response = await fetch('/api/admin/whatsapp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config })
      });

      const data = await response.json();
      if (data.success) {
        setStatus({
          isValid: true,
          errors: [],
          lastTested: new Date()
        });
        toast.success('Configuração testada com sucesso!');
      } else {
        setStatus({
          isValid: false,
          errors: data.errors || [data.error],
          lastTested: new Date()
        });
        toast.error('Falha no teste de configuração');
      }
    } catch (error) {
      console.error('Erro ao testar configuração:', error);
      toast.error('Erro ao testar configuração');
    } finally {
      setIsTesting(false);
    }
  };

  const copyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;
    navigator.clipboard.writeText(webhookUrl);
    toast.success('URL do webhook copiada!');
  };

  const maskSecret = (secret: string) => {
    if (!secret) return '';
    if (showSecrets) return secret;
    return secret.substring(0, 8) + '•'.repeat(Math.max(0, secret.length - 8));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuração WhatsApp Business
          </h1>
          <p className="text-gray-600">
            Configure as credenciais e templates para integração com WhatsApp Business API
          </p>
        </div>

        {/* Status Card */}
        <div className={`mb-6 p-4 rounded-lg border ${
          status.isValid 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center">
            {status.isValid ? (
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            )}
            <span className={`font-medium ${
              status.isValid ? 'text-green-800' : 'text-red-800'
            }`}>
              {status.isValid ? 'Configuração válida' : 'Configuração inválida'}
            </span>
            {status.lastTested && (
              <span className="ml-2 text-sm text-gray-600">
                (Testado em {status.lastTested.toLocaleString('pt-BR')})
              </span>
            )}
          </div>
          {status.errors.length > 0 && (
            <ul className="mt-2 text-sm text-red-700">
              {status.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('config')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'config'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Configuração
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Templates
            </button>
            <button
              onClick={() => setActiveTab('webhook')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'webhook'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Webhook className="w-4 h-4 inline mr-2" />
              Webhook
            </button>
          </nav>
        </div>

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Credenciais da API</h2>
              <p className="text-sm text-gray-600">
                Configure as credenciais do WhatsApp Business API
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Show/Hide Secrets Toggle */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showSecrets}
                    onChange={(e) => setShowSecrets(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Mostrar valores secretos</span>
                </label>
              </div>

              {/* Access Token */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Key className="w-4 h-4 inline mr-1" />
                  Access Token *
                </label>
                <input
                  type="text"
                  value={maskSecret(config.accessToken)}
                  onChange={(e) => handleConfigChange('accessToken', e.target.value)}
                  placeholder="Token de acesso do WhatsApp Business API"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Verify Token */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verify Token *
                </label>
                <input
                  type="text"
                  value={config.verifyToken}
                  onChange={(e) => handleConfigChange('verifyToken', e.target.value)}
                  placeholder="Token de verificação do webhook"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Webhook Secret */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook Secret
                </label>
                <input
                  type="text"
                  value={maskSecret(config.webhookSecret)}
                  onChange={(e) => handleConfigChange('webhookSecret', e.target.value)}
                  placeholder="Secret para validação de assinatura do webhook"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Phone Number ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number ID *
                </label>
                <input
                  type="text"
                  value={config.phoneNumberId}
                  onChange={(e) => handleConfigChange('phoneNumberId', e.target.value)}
                  placeholder="ID do número de telefone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Business Account ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Account ID *
                </label>
                <input
                  type="text"
                  value={config.businessAccountId}
                  onChange={(e) => handleConfigChange('businessAccountId', e.target.value)}
                  placeholder="ID da conta business"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* App ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  App ID *
                </label>
                <input
                  type="text"
                  value={config.appId}
                  onChange={(e) => handleConfigChange('appId', e.target.value)}
                  placeholder="ID da aplicação"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* App Secret */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  App Secret *
                </label>
                <input
                  type="text"
                  value={maskSecret(config.appSecret)}
                  onChange={(e) => handleConfigChange('appSecret', e.target.value)}
                  placeholder="Secret da aplicação"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={saveConfig}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Salvando...' : 'Salvar Configuração'}
                </button>
                
                <button
                  onClick={testConfiguration}
                  disabled={isTesting}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {isTesting ? 'Testando...' : 'Testar Configuração'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Templates de Mensagem</h2>
              <p className="text-sm text-gray-600">
                Gerencie os templates de mensagens do WhatsApp
              </p>
            </div>
            
            <div className="p-6">
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Gerenciamento de templates em desenvolvimento</p>
                <p className="text-sm text-gray-400 mt-2">
                  Esta funcionalidade permitirá criar e editar templates personalizados
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Webhook Tab */}
        {activeTab === 'webhook' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Configuração do Webhook</h2>
              <p className="text-sm text-gray-600">
                Configure o webhook para receber mensagens do WhatsApp
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Webhook URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL do Webhook
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/whatsapp/webhook`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm bg-gray-50 text-gray-600"
                  />
                  <button
                    onClick={copyWebhookUrl}
                    className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use esta URL na configuração do webhook no Facebook Developers
                </p>
              </div>

              {/* Verify Token Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token de Verificação
                </label>
                <input
                  type="text"
                  value={config.verifyToken}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use este token na configuração do webhook no Facebook Developers
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Instruções de Configuração</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Acesse o Facebook Developers Console</li>
                  <li>Vá para sua aplicação WhatsApp Business</li>
                  <li>Na seção Webhooks, adicione a URL acima</li>
                  <li>Use o token de verificação mostrado acima</li>
                  <li>Selecione os eventos: messages, message_deliveries, message_reads</li>
                  <li>Salve e teste a configuração</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}