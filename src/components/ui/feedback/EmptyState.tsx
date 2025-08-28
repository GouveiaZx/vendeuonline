'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  ShoppingBag, 
  Search, 
  Package, 
  Heart, 
  ShoppingCart,
  FileText,
  Users,
  Star,
  MessageSquare,
  AlertCircle,
  Plus
} from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: 'products' | 'search' | 'cart' | 'wishlist' | 'orders' | 'reviews' | 'messages' | 'users' | 'error' | 'custom';
  customIcon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const iconMap = {
  products: Package,
  search: Search,
  cart: ShoppingCart,
  wishlist: Heart,
  orders: FileText,
  reviews: Star,
  messages: MessageSquare,
  users: Users,
  error: AlertCircle,
  custom: null
};

const sizeClasses = {
  sm: {
    container: 'p-6',
    icon: 'h-12 w-12',
    title: 'text-lg',
    description: 'text-sm'
  },
  md: {
    container: 'p-8',
    icon: 'h-16 w-16',
    title: 'text-xl',
    description: 'text-base'
  },
  lg: {
    container: 'p-12',
    icon: 'h-20 w-20',
    title: 'text-2xl',
    description: 'text-lg'
  }
};

export default function EmptyState({
  icon = 'products',
  customIcon,
  title,
  description,
  action,
  className,
  size = 'md'
}: EmptyStateProps) {
  const IconComponent = icon === 'custom' ? null : iconMap[icon];
  const sizeConfig = sizeClasses[size];

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeConfig.container
      )}>
        {/* Ícone */}
        <div className="mb-4">
          {icon === 'custom' && customIcon ? (
            customIcon
          ) : IconComponent ? (
            <IconComponent className={cn(
              'text-muted-foreground',
              sizeConfig.icon
            )} />
          ) : null}
        </div>

        {/* Título */}
        <h3 className={cn(
          'font-semibold text-foreground mb-2',
          sizeConfig.title
        )}>
          {title}
        </h3>

        {/* Descrição */}
        {description && (
          <p className={cn(
            'text-muted-foreground mb-6 max-w-md',
            sizeConfig.description
          )}>
            {description}
          </p>
        )}

        {/* Ação */}
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
            className="min-w-[120px]"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Estados vazios pré-configurados
export function EmptyProducts({ onAddProduct }: { onAddProduct?: () => void }) {
  return (
    <EmptyState
      icon="products"
      title="Nenhum produto encontrado"
      description="Você ainda não tem produtos cadastrados. Comece adicionando seu primeiro produto."
      action={onAddProduct ? {
        label: 'Adicionar Produto',
        onClick: onAddProduct
      } : undefined}
    />
  );
}

export function EmptySearch({ searchTerm, onClearSearch }: { 
  searchTerm?: string;
  onClearSearch?: () => void;
}) {
  return (
    <EmptyState
      icon="search"
      title="Nenhum resultado encontrado"
      description={searchTerm 
        ? `Não encontramos produtos para "${searchTerm}". Tente usar outros termos de busca.`
        : 'Tente ajustar os filtros ou usar outros termos de busca.'
      }
      action={onClearSearch ? {
        label: 'Limpar Busca',
        onClick: onClearSearch,
        variant: 'outline'
      } : undefined}
    />
  );
}

export function EmptyCart({ onContinueShopping }: { onContinueShopping?: () => void }) {
  return (
    <EmptyState
      icon="cart"
      title="Seu carrinho está vazio"
      description="Adicione produtos ao seu carrinho para continuar com a compra."
      action={onContinueShopping ? {
        label: 'Continuar Comprando',
        onClick: onContinueShopping
      } : undefined}
    />
  );
}

export function EmptyWishlist({ onBrowseProducts }: { onBrowseProducts?: () => void }) {
  return (
    <EmptyState
      icon="wishlist"
      title="Sua lista de desejos está vazia"
      description="Salve produtos que você gostou para comprar mais tarde."
      action={onBrowseProducts ? {
        label: 'Explorar Produtos',
        onClick: onBrowseProducts
      } : undefined}
    />
  );
}

export function EmptyOrders({ onStartShopping }: { onStartShopping?: () => void }) {
  return (
    <EmptyState
      icon="orders"
      title="Você ainda não fez nenhum pedido"
      description="Quando você fizer um pedido, ele aparecerá aqui."
      action={onStartShopping ? {
        label: 'Começar a Comprar',
        onClick: onStartShopping
      } : undefined}
    />
  );
}

export function EmptyReviews({ onWriteReview }: { onWriteReview?: () => void }) {
  return (
    <EmptyState
      icon="reviews"
      title="Nenhuma avaliação ainda"
      description="Seja o primeiro a avaliar este produto e ajude outros compradores."
      action={onWriteReview ? {
        label: 'Escrever Avaliação',
        onClick: onWriteReview
      } : undefined}
      size="sm"
    />
  );
}

export function EmptyMessages({ onSendMessage }: { onSendMessage?: () => void }) {
  return (
    <EmptyState
      icon="messages"
      title="Nenhuma mensagem"
      description="Inicie uma conversa para tirar suas dúvidas sobre o produto."
      action={onSendMessage ? {
        label: 'Enviar Mensagem',
        onClick: onSendMessage
      } : undefined}
      size="sm"
    />
  );
}

export function ErrorState({ 
  title = 'Algo deu errado',
  description = 'Ocorreu um erro inesperado. Tente novamente.',
  onRetry 
}: { 
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon="error"
      title={title}
      description={description}
      action={onRetry ? {
        label: 'Tentar Novamente',
        onClick: onRetry,
        variant: 'outline'
      } : undefined}
    />
  );
}