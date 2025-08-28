import { FileText, Shield, Users, CreditCard, Truck, AlertTriangle } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';

export default function TermsPage() {
  const lastUpdated = '15 de Janeiro de 2024';

  const sections = [
    {
      id: 'acceptance',
      title: '1. Aceitação dos Termos',
      icon: FileText,
      content: [
        'Ao acessar e usar o Vendeu Online, você concorda em cumprir e estar vinculado a estes Termos de Uso.',
        'Se você não concordar com qualquer parte destes termos, não deve usar nossa plataforma.',
        'Reservamo-nos o direito de modificar estes termos a qualquer momento, com notificação prévia aos usuários.'
      ]
    },
    {
      id: 'definitions',
      title: '2. Definições',
      icon: Users,
      content: [
        '"Plataforma" refere-se ao marketplace Vendeu Online, incluindo website e aplicações móveis.',
        '"Usuário" refere-se a qualquer pessoa que acesse ou use nossa plataforma.',
        '"Vendedor" refere-se a usuários que oferecem produtos ou serviços através da plataforma.',
        '"Comprador" refere-se a usuários que adquirem produtos ou serviços através da plataforma.',
        '"Conteúdo" refere-se a textos, imagens, vídeos e outros materiais publicados na plataforma.'
      ]
    },
    {
      id: 'registration',
      title: '3. Cadastro e Conta de Usuário',
      icon: Users,
      content: [
        'Para usar certas funcionalidades, você deve criar uma conta fornecendo informações precisas e atualizadas.',
        'Você é responsável por manter a confidencialidade de suas credenciais de acesso.',
        'Você deve notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta.',
        'Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos.',
        'Uma pessoa ou entidade pode manter apenas uma conta ativa por vez.'
      ]
    },
    {
      id: 'seller-obligations',
      title: '4. Obrigações dos Vendedores',
      icon: Shield,
      content: [
        'Vendedores devem fornecer descrições precisas e completas de seus produtos/serviços.',
        'Todas as imagens e informações devem ser verdadeiras e não enganosas.',
        'Vendedores são responsáveis pelo cumprimento de todas as leis aplicáveis.',
        'Produtos ilegais, perigosos ou que violem direitos autorais são proibidos.',
        'Vendedores devem honrar os preços e condições anunciados.',
        'O atendimento ao cliente deve ser prestado de forma profissional e respeitosa.'
      ]
    },
    {
      id: 'buyer-obligations',
      title: '5. Obrigações dos Compradores',
      icon: Users,
      content: [
        'Compradores devem fornecer informações de pagamento e entrega precisas.',
        'O pagamento deve ser efetuado conforme os termos acordados.',
        'Compradores devem tratar vendedores com respeito e profissionalismo.',
        'Avaliações devem ser honestas e baseadas na experiência real de compra.',
        'É proibido usar a plataforma para atividades fraudulentas ou ilegais.'
      ]
    },
    {
      id: 'payments',
      title: '6. Pagamentos e Taxas',
      icon: CreditCard,
      content: [
        'Vendedores pagam mensalidades conforme o plano escolhido.',
        'Oferecemos 30 dias grátis para novos vendedores e garantia de 7 dias.',
        'Não cobramos comissões sobre vendas - vendedores ficam com 100% do valor.',
        'Pagamentos são processados através de parceiros certificados (Asaas, Stripe).',
        'Taxas de processamento de pagamento podem ser aplicadas pelos processadores.',
        'Reembolsos seguem nossas políticas específicas e podem levar até 7 dias úteis.'
      ]
    },
    {
      id: 'delivery',
      title: '7. Entrega e Logística',
      icon: Truck,
      content: [
        'Vendedores são responsáveis pela entrega dos produtos vendidos.',
        'Opções incluem: retirada no local, entrega local, Correios e transportadoras.',
        'Prazos e custos de entrega são definidos pelos vendedores.',
        'A plataforma não se responsabiliza por atrasos ou problemas na entrega.',
        'Disputas de entrega devem ser resolvidas entre comprador e vendedor.',
        'Nossa equipe pode mediar conflitos quando necessário.'
      ]
    },
    {
      id: 'content',
      title: '8. Conteúdo e Propriedade Intelectual',
      icon: Shield,
      content: [
        'Usuários mantêm os direitos sobre o conteúdo que publicam.',
        'Ao publicar, você concede à plataforma licença para exibir e promover seu conteúdo.',
        'É proibido publicar conteúdo que viole direitos autorais de terceiros.',
        'Reservamo-nos o direito de remover conteúdo inadequado ou ilegal.',
        'Usuários são responsáveis por garantir que possuem direitos sobre o conteúdo publicado.'
      ]
    },
    {
      id: 'prohibited',
      title: '9. Atividades Proibidas',
      icon: AlertTriangle,
      content: [
        'Venda de produtos ilegais, perigosos ou que violem leis brasileiras.',
        'Publicação de conteúdo ofensivo, discriminatório ou inadequado.',
        'Tentativas de fraude, golpes ou atividades enganosas.',
        'Uso de informações de outros usuários para fins não autorizados.',
        'Interferência no funcionamento normal da plataforma.',
        'Criação de múltiplas contas para contornar limitações.',
        'Spam, publicidade não autorizada ou comunicação excessiva.'
      ]
    },
    {
      id: 'liability',
      title: '10. Limitação de Responsabilidade',
      icon: Shield,
      content: [
        'A plataforma atua como intermediária entre compradores e vendedores.',
        'Não nos responsabilizamos pela qualidade, segurança ou legalidade dos produtos.',
        'Usuários negociam diretamente entre si, assumindo os riscos envolvidos.',
        'Nossa responsabilidade é limitada ao valor pago pelos serviços da plataforma.',
        'Não garantimos disponibilidade ininterrupta da plataforma.',
        'Usuários devem tomar precauções adequadas em suas transações.'
      ]
    },
    {
      id: 'privacy',
      title: '11. Privacidade e Proteção de Dados',
      icon: Shield,
      content: [
        'Coletamos e processamos dados conforme nossa Política de Privacidade.',
        'Dados pessoais são protegidos conforme a Lei Geral de Proteção de Dados (LGPD).',
        'Não vendemos ou compartilhamos dados pessoais com terceiros sem consentimento.',
        'Usuários podem solicitar acesso, correção ou exclusão de seus dados.',
        'Utilizamos cookies e tecnologias similares para melhorar a experiência.'
      ]
    },
    {
      id: 'termination',
      title: '12. Encerramento',
      icon: AlertTriangle,
      content: [
        'Usuários podem encerrar suas contas a qualquer momento.',
        'Podemos suspender ou encerrar contas que violem estes termos.',
        'Dados podem ser mantidos conforme exigências legais após o encerramento.',
        'Obrigações financeiras permanecem válidas após o encerramento.',
        'Conteúdo publicado pode ser removido após o encerramento da conta.'
      ]
    },
    {
      id: 'governing-law',
      title: '13. Lei Aplicável e Jurisdição',
      icon: FileText,
      content: [
        'Estes termos são regidos pelas leis brasileiras.',
        'Disputas serão resolvidas preferencialmente por mediação ou arbitragem.',
        'O foro da comarca de Erechim-RS é competente para dirimir controvérsias.',
        'Tentaremos resolver disputas de forma amigável antes de processos legais.',
        'Usuários podem recorrer aos órgãos de defesa do consumidor quando aplicável.'
      ]
    },
    {
      id: 'changes',
      title: '14. Alterações nos Termos',
      icon: FileText,
      content: [
        'Podemos modificar estes termos a qualquer momento.',
        'Usuários serão notificados sobre mudanças significativas.',
        'O uso continuado da plataforma constitui aceitação dos novos termos.',
        'Versões anteriores dos termos ficam disponíveis para consulta.',
        'Mudanças entram em vigor na data especificada na notificação.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Termos de Uso
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Conheça os termos e condições para uso do {APP_CONFIG.name}
            </p>
            <p className="text-blue-200 mt-4">
              Última atualização: {lastUpdated}
            </p>
          </div>
        </div>
      </div>

      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Introduction */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Introdução</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Bem-vindo ao {APP_CONFIG.name}! Estes Termos de Uso ("Termos") regem o uso de nossa plataforma 
              de marketplace localizada em {APP_CONFIG.region.fullName}. Ao acessar ou usar nossos serviços, você 
              concorda em estar vinculado a estes termos.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Nossa plataforma conecta vendedores e compradores locais, facilitando transações seguras e 
              transparentes. Leia atentamente todos os termos antes de usar nossos serviços.
            </p>
          </div>

          {/* Terms Sections */}
          <div className="space-y-6">
            {sections.map((section) => {
              const Icon = section.icon;
              
              return (
                <div key={section.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {section.title}
                      </h2>
                    </div>
                    
                    <div className="space-y-4">
                      {section.content.map((paragraph, index) => (
                        <p key={index} className="text-gray-700 leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contact Information */}
          <div className="mt-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Dúvidas sobre os Termos?</h3>
            <p className="text-blue-100 mb-6">
              Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">E-mail</h4>
                <p className="text-blue-100">{APP_CONFIG.contact.email}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Região de Atendimento</h4>
                <p className="text-blue-100">{APP_CONFIG.region.fullName}</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-blue-400">
              <p className="text-sm text-blue-200">
                Estes termos são efetivos a partir de {lastUpdated} e substituem todas as versões anteriores.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}