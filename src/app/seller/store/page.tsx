'use client';

import { useState } from 'react';
import { Save, Upload, MapPin, Clock, Phone, Mail, Globe, Camera, Star, Shield, Truck } from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from '@/components/ui/ImageUpload';

interface StoreSettings {
  name: string;
  description: string;
  logo: string;
  banner: string;
  category: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    website: string;
  };
  businessHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  shipping: {
    freeShippingMinValue: number;
    localDelivery: boolean;
    localDeliveryFee: number;
    localDeliveryRadius: number;
    pickupAvailable: boolean;
  };
  policies: {
    returnPolicy: string;
    warrantyPolicy: string;
    privacyPolicy: string;
  };
}

const initialSettings: StoreSettings = {
  name: 'TechStore Erechim',
  description: 'Sua loja de tecnologia em Erechim-RS. Oferecemos os melhores produtos com garantia e suporte técnico especializado.',
  logo: '',
  banner: '',
  category: 'eletronicos',
  address: {
    street: 'Rua Sete de Setembro',
    number: '123',
    neighborhood: 'Centro',
    city: 'Erechim',
    state: 'RS',
    zipCode: '99700-000'
  },
  contact: {
    phone: '(54) 3321-1234',
    whatsapp: '(54) 99999-1234',
    email: 'contato@techstore.com',
    website: 'www.techstore.com'
  },
  businessHours: {
    monday: { open: '08:00', close: '18:00', closed: false },
    tuesday: { open: '08:00', close: '18:00', closed: false },
    wednesday: { open: '08:00', close: '18:00', closed: false },
    thursday: { open: '08:00', close: '18:00', closed: false },
    friday: { open: '08:00', close: '18:00', closed: false },
    saturday: { open: '08:00', close: '12:00', closed: false },
    sunday: { open: '09:00', close: '12:00', closed: true }
  },
  shipping: {
    freeShippingMinValue: 200,
    localDelivery: true,
    localDeliveryFee: 15,
    localDeliveryRadius: 10,
    pickupAvailable: true
  },
  policies: {
    returnPolicy: 'Aceitamos devoluções em até 7 dias corridos após o recebimento do produto, desde que esteja em perfeitas condições.',
    warrantyPolicy: 'Todos os produtos possuem garantia do fabricante. Produtos eletrônicos têm garantia mínima de 12 meses.',
    privacyPolicy: 'Seus dados pessoais são protegidos e utilizados apenas para processar pedidos e melhorar nossos serviços.'
  }
};

const categories = [
  { value: 'eletronicos', label: 'Eletrônicos' },
  { value: 'roupas', label: 'Roupas e Acessórios' },
  { value: 'casa', label: 'Casa e Jardim' },
  { value: 'veiculos', label: 'Veículos' },
  { value: 'imoveis', label: 'Imóveis' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'emprego', label: 'Emprego' },
  { value: 'moveis', label: 'Móveis' }
];

const weekDays = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
];

