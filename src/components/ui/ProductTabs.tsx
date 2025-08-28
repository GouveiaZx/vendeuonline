'use client';

import { useState } from 'react';
import { Check, Truck, Shield, MessageSquare } from 'lucide-react';

interface ProductTabsProps {
  description: string;
  features: string[];
  specifications: Record<string, string>;
  shipping: {
    free: boolean;
    estimatedDays: string;
    regions: string[];
  };
  warranty: string;
  className?: string;
}

export function ProductTabs({ 
  description, 
  features, 
  specifications, 
  shipping, 
  warranty, 
  className = "" 
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState('description');

  const tabs = [
    { id: 'description', label: 'Descrição', icon: MessageSquare },
    { id: 'specifications', label: 'Especificações', icon: Check },
    { id: 'shipping', label: 'Entrega', icon: Truck },
    { id: 'warranty', label: 'Garantia', icon: Shield }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'description':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Descrição do Produto</h3>
              <p className="text-gray-700 leading-relaxed">{description}</p>
            </div>
            
            {features && features.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Principais Características</h4>
                <ul className="space-y-2">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
        
      case 'specifications':
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Especificações Técnicas</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <tbody>
                  {Object.entries(specifications).map(([key, value], index) => (
                    <tr key={key} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-3 px-4 font-medium text-gray-900 border-b border-gray-200 w-1/3">
                        {key}
                      </td>
                      <td className="py-3 px-4 text-gray-700 border-b border-gray-200">
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
        
      case 'shipping':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Entrega</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Frete e Prazo</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3" />
                      {shipping.free ? 'Frete grátis' : 'Frete calculado no checkout'}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3" />
                      Entrega em {shipping.estimatedDays}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3" />
                      Rastreamento incluído
                    </li>
                  </ul>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">Proteção ao Comprador</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3" />
                      Garantia de entrega
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3" />
                      Produto conforme anunciado
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3" />
                      Suporte completo
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Regiões Atendidas</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {shipping.regions.map((region) => (
                  <div key={region} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="h-3 w-3 text-green-600" />
                    {region}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">Importante</h4>
              <ul className="space-y-1 text-sm text-yellow-800">
                <li>• Os prazos de entrega são estimados e podem variar</li>
                <li>• Entregas são feitas de segunda a sexta-feira</li>
                <li>• É necessário ter alguém no local para receber o produto</li>
                <li>• Confira o endereço de entrega antes de finalizar a compra</li>
              </ul>
            </div>
          </div>
        );
        
      case 'warranty':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Garantia e Suporte</h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Garantia do Produto</h4>
                    <p className="text-blue-700">{warranty} de garantia completa</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-blue-900 mb-2">Cobertura Inclui:</h5>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3" />
                        Defeitos de fabricação
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3" />
                        Problemas de funcionamento
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3" />
                        Peças e componentes
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3" />
                        Mão de obra especializada
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-blue-900 mb-2">Não Cobre:</h5>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li>• Danos por mau uso</li>
                      <li>• Acidentes ou quedas</li>
                      <li>• Danos por líquidos</li>
                      <li>• Desgaste natural</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Como Acionar a Garantia</h4>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex gap-3">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</span>
                      Entre em contato conosco
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
                      Informe o número do pedido
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
                      Descreva o problema
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">4</span>
                      Aguarde as instruções
                    </li>
                  </ol>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Suporte Técnico</h4>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div>
                      <span className="font-medium">WhatsApp:</span>
                      <p>(11) 99999-9999</p>
                    </div>
                    <div>
                      <span className="font-medium">E-mail:</span>
                      <p>suporte@marketplace.com</p>
                    </div>
                    <div>
                      <span className="font-medium">Horário:</span>
                      <p>Segunda a sexta, 8h às 18h</p>
                    </div>
                    <div>
                      <span className="font-medium">Tempo de resposta:</span>
                      <p>Até 24 horas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
}