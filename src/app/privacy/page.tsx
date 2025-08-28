import { Shield, Eye, Lock, Database, Users, Settings, FileText, AlertCircle } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';

export default function PrivacyPage() {
  const lastUpdated = '15 de Janeiro de 2024';

  const sections = [
    {
      id: 'introduction',
      title: '1. Introdução',
      icon: FileText,
      content: [
        'Esta Política de Privacidade descreve como o Vendeu Online coleta, usa, armazena e protege suas informações pessoais.',
        'Estamos comprometidos com a proteção de sua privacidade e cumprimos rigorosamente a Lei Geral de Proteção de Dados (LGPD).',
        'Ao usar nossa plataforma, você concorda com as práticas descritas nesta política.',
        'Esta política se aplica a todos os usuários da plataforma, incluindo visitantes, compradores e vendedores.'
      ]
    },
    {
      id: 'data-controller',
      title: '2. Controlador de Dados',
      icon: Users,
      content: [
        'O Vendeu Online é o controlador dos dados pessoais coletados através da plataforma.',
        'Nosso Encarregado de Proteção de Dados (DPO) pode ser contatado através do e-mail: ' + APP_CONFIG.contact.email,
        'Estamos localizados na região de ' + APP_CONFIG.region.fullName + ', Brasil.',
        'Somos responsáveis por garantir que o tratamento de dados pessoais esteja em conformidade com a LGPD.'
      ]
    },
    {
      id: 'data-collection',
      title: '3. Dados Coletados',
      icon: Database,
      content: [
        'Coletamos informações que você fornece diretamente, como nome, e-mail, telefone e endereço.',
        'Dados de navegação, incluindo endereço IP, tipo de dispositivo, navegador e páginas visitadas.',
        'Informações de transações, incluindo histórico de compras e vendas.',
        'Dados de localização quando você permite o acesso à geolocalização.',
        'Comunicações entre usuários através da plataforma.',
        'Avaliações, comentários e outros conteúdos que você publica.',
        'Informações de pagamento processadas por nossos parceiros certificados.'
      ]
    },
    {
      id: 'legal-basis',
      title: '4. Base Legal para Tratamento',
      icon: Shield,
      content: [
        'Consentimento: Para marketing, newsletters e funcionalidades opcionais.',
        'Execução de contrato: Para processar transações e fornecer nossos serviços.',
        'Interesse legítimo: Para segurança, prevenção de fraudes e melhorias na plataforma.',
        'Cumprimento de obrigação legal: Para atender exigências fiscais e regulatórias.',
        'Proteção da vida: Em situações de emergência que requeiram intervenção.',
        'Exercício regular de direitos: Para defesa em processos judiciais.'
      ]
    },
    {
      id: 'data-usage',
      title: '5. Como Usamos Seus Dados',
      icon: Settings,
      content: [
        'Fornecer e manter nossos serviços de marketplace.',
        'Processar transações e facilitar comunicação entre usuários.',
        'Personalizar sua experiência na plataforma.',
        'Enviar notificações importantes sobre sua conta e transações.',
        'Detectar e prevenir fraudes, spam e atividades maliciosas.',
        'Cumprir obrigações legais e regulatórias.',
        'Melhorar nossos serviços através de análises e pesquisas.',
        'Enviar comunicações de marketing (apenas com seu consentimento).'
      ]
    },
    {
      id: 'data-sharing',
      title: '6. Compartilhamento de Dados',
      icon: Users,
      content: [
        'Não vendemos seus dados pessoais para terceiros.',
        'Compartilhamos dados com processadores de pagamento (Mercado Pago, Stripe) para transações.',
        'Fornecemos informações necessárias para entrega aos correios e transportadoras.',
        'Podemos compartilhar dados com autoridades quando exigido por lei.',
        'Dados agregados e anonimizados podem ser usados para estatísticas e pesquisas.',
        'Em caso de fusão ou aquisição, dados podem ser transferidos com notificação prévia.',
        'Compartilhamos apenas o mínimo necessário para cada finalidade específica.'
      ]
    },
    {
      id: 'data-security',
      title: '7. Segurança dos Dados',
      icon: Lock,
      content: [
        'Implementamos medidas técnicas e organizacionais para proteger seus dados.',
        'Usamos criptografia SSL/TLS para transmissão de dados sensíveis.',
        'Senhas são armazenadas com hash seguro e nunca em texto plano.',
        'Acesso aos dados é restrito apenas a funcionários autorizados.',
        'Realizamos auditorias regulares de segurança e testes de penetração.',
        'Mantemos backups seguros e planos de recuperação de desastres.',
        'Monitoramos continuamente nossa infraestrutura contra ameaças.'
      ]
    },
    {
      id: 'data-retention',
      title: '8. Retenção de Dados',
      icon: Database,
      content: [
        'Mantemos seus dados apenas pelo tempo necessário para cumprir as finalidades descritas.',
        'Dados de conta são mantidos enquanto sua conta estiver ativa.',
        'Dados de transações são mantidos por 5 anos conforme exigências fiscais.',
        'Dados de marketing são mantidos até você retirar o consentimento.',
        'Logs de segurança são mantidos por 1 ano para investigações.',
        'Após os períodos de retenção, dados são anonimizados ou excluídos.',
        'Alguns dados podem ser mantidos por períodos maiores quando exigido por lei.'
      ]
    },
    {
      id: 'user-rights',
      title: '9. Seus Direitos',
      icon: Shield,
      content: [
        'Acesso: Você pode solicitar uma cópia dos dados que temos sobre você.',
        'Retificação: Você pode corrigir dados incorretos ou incompletos.',
        'Exclusão: Você pode solicitar a exclusão de seus dados pessoais.',
        'Portabilidade: Você pode solicitar seus dados em formato estruturado.',
        'Oposição: Você pode se opor ao tratamento baseado em interesse legítimo.',
        'Limitação: Você pode solicitar a limitação do tratamento em certas situações.',
        'Revogação: Você pode retirar o consentimento a qualquer momento.',
        'Para exercer esses direitos, entre em contato através do e-mail: ' + APP_CONFIG.contact.email
      ]
    },
    {
      id: 'cookies',
      title: '10. Cookies e Tecnologias Similares',
      icon: Eye,
      content: [
        'Usamos cookies para melhorar sua experiência na plataforma.',
        'Cookies essenciais são necessários para o funcionamento básico do site.',
        'Cookies de desempenho nos ajudam a entender como você usa a plataforma.',
        'Cookies de funcionalidade lembram suas preferências e configurações.',
        'Cookies de marketing são usados apenas com seu consentimento.',
        'Você pode gerenciar cookies através das configurações do seu navegador.',
        'Alguns recursos podem não funcionar corretamente se você desabilitar cookies.'
      ]
    },
    {
      id: 'international-transfers',
      title: '11. Transferências Internacionais',
      icon: Database,
      content: [
        'Seus dados são processados principalmente no Brasil.',
        'Alguns serviços de terceiros podem processar dados fora do Brasil.',
        'Garantimos que todas as transferências atendem aos padrões de proteção da LGPD.',
        'Usamos cláusulas contratuais padrão para proteger dados transferidos.',
        'Você será informado sobre qualquer transferência internacional significativa.',
        'Mantemos controle sobre dados transferidos para garantir proteção adequada.'
      ]
    },
    {
      id: 'minors',
      title: '12. Proteção de Menores',
      icon: Shield,
      content: [
        'Nossa plataforma é destinada a usuários maiores de 18 anos.',
        'Menores entre 16 e 18 anos podem usar com consentimento dos responsáveis.',
        'Não coletamos intencionalmente dados de menores de 16 anos.',
        'Se identificarmos dados de menores coletados sem consentimento, os excluiremos.',
        'Responsáveis podem solicitar acesso ou exclusão de dados de menores.',
        'Implementamos verificações de idade quando necessário.'
      ]
    },
    {
      id: 'changes',
      title: '13. Alterações na Política',
      icon: FileText,
      content: [
        'Podemos atualizar esta política periodicamente para refletir mudanças em nossas práticas.',
        'Notificaremos sobre mudanças significativas através de e-mail ou aviso na plataforma.',
        'A data da última atualização é sempre indicada no topo desta política.',
        'Recomendamos que você revise esta política regularmente.',
        'O uso continuado da plataforma após mudanças constitui aceitação da nova política.',
        'Versões anteriores ficam disponíveis para consulta quando solicitado.'
      ]
    },
    {
      id: 'complaints',
      title: '14. Reclamações e Contato',
      icon: AlertCircle,
      content: [
        'Se você tiver dúvidas sobre esta política, entre em contato conosco.',
        'Nosso DPO está disponível para esclarecer questões sobre proteção de dados.',
        'Você pode registrar reclamações sobre o tratamento de seus dados.',
        'Tentaremos resolver todas as questões de forma rápida e transparente.',
        'Você também pode registrar reclamações junto à Autoridade Nacional de Proteção de Dados (ANPD).',
        'Mantemos registros de todas as solicitações e reclamações para melhoria contínua.'
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
              Política de Privacidade
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Saiba como protegemos e tratamos seus dados pessoais no {APP_CONFIG.name}
            </p>
            <p className="text-blue-200 mt-4">
              Última atualização: {lastUpdated}
            </p>
          </div>
        </div>
      </div>

      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* LGPD Compliance Notice */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Conformidade com a LGPD
                </h3>
                <p className="text-green-800 leading-relaxed">
                  Esta política está em total conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). 
                  Respeitamos todos os seus direitos como titular de dados e implementamos as melhores práticas 
                  de segurança e privacidade.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Sections */}
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
            <h3 className="text-2xl font-bold mb-4">Contato para Questões de Privacidade</h3>
            <p className="text-blue-100 mb-6">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Encarregado de Proteção de Dados (DPO)</h4>
                <p className="text-blue-100">{APP_CONFIG.contact.email}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Região de Atendimento</h4>
                <p className="text-blue-100">{APP_CONFIG.region.fullName}</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-blue-400">
              <h4 className="font-semibold mb-2">Autoridade de Proteção de Dados</h4>
              <p className="text-sm text-blue-200">
                Você também pode registrar reclamações junto à Autoridade Nacional de Proteção de Dados (ANPD) 
                através do site: https://www.gov.br/anpd
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <Eye className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">Acessar Meus Dados</h4>
              <p className="text-gray-600 text-sm mb-4">
                Solicite uma cópia dos dados que temos sobre você.
              </p>
              <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Solicitar Acesso
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <Settings className="h-8 w-8 text-purple-600 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">Gerenciar Preferências</h4>
              <p className="text-gray-600 text-sm mb-4">
                Controle como usamos seus dados e comunicações.
              </p>
              <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                Configurar
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">Excluir Dados</h4>
              <p className="text-gray-600 text-sm mb-4">
                Solicite a exclusão de seus dados pessoais.
              </p>
              <button className="text-red-600 hover:text-red-700 font-medium text-sm">
                Solicitar Exclusão
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}