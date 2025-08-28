import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  separator?: React.ReactNode;
  showHome?: boolean;
  homeLabel?: string;
  homeHref?: string;
  className?: string;
  maxItems?: number;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items = [],
  separator = <ChevronRight className="w-4 h-4 text-gray-400" />,
  showHome = true,
  homeLabel = 'InÃ­cio',
  homeHref = '/',
  className = '',
  maxItems,
}) => {
  // Se nÃ£o hÃ¡ items fornecidos, gera automaticamente baseado na URL
  const pathname = usePathname();
  const autoItems = React.useMemo(() => {
    if (items.length > 0) return items;

    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbItems: BreadcrumbItem[] = [];

    pathSegments.forEach((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const label = formatSegmentLabel(segment);
      breadcrumbItems.push({ label, href });
    });

    return breadcrumbItems;
  }, [items, pathname]);

  // FunÃ§Ã£o para formatar labels dos segmentos da URL
  function formatSegmentLabel(segment: string): string {
    const labelMap: Record<string, string> = {
      'products': 'Produtos',
      'stores': 'Lojas',
      'categories': 'Categorias',
      'orders': 'Pedidos',
      'profile': 'Perfil',
      'admin': 'AdministraÃ§Ã£o',
      'seller': 'Vendedor',
      'dashboard': 'Dashboard',
      'settings': 'ConfiguraÃ§Ã£es',
      'analytics': 'Analytics',
      'users': 'UsuÃ¡rios',
      'banners': 'Banners',
      'plans': 'Planos',
      'cart': 'Carrinho',
      'checkout': 'Finalizar Compra',
      'login': 'Login',
      'register': 'Cadastro',
      'about': 'Sobre',
      'contact': 'Contato',
      'privacy': 'Privacidade',
      'terms': 'Termos',
      'pricing': 'PreÃ§os',
    };

    return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  }

  // Combina home com items
  const allItems = showHome 
    ? [{ label: homeLabel, href: homeHref, icon: <Home className="w-4 h-4" /> }, ...autoItems]
    : autoItems;

  // Aplica limite de items se especificado
  const displayItems = maxItems && allItems.length > maxItems
    ? [
        ...allItems.slice(0, 1), // Primeiro item (home)
        { label: '...', href: undefined }, // Ellipsis
        ...allItems.slice(-(maxItems - 2)) // Ãšltimos items
      ]
    : allItems;

  if (displayItems.length === 0) return null;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex items-center space-x-1 text-sm ${className}`}
    >
      <ol className="flex items-center space-x-1">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.label === '...';

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2" aria-hidden="true">
                  {separator}
                </span>
              )}
              
              {isEllipsis ? (
                <span className="text-gray-500 px-2">...</span>
              ) : isLast || !item.href ? (
                <span 
                  className="flex items-center space-x-1 text-gray-900 font-medium"
                  aria-current="page"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;

// Hook para facilitar o uso de breadcrumbs
export const useBreadcrumbs = () => {
  const [items, setItems] = React.useState<BreadcrumbItem[]>([]);

  const addItem = (item: BreadcrumbItem) => {
    setItems(prev => [...prev, item]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const clearItems = () => {
    setItems([]);
  };

  const setAllItems = (newItems: BreadcrumbItem[]) => {
    setItems(newItems);
  };

  return {
    items,
    addItem,
    removeItem,
    clearItems,
    setAllItems,
  };
};

// Componente simplificado para breadcrumbs de pÃ¡gina
interface PageBreadcrumbsProps {
  title: string;
  parentPages?: Array<{ label: string; href: string }>;
  className?: string;
}

export const PageBreadcrumbs: React.FC<PageBreadcrumbsProps> = ({
  title,
  parentPages = [],
  className = '',
}) => {
  const items: BreadcrumbItem[] = [
    ...parentPages.map(page => ({ label: page.label, href: page.href })),
    { label: title }
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      <Breadcrumbs items={items} />
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    </div>
  );
};

// Componente para breadcrumbs em cards/seÃ§Ãµes
interface SectionBreadcrumbsProps {
  items: BreadcrumbItem[];
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

export const SectionBreadcrumbs: React.FC<SectionBreadcrumbsProps> = ({
  items,
  variant = 'default',
  className = '',
}) => {
  const variantClasses = {
    default: 'text-sm',
    compact: 'text-xs',
    minimal: 'text-xs text-gray-400',
  };

  const separatorVariants = {
    default: <ChevronRight className="w-4 h-4 text-gray-400" />,
    compact: <ChevronRight className="w-3 h-3 text-gray-400" />,
    minimal: <span className="text-gray-300">/</span>,
  };

  return (
    <Breadcrumbs
      items={items}
      separator={separatorVariants[variant]}
      showHome={false}
      className={`${variantClasses[variant]} ${className}`}
    />
  );
};

// Breadcrumbs especÃ­ficos para e-commerce
export const ProductBreadcrumbs: React.FC<{
  category?: string;
  subcategory?: string;
  productName?: string;
}> = ({ category, subcategory, productName }) => {
  const items: BreadcrumbItem[] = [];

  if (category) {
    items.push({
      label: category,
      href: `/products?category=${encodeURIComponent(category)}`
    });
  }

  if (subcategory) {
    items.push({
      label: subcategory,
      href: `/products?category=${encodeURIComponent(category || '')}&subcategory=${encodeURIComponent(subcategory)}`
    });
  }

  if (productName) {
    items.push({ label: productName });
  }

  return <Breadcrumbs items={items} />;
};

export const StoreBreadcrumbs: React.FC<{
  storeName?: string;
  section?: string;
}> = ({ storeName, section }) => {
  const items: BreadcrumbItem[] = [
    { label: 'Lojas', href: '/stores' }
  ];

  if (storeName) {
    items.push({
      label: storeName,
      href: `/store/${encodeURIComponent(storeName)}`
    });
  }

  if (section) {
    items.push({ label: section });
  }

  return <Breadcrumbs items={items} />;
};

