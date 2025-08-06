'use client';

import PlanSelector from '@/components/PlanSelector';
import { CreditCard, Smartphone, FileText, Shield } from 'lucide-react';

const paymentMethods = [
  {
    icon: Smartphone,
    name: 'PIX',
    description: '5% de desconto à vista'
  },
  {
    icon: CreditCard,
    name: 'Cartão de Crédito',
    description: 'Até 12x sem juros'
  },
  {
    icon: FileText,
    name: 'Boleto Bancário',
    description: 'Vencimento em 3 dias úteis'
  },
  {
    icon: Shield,
    name: 'Débito Automático',
    description: 'Renovação automática'
  }
];

const benefits = [
  {
    title: 'Sem Compromisso',
    description: 'Cancele a qualquer momento sem taxas ou multas'
  },
  {
    title: 'Suporte Especializado',
    description: 'Nossa equipe está pronta para ajudar você a vender mais'
  },
  {
    title: 'Atualizações Gratuitas',
    description: 'Novas funcionalidades incluídas automaticamente'
  },
  {
    title: 'Garantia de Satisfação',
    description: '30 dias de garantia ou seu dinheiro de volta'
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 via-purple-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Planos para Vendedores
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
            Escolha o plano ideal para impulsionar suas vendas no marketplace
          </p>
          <div className="bg-yellow-400 text-yellow-900 px-6 py-3 rounded-full inline-block font-semibold">
            🎉 Garantia de satisfação de 30 dias
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Escolha seu Plano
          </h2>
          <p className="text-lg text-gray-600">
            Selecione o plano que melhor atende às suas necessidades
          </p>
        </div>
        <PlanSelector />
      </div>

      {/* Payment Methods */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Formas de Pagamento
            </h2>
            <p className="text-lg text-gray-600">
              Escolha a forma de pagamento que melhor se adapta ao seu negócio
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {paymentMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <div key={index} className="bg-gray-50 p-6 rounded-lg text-center hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{method.name}</h3>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Por que escolher nossos planos?
            </h2>
            <p className="text-lg text-gray-600">
              Benefícios exclusivos para impulsionar seu negócio
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Perguntas Frequentes
            </h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Posso mudar de plano a qualquer momento?
              </h3>
              <p className="text-gray-600">
                Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. 
                As mudanças entram em vigor imediatamente.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Como funciona a garantia de satisfação?
              </h3>
              <p className="text-gray-600">
                Oferecemos 30 dias de garantia de satisfação. Se não ficar satisfeito 
                com nosso serviço, devolvemos seu dinheiro.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                O que acontece se eu cancelar minha assinatura?
              </h3>
              <p className="text-gray-600">
                Seus anúncios continuarão ativos até o final do período pago. Após isso, 
                você precisará renovar sua assinatura para continuar anunciando.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Posso ter múltiplas lojas com um plano?
              </h3>
              <p className="text-gray-600">
                Cada plano é válido para uma loja. Para múltiplas lojas, você precisará 
                de assinaturas separadas ou pode considerar nosso plano Empresa Plus.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para começar a vender mais?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Junte-se a milhares de vendedores que já escolheram nosso marketplace
          </p>
          <div className="space-x-4">
            <a
              href="/auth/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
            >
              Começar Agora
            </a>
            <a
              href="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-block"
            >
              Falar com Vendas
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}