'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle, MessageCircle, Mail } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // Geral
  {
    id: '1',
    question: 'O que é o Vendeu Online?',
    answer: 'O Vendeu Online é um marketplace local focado na região de Erechim-RS, onde você pode comprar e vender produtos e serviços de forma segura e prática. Conectamos vendedores locais com compradores da região.',
    category: 'geral'
  },
  {
    id: '2',
    question: 'Como funciona a plataforma?',
    answer: 'Nossa plataforma permite que vendedores cadastrem seus produtos e serviços, enquanto compradores podem navegar, pesquisar e comprar itens. Oferecemos ferramentas de comunicação, sistema de avaliações e diferentes opções de entrega.',
    category: 'geral'
  },
  {
    id: '3',
    question: 'É seguro comprar no Vendeu Online?',
    answer: 'Sim! Temos sistemas de verificação de vendedores, avaliações de usuários, suporte ao cliente e políticas de proteção ao comprador. Todos os pagamentos são processados de forma segura.',
    category: 'geral'
  },
  
  // Vendedores
  {
    id: '4',
    question: 'Como me tornar um vendedor?',
    answer: 'Para se tornar vendedor, basta criar uma conta, escolher um plano (temos 30 dias grátis), completar seu perfil e começar a cadastrar produtos. O processo é simples e rápido.',
    category: 'vendedores'
  },
  {
    id: '5',
    question: 'Quais são os planos disponíveis para vendedores?',
    answer: 'Oferecemos 4 planos: Básico (R$ 29,90), Profissional (R$ 59,90), Premium (R$ 99,90) e Empresarial (R$ 199,90). Todos incluem 30 dias grátis e diferentes limites de anúncios e recursos.',
    category: 'vendedores'
  },
  {
    id: '6',
    question: 'Posso cancelar meu plano a qualquer momento?',
    answer: 'Sim, você pode cancelar seu plano a qualquer momento. Oferecemos garantia de 7 dias para reembolso total e não há multas por cancelamento.',
    category: 'vendedores'
  },
  {
    id: '7',
    question: 'Como funciona o sistema de comissões?',
    answer: 'Não cobramos comissões sobre vendas. Você paga apenas a mensalidade do plano escolhido e fica com 100% do valor das suas vendas.',
    category: 'vendedores'
  },
  
  // Compradores
  {
    id: '8',
    question: 'Preciso me cadastrar para comprar?',
    answer: 'Sim, é necessário criar uma conta para realizar compras. O cadastro é gratuito e permite acompanhar pedidos, salvar favoritos e avaliar vendedores.',
    category: 'compradores'
  },
  {
    id: '9',
    question: 'Como posso entrar em contato com o vendedor?',
    answer: 'Você pode entrar em contato através do chat interno da plataforma, WhatsApp (se disponibilizado pelo vendedor) ou telefone. Todas as informações estão no perfil do vendedor.',
    category: 'compradores'
  },
  {
    id: '10',
    question: 'Posso devolver um produto?',
    answer: 'As políticas de devolução variam por vendedor. Verifique as condições na página do produto antes da compra. Em caso de problemas, nossa equipe de suporte pode mediar a situação.',
    category: 'compradores'
  },
  
  // Pagamentos
  {
    id: '11',
    question: 'Quais formas de pagamento são aceitas?',
    answer: 'Aceitamos PIX, cartões de crédito e débito, boleto bancário e débito automático. Os pagamentos são processados de forma segura através do Mercado Pago e Stripe.',
    category: 'pagamentos'
  },
  {
    id: '12',
    question: 'Quando o vendedor recebe o pagamento?',
    answer: 'O vendedor recebe o pagamento após a confirmação da entrega ou retirada do produto, conforme as políticas de cada forma de pagamento.',
    category: 'pagamentos'
  },
  {
    id: '13',
    question: 'É seguro inserir meus dados de pagamento?',
    answer: 'Sim, todos os dados de pagamento são criptografados e processados por empresas certificadas (Mercado Pago e Stripe). Não armazenamos informações sensíveis de cartão.',
    category: 'pagamentos'
  },
  
  // Entrega
  {
    id: '14',
    question: 'Quais são as opções de entrega?',
    answer: 'Oferecemos: Retirada no local, Entrega local (na região de Erechim), Correios e Transportadoras. Cada vendedor define suas opções disponíveis.',
    category: 'entrega'
  },
  {
    id: '15',
    question: 'Quanto custa a entrega?',
    answer: 'O custo varia conforme a modalidade escolhida e é definido pelo vendedor. Algumas entregas locais podem ser gratuitas, dependendo do valor da compra.',
    category: 'entrega'
  },
  {
    id: '16',
    question: 'Como acompanhar meu pedido?',
    answer: 'Você pode acompanhar seu pedido através da sua conta, na seção "Meus Pedidos". Receberá notificações por e-mail e WhatsApp sobre atualizações.',
    category: 'entrega'
  }
];

const categories = [
  { id: 'all', name: 'Todas', icon: HelpCircle },
  { id: 'geral', name: 'Geral', icon: HelpCircle },
  { id: 'vendedores', name: 'Vendedores', icon: HelpCircle },
  { id: 'compradores', name: 'Compradores', icon: HelpCircle },
  { id: 'pagamentos', name: 'Pagamentos', icon: HelpCircle },
  { id: 'entrega', name: 'Entrega', icon: HelpCircle }
];

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const filteredFAQ = faqData.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Perguntas Frequentes
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              Encontre respostas para as dúvidas mais comuns sobre o {APP_CONFIG.name}
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar nas perguntas frequentes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-gray-900 bg-white rounded-xl border-0 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 text-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorias</h3>
                <div className="space-y-2">
                  {categories.map(category => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.id;
                    const count = category.id === 'all' 
                      ? faqData.length 
                      : faqData.filter(item => item.category === category.id).length;
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Contact Support */}
                <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2">Não encontrou sua resposta?</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Nossa equipe está pronta para ajudar você.
                  </p>
                  <div className="space-y-2">
                    <a
                      href="/contact"
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Enviar mensagem</span>
                    </a>
                    <a
                      href={`https://wa.me/5554999999999`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Content */}
            <div className="lg:col-span-3">
              {filteredFAQ.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <HelpCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhuma pergunta encontrada
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Tente ajustar sua pesquisa ou escolher uma categoria diferente.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFAQ.map(item => {
                    const isOpen = openItems.includes(item.id);
                    
                    return (
                      <div key={item.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 pr-4">
                              {item.question}
                            </h3>
                            {isOpen ? (
                              <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                        
                        {isOpen && (
                          <div className="px-6 pb-6">
                            <div className="border-t border-gray-100 pt-4">
                              <p className="text-gray-700 leading-relaxed">
                                {item.answer}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Still have questions */}
              {filteredFAQ.length > 0 && (
                <div className="mt-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
                  <h3 className="text-2xl font-bold mb-4">
                    Ainda tem dúvidas?
                  </h3>
                  <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                    Nossa equipe de suporte está sempre disponível para ajudar você com qualquer questão.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="/contact"
                      className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Mail className="h-5 w-5 mr-2" />
                      Enviar Mensagem
                    </a>
                    <a
                      href={`https://wa.me/5554999999999`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}