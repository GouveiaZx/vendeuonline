'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, CreditCard, X } from 'lucide-react';
import { useCart, useShipping } from '@/store/orderStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useOffline } from '@/hooks/useOffline';

interface CartItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
    images?: string[];
    stock?: number;
    originalPrice?: number;
    description?: string;
  };
  sellerId: string;
  sellerName: string;
  quantity: number;
  price: number;
  subtotal: number;
  addedAt: Date;
}

interface CartItemComponentProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

const CartItemComponent: React.FC<CartItemComponentProps> = ({ 
  item, 
  onUpdateQuantity, 
  onRemove 
}) => {
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) {
      onRemove(item.productId);
    } else {
      onUpdateQuantity(item.productId, newQuantity);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {/* Product Image */}
          <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
            {item.product.images && item.product.images.length > 0 ? (
              <img 
                src={item.product.images[0]} 
                alt={item.product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{item.product.name}</h3>
            <p className="text-sm text-gray-600 mb-1">Vendido por: {item.sellerName}</p>
            <p className="text-sm text-gray-500 line-clamp-2">{item.product.description}</p>
            
            {/* Price and Stock */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-green-600">
                  R$ {item.price.toFixed(2)}
                </span>
                {item.product.originalPrice && item.product.originalPrice > item.price && (
                  <span className="text-sm text-gray-500 line-through">
                    R$ {item.product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              
              {item.product.stock && (
                <Badge variant={item.product.stock > 10 ? 'default' : 'destructive'}>
                  {item.product.stock} em estoque
                </Badge>
              )}
            </div>
          </div>
          
          {/* Quantity Controls */}
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                className="w-16 text-center"
                min="1"
                max={item.product.stock || 999}
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={!!(item.product.stock && item.quantity >= item.product.stock)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Subtotal */}
            <div className="text-center">
              <p className="text-sm text-gray-600">Subtotal</p>
              <p className="font-semibold text-green-600">
                R$ {(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
            
            {/* Remove Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(item.productId)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CartPage: React.FC = () => {
  const router = useRouter();
  const { isOnline, syncData } = useOffline();
  const {
    items: cartItems,
    updateQuantity: updateCartQuantity,
    removeItem: removeCartItem,
    clear,
    isEmpty: cartIsEmpty,
    total: subtotal
  } = useCart();
  
  const isEmpty = cartIsEmpty;
  const { calculateShipping } = useShipping();
  
  // Convert cartStore items to orderStore format for display
  const items = cartItems.map(item => ({
        id: item.id,
        productId: item.id,
        product: {
          id: item.id,
          name: (item as any).name || 'Produto',
          price: item.price,
          image: (item as any).image,
          stock: (item as any).maxQuantity || 999,
          sellerId: 'seller-1',
          category: 'Geral',
          description: ''
        },
        sellerId: 'seller-1',
        sellerName: (item as any).store || 'Loja',
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
        addedAt: new Date()
      }));
  
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const updateQuantity = (itemId: string, quantity: number) => {
    updateCartQuantity(itemId, quantity);
  };
  
  const removeItem = (itemId: string) => {
    removeCartItem(itemId);
  };
  
  const clearCartItems = () => {
    clear();
  };
  
  const getItemsByStore = () => {
    const grouped: { [key: string]: any[] } = {};
    items.forEach(item => {
      const storeKey = item.sellerName || 'default';
      if (!grouped[storeKey]) {
        grouped[storeKey] = [];
      }
      grouped[storeKey].push(item);
    });
    return grouped;
  };
  
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  
  // Group items by store/seller
  const itemsByStore = getItemsByStore();
  const storeIds = Object.keys(itemsByStore);
  
  const handleApplyCoupon = () => {
    // Mock coupon validation
    const validCoupons = {
      'DESCONTO10': 0.10,
      'BEMVINDO': 0.05,
      'FRETEGRATIS': 0
    };
    
    if (validCoupons[couponCode as keyof typeof validCoupons] !== undefined) {
      const discountPercent = validCoupons[couponCode as keyof typeof validCoupons];
      setDiscount(total * discountPercent);
      
      if (couponCode === 'FRETEGRATIS') {
        setShippingCost(0);
        toast.success('Cupom aplicado! Frete grÃ¡tis!');
      } else {
        toast.success(`Cupom aplicado! Desconto de ${(discountPercent * 100).toFixed(0)}%`);
      }
    } else {
      toast.error('Cupom invÃ¡lido');
    }
  };
  
  const handleCalculateShipping = async () => {
    setIsCalculatingShipping(true);
    try {
      // Mock shipping calculation
      const mockShipping = 15.90; // R$ 15,90 de frete
      setShippingCost(mockShipping);
      toast.success('Frete calculado com sucesso!');
    } catch (error) {
      toast.error('Erro ao calcular frete');
    } finally {
      setIsCalculatingShipping(false);
    }
  };
  
  const finalTotal = total - discount + shippingCost;
  
  const handleCheckout = () => {
    if (isEmpty) {
      toast.error('Seu carrinho estÃ¡ vazio');
      return;
    }
    
    // Redirect to checkout page
    router.push('/checkout');
  };
  
  const handleClearCart = () => {
    if (window.confirm('Tem certeza que deseja limpar o carrinho?')) {
      clearCartItems();
      toast.success('Carrinho limpo com sucesso!');
    }
  };
  
  if (isEmpty) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <ShoppingBag className="w-24 h-24 mx-auto text-gray-300 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Seu carrinho estÃ¡ vazio</h1>
            <p className="text-gray-600 mb-6">
              Parece que vocÃª ainda nÃ£o adicionou nenhum item ao seu carrinho.
            </p>
            
            <div className="space-y-4">
              <Button 
                onClick={() => router.push('/')}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continuar Comprando
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meu Carrinho</h1>
            <p className="text-gray-600 mt-1">
              {count} {count === 1 ? 'item' : 'itens'} no seu carrinho
            </p>
            {!isOnline && (
              <div className="flex items-center mt-2 text-amber-600">
                <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                <span className="text-sm">Modo offline - AlteraÃ§Ãµes serÃ£o sincronizadas quando voltar online</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continuar Comprando
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={handleClearCart}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Carrinho
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {storeIds.map((storeId) => {
              const storeItems = itemsByStore[storeId];
              const storeName = storeItems[0]?.sellerName || 'Loja';
              
              return (
                <div key={storeId} className="mb-8">
                  <div className="flex items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">{storeName}</h2>
                    <Badge variant="secondary" className="ml-2">
                      {storeItems.length} {storeItems.length === 1 ? 'item' : 'itens'}
                    </Badge>
                  </div>
                  
                  {storeItems.map((item) => (
                    <CartItemComponent
                      key={item.id}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                  
                  <Separator className="my-6" />
                </div>
              );
            })}
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between">
                  <span>Subtotal ({count} {count === 1 ? 'item' : 'itens'})</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                
                {/* Coupon */}
                <div className="space-y-2">
                  <Label htmlFor="coupon">Cupom de Desconto</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="coupon"
                      placeholder="Digite o cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleApplyCoupon}
                      disabled={!couponCode}
                    >
                      Aplicar
                    </Button>
                  </div>
                  {discount > 0 && (
                    <p className="text-sm text-green-600">
                      Desconto aplicado: -R$ {discount.toFixed(2)}
                    </p>
                  )}
                </div>
                
                {/* Shipping */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Frete</span>
                    {shippingCost > 0 ? (
                      <span>R$ {shippingCost.toFixed(2)}</span>
                    ) : (
                      <span className="text-gray-500">A calcular</span>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCalculateShipping}
                    disabled={isCalculatingShipping}
                    className="w-full"
                  >
                    {isCalculatingShipping ? 'Calculando...' : 'Calcular Frete'}
                  </Button>
                </div>
                
                <Separator />
                
                {/* Total */}
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-green-600">R$ {finalTotal.toFixed(2)}</span>
                </div>
                
                {/* Checkout Button */}
                <Button 
                  onClick={handleCheckout}
                  className="w-full"
                  size="lg"
                  disabled={!isOnline}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {isOnline ? 'Finalizar Compra' : 'Conecte-se para finalizar'}
                </Button>
                
                {!isOnline && (
                  <p className="text-xs text-amber-600 text-center mt-2">
                    âš ï¸ VocÃª precisa estar online para finalizar a compra
                  </p>
                )}
                
                {!isOnline && (
                  <Button 
                    onClick={syncData}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                  >
                    ðŸ”„ Tentar Sincronizar
                  </Button>
                )}
                
                {/* Security Info */}
                <div className="text-xs text-gray-500 text-center">
                  <p>ðŸ”’ Compra 100% segura</p>
                  <p>Seus dados estÃ£o protegidos</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