export default function SellerStorePage() {
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Configurações salvas com sucesso!');
    setIsLoading(false);
  };

  const updateSettings = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const tabs = [
    { id: 'general', label: 'Geral', icon: <Globe className="h-4 w-4" /> },
    { id: 'contact', label: 'Contato', icon: <Phone className="h-4 w-4" /> },
    { id: 'hours', label: 'Horários', icon: <Clock className="h-4 w-4" /> },
    { id: 'shipping', label: 'Entrega', icon: <Truck className="h-4 w-4" /> },
    { id: 'policies', label: 'Políticas', icon: <Shield className="h-4 w-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações da Loja</h1>
            <p className="text-gray-600">Gerencie as informações e configurações da sua loja</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

        {/* Store Preview Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview da Loja</h3>
          <div className="flex items-start gap-4">
            <img 
              src={settings.logo} 
              alt="Logo da loja"
              className="w-16 h-16 rounded-lg object-cover border"
            />
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900">{settings.name}</h4>
              <p className="text-gray-600 mb-2">{settings.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{settings.address.city}, {settings.address.state}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>4.8 (127 avaliações)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Loja
                    </label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) => updateSettings('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria Principal
                    </label>
                    <select
                      value={settings.category}
                      onChange={(e) => updateSettings('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição da Loja
                  </label>
                  <textarea
                    value={settings.description}
                    onChange={(e) => updateSettings('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo da Loja
                    </label>
                    <ImageUpload
                      bucket="stores"
                      folder="stores"
                      currentImageUrl={settings.logo}
                      onImageChange={(url) => updateSettings('logo', url)}
                      onError={(error) => console.error('Erro no upload:', error)}
                      className="w-full h-32"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Recomendado: 200x200px, formato quadrado
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Banner da Loja
                    </label>
                    <ImageUpload
                      bucket="stores"
                      folder="stores"
                      currentImageUrl={settings.banner}
                      onImageChange={(url) => updateSettings('banner', url)}
                      onError={(error) => console.error('Erro no upload:', error)}
                      className="w-full h-32"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Recomendado: 1200x400px, formato retangular
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={settings.contact.phone}
                      onChange={(e) => updateSettings('contact.phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={settings.contact.whatsapp}
                      onChange={(e) => updateSettings('contact.whatsapp', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={settings.contact.email}
                      onChange={(e) => updateSettings('contact.email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={settings.contact.website}
                      onChange={(e) => updateSettings('contact.website', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Endereço</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rua
                      </label>
                      <input
                        type="text"
                        value={settings.address.street}
                        onChange={(e) => updateSettings('address.street', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número
                      </label>
                      <input
                        type="text"
                        value={settings.address.number}
                        onChange={(e) => updateSettings('address.number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={settings.address.neighborhood}
                        onChange={(e) => updateSettings('address.neighborhood', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={settings.address.city}
                        onChange={(e) => updateSettings('address.city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CEP
                      </label>
                      <input
                        type="text"
                        value={settings.address.zipCode}
                        onChange={(e) => updateSettings('address.zipCode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Business Hours Tab */}
            {activeTab === 'hours' && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Horário de Funcionamento</h4>
                {weekDays.map((day) => (
                  <div key={day.key} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-32">
                      <span className="font-medium text-gray-900">{day.label}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!settings.businessHours[day.key as keyof typeof settings.businessHours].closed}
                        onChange={(e) => updateSettings(`businessHours.${day.key}.closed`, !e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Aberto</span>
                    </div>
                    
                    {!settings.businessHours[day.key as keyof typeof settings.businessHours].closed && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={settings.businessHours[day.key as keyof typeof settings.businessHours].open}
                          onChange={(e) => updateSettings(`businessHours.${day.key}.open`, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="text-gray-500">às</span>
                        <input
                          type="time"
                          value={settings.businessHours[day.key as keyof typeof settings.businessHours].close}
                          onChange={(e) => updateSettings(`businessHours.${day.key}.close`, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                    
                    {settings.businessHours[day.key as keyof typeof settings.businessHours].closed && (
                      <span className="text-red-600 font-medium">Fechado</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Shipping Tab */}
            {activeTab === 'shipping' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor mínimo para frete grátis (R$)
                    </label>
                    <input
                      type="number"
                      value={settings.shipping.freeShippingMinValue}
                      onChange={(e) => updateSettings('shipping.freeShippingMinValue', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taxa de entrega local (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.shipping.localDeliveryFee}
                      onChange={(e) => updateSettings('shipping.localDeliveryFee', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raio de entrega local (km)
                    </label>
                    <input
                      type="number"
                      value={settings.shipping.localDeliveryRadius}
                      onChange={(e) => updateSettings('shipping.localDeliveryRadius', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.shipping.localDelivery}
                      onChange={(e) => updateSettings('shipping.localDelivery', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Oferecer entrega local
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.shipping.pickupAvailable}
                      onChange={(e) => updateSettings('shipping.pickupAvailable', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Permitir retirada no local
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Policies Tab */}
            {activeTab === 'policies' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Política de Devolução
                  </label>
                  <textarea
                    value={settings.policies.returnPolicy}
                    onChange={(e) => updateSettings('policies.returnPolicy', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Política de Garantia
                  </label>
                  <textarea
                    value={settings.policies.warrantyPolicy}
                    onChange={(e) => updateSettings('policies.warrantyPolicy', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Política de Privacidade
                  </label>
                  <textarea
                    value={settings.policies.privacyPolicy}
                    onChange={(e) => updateSettings('policies.privacyPolicy', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
