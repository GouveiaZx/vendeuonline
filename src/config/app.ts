// Configurações da aplicação Vendeu Online

export const APP_CONFIG = {
  // Informações básicas
  name: 'Vendeu Online',
  description: 'Plataforma de classificados e marketplace para Erechim-RS. Venda e compre produtos localmente.',
  tagline: 'Seu marketplace local em Erechim-RS',
  
  // Localização
  region: {
    city: 'Erechim',
    state: 'RS',
    fullName: 'Erechim-RS'
  },
  
  // Contato
  contact: {
    email: 'grupomaboon@gmail.com',
    phone: '(54) 99999-9999',
    whatsapp: '5554999999999',
    address: {
      street: 'Rua Principal, 123',
      neighborhood: 'Centro',
      city: 'Erechim',
      state: 'RS',
      zipCode: '99700-000'
    }
  },
  
  // Redes sociais
  social: {
    facebook: 'https://facebook.com/vendeuonline',
    instagram: 'https://instagram.com/vendeuonline',
    twitter: 'https://twitter.com/vendeuonline',
    linkedin: 'https://linkedin.com/company/vendeuonline'
  },
  
  // Cores da marca
  colors: {
    primary: '#3B82F6', // Azul
    secondary: '#8B5CF6', // Roxo
    accent: '#10B981', // Verde
    background: '#F8FAFC',
    text: '#1F2937'
  },
  
  // Categorias de produtos
  categories: [
    'Eletrônicos',
    'Imóveis', 
    'Veículos',
    'Roupas',
    'Comida',
    'Serviços',
    'Emprego',
    'Móveis'
  ],
  
  // Configurações de planos (gerenciados via API)
  planLimits: {
    free: { maxAds: 1, maxPhotos: 3 },
    micro: { maxAds: 2, maxPhotos: 6 },
    small: { maxAds: 5, maxPhotos: 10 },
    simple: { maxAds: 10, maxPhotos: 15 },
    plus: { maxAds: 20, maxPhotos: 20 }
  },
  
  // Formas de pagamento
  paymentMethods: [
    {
      name: 'PIX',
      description: '5% de desconto',
      icon: 'pix'
    },
    {
      name: 'Cartão de Crédito',
      description: 'até 12x',
      icon: 'credit-card'
    },
    {
      name: 'Boleto Bancário',
      description: 'à vista',
      icon: 'receipt'
    },
    {
      name: 'Débito Automático',
      description: 'recorrente',
      icon: 'repeat'
    }
  ],
  
  // Configurações de SEO
  seo: {
    keywords: [
      'marketplace',
      'classificados',
      'Erechim',
      'RS',
      'comprar',
      'vender',
      'produtos locais',
      'anúncios'
    ],
    author: 'Vendeu Online',
    robots: 'index, follow'
  },
  
  // URLs importantes
  urls: {
    terms: '/termos-de-uso',
    privacy: '/politica-de-privacidade',
    help: '/ajuda',
    contact: '/contato',
    pricing: '/pricing'
  },
  
  // Configurações de funcionalidades
  features: {
    enableNotifications: true,
    enableChat: true,
    enableReviews: true,
    enableWishlist: true,
    enableCompare: true
  },
  
  // Limites e configurações
  limits: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxDescriptionLength: 2000,
    maxTitleLength: 100
  }
};

// Função para obter configuração específica
export const getConfig = (path: string): any => {
  return path.split('.').reduce((obj: any, key: string) => obj?.[key], APP_CONFIG);
};

// Função para verificar se uma categoria é válida
export const isValidCategory = (category: string): boolean => {
  return APP_CONFIG.categories.includes(category);
};

// Função para obter limites do plano
export const getPlanLimits = (planType: string) => {
  return APP_CONFIG.planLimits[planType as keyof typeof APP_CONFIG.planLimits] || APP_CONFIG.planLimits.free;
};

// Re-exportar função de formatação consolidada
export { formatPrice } from '../utils/formatters';

export default APP_CONFIG;