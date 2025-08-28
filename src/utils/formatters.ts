// Formatadores consolidados para o projeto

// Formatação de moeda
export const currencyFormatters = {
  formatCurrency: (value: number, currency: string = 'BRL'): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value);
  },

  parseCurrency: (value: string): number => {
    const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  },

  formatPrice: (price: number): string => {
    return currencyFormatters.formatCurrency(price);
  }
};

// Formatação de datas
export const dateFormatters = {
  formatDate: (date: Date | string, format: 'short' | 'long' | 'iso' = 'short'): string => {
    let dateObj: Date;
    if (typeof date === 'string') {
      // Handle date strings that might not have timezone info
      if (date.includes('T') && !date.includes('Z') && !date.includes('+')) {
        dateObj = new Date(date + 'Z'); // Assume UTC if no timezone specified
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    
    switch (format) {
      case 'iso':
        return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
      case 'long':
        return dateObj.toLocaleDateString('pt-BR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'short':
      default:
        return dateObj.toLocaleDateString('pt-BR');
    }
  },

  formatDateTime: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('pt-BR');
  },

  formatRelativeTime: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    if (diffInDays < 7) return `${diffInDays}d atrás`;
    
    return dateFormatters.formatDate(dateObj);
  },

  formatTimeAgo: (date: Date | string): string => {
    return dateFormatters.formatRelativeTime(date);
  }
};

// Formatação de documentos brasileiros
export const documentFormatters = {
  formatCPF: (cpf: string): string => {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },

  formatCNPJ: (cnpj: string): string => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length >= 14) {
      return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } else if (cleanCNPJ.length >= 8) {
      return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
    } else if (cleanCNPJ.length >= 6) {
      return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (cleanCNPJ.length >= 2) {
      return cleanCNPJ.replace(/(\d{2})(\d{0,3})/, '$1.$2');
    }
    return cleanCNPJ;
  },

  formatCEP: (cep: string): string => {
    const cleanCEP = cep.replace(/\D/g, '');
    return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');
  },

  formatPhone: (phone: string): string => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 11) {
      return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleanPhone.length === 10) {
      return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  }
};

// Formatação de texto
export const textFormatters = {
  capitalize: (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  capitalizeWords: (text: string): string => {
    return text.split(' ').map(word => textFormatters.capitalize(word)).join(' ');
  },

  slugify: (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .trim()
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-'); // Remove hífens duplicados
  },

  truncate: (text: string, maxLength: number, suffix: string = '...'): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  },

  removeAccents: (text: string): string => {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
};

// Formatação de números
export const numberFormatters = {
  formatNumber: (value: number, decimals: number = 0): string => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  },

  formatPercentage: (value: number, decimals: number = 1): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  },

  formatFileSize: (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  },

  formatRating: (rating: number, maxRating: number = 5): string => {
    const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(maxRating - Math.floor(rating));
    return `${stars} (${rating.toFixed(1)})`;
  }
};

// Formatação de endereços
export const addressFormatters = {
  formatAddress: (address: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  }): string => {
    const parts = [];
    
    if (address.street) {
      let streetPart = address.street;
      if (address.number) streetPart += `, ${address.number}`;
      if (address.complement) streetPart += `, ${address.complement}`;
      parts.push(streetPart);
    }
    
    if (address.neighborhood) parts.push(address.neighborhood);
    if (address.city && address.state) {
      parts.push(`${address.city} - ${address.state}`);
    } else if (address.city) {
      parts.push(address.city);
    }
    
    if (address.zipCode) parts.push(documentFormatters.formatCEP(address.zipCode));
    
    return parts.join(', ');
  }
};

// Formatação de status
export const statusFormatters = {
  formatOrderStatus: (status: string): string => {
    const statusMap: Record<string, string> = {
      'PENDING': 'Aguardando Pagamento',
      'CONFIRMED': 'Confirmado',
      'PROCESSING': 'Em Preparação',
      'SHIPPED': 'Enviado',
      'DELIVERED': 'Entregue',
      'CANCELLED': 'Cancelado',
      'REFUNDED': 'Reembolsado',
      // Fallback para status antigos
      'pending': 'Aguardando Pagamento',
      'paid': 'Pago',
      'confirmed': 'Confirmado',
      'processing': 'Em Preparação',
      'shipped': 'Enviado',
      'delivered': 'Entregue',
      'cancelled': 'Cancelado',
      'refunded': 'Reembolsado'
    };
    return statusMap[status] || status;
  },

  formatPaymentMethod: (method: string): string => {
    const methodMap: Record<string, string> = {
      'CREDIT_CARD': 'Cartão de Crédito',
      'DEBIT_CARD': 'Cartão de Débito',
      'PIX': 'PIX',
      'BOLETO': 'Boleto',
      'WHATSAPP': 'WhatsApp Pay',
      // Fallback para métodos antigos
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
      'boleto': 'Boleto',
      'whatsapp': 'WhatsApp Pay'
    };
    return methodMap[method] || method;
  }
};

// Exportar todos os formatadores como um objeto consolidado
export const formatters = {
  ...currencyFormatters,
  ...dateFormatters,
  ...documentFormatters,
  ...textFormatters,
  ...numberFormatters,
  ...addressFormatters,
  ...statusFormatters
};

export default formatters;
export const formatPrice = currencyFormatters.formatPrice;