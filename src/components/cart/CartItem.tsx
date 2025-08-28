'use client';

import React, { useMemo, useCallback } from 'react';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { CartItem as CartItemType } from '@/store/orderStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface CartItemProps {
  item: {
    id: string;
    productId: string;
    product: {
      id: string;
      name: string;
      price: number;
      images: string[];
      description: string;
      category: string;
      stock: number;
    };
    sellerName: string;
    quantity: number;
    price: number;
    subtotal: number;
  };
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  showStore?: boolean;
}

const CartItem = React.memo<CartItemProps>(({ 
  item, 
  onUpdateQuantity, 
  onRemove,
  showStore = true
}) => {
  // Memoized computed values
  const computedValues = useMemo(() => {
    const safePrice = item.price != null && !isNaN(Number(item.price)) ? Number(item.price) : 0;
    const safeQuantity = item.quantity != null && !isNaN(Number(item.quantity)) ? Number(item.quantity) : 0;
    const subtotal = safePrice * safeQuantity;
    const maxStock = item.product.stock || 999;
    
    return {
      safePrice,
      safeQuantity,
      subtotal,
      maxStock,
      formattedPrice: safePrice.toFixed(2),
      formattedSubtotal: subtotal.toFixed(2)
    };
  }, [item.price, item.quantity, item.product.stock]);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    if (newQuantity < 1) {
      onRemove(item.productId);
    } else {
      onUpdateQuantity(item.productId, newQuantity);
    }
  }, [item.productId, onRemove, onUpdateQuantity]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    const finalValue = Math.min(Math.max(value, 1), computedValues.maxStock);
    handleQuantityChange(finalValue);
  }, [computedValues.maxStock, handleQuantityChange]);

  const handleRemove = useCallback(() => {
    onRemove(item.productId);
  }, [item.productId, onRemove]);

  const handleDecrease = useCallback(() => {
    handleQuantityChange(item.quantity - 1);
  }, [handleQuantityChange, item.quantity]);

  const handleIncrease = useCallback(() => {
    handleQuantityChange(item.quantity + 1);
  }, [handleQuantityChange, item.quantity]);

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Product Image */}
          <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border">
            {item.product.images && item.product.images.length > 0 ? (
              <img 
                src={item.product.images[0] || '/placeholder-product.jpg'} 
                alt={item.product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                onClick={() => typeof window !== 'undefined' && window.open(`/product/${item.productId}`, '_blank')}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 
                  className="font-semibold text-lg truncate hover:text-blue-600 cursor-pointer transition-colors"
                  onClick={() => typeof window !== 'undefined' && window.open(`/product/${item.productId}`, '_blank')}
                >
                  {item.product.name}
                </h3>
                
                {showStore && (
                  <p className="text-sm text-gray-600 mb-1">
                    Vendido por: <span className="font-medium">{item.sellerName}</span>
                  </p>
                )}
                
                {item.product.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {item.product.description}
                  </p>
                )}
                
                {/* Product Attributes */}
                {item.product.category && (
                  <Badge variant="secondary" className="text-xs mb-2">
                    {item.product.category}
                  </Badge>
                )}
              </div>
              
              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                title="Remover item"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Price and Stock Info */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-green-600">
                  R$ {computedValues.formattedPrice}
                </span>

              </div>
              
              {item.product.stock !== undefined && (
                <Badge 
                  variant={item.product.stock > 10 ? 'default' : item.product.stock > 0 ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  {item.product.stock > 0 ? `${item.product.stock} em estoque` : 'Sem estoque'}
                </Badge>
              )}
            </div>
            
            {/* Quantity Controls and Subtotal */}
            <div className="flex items-center justify-between mt-4">
              {/* Quantity Controls */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 mr-2">Qtd:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDecrease}
                  disabled={item.quantity <= 1}
                  className="h-8 w-8 p-0"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={handleInputChange}
                  className="w-16 h-8 text-center text-sm"
                  min="1"
                  max={computedValues.maxStock}
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleIncrease}
                  disabled={item.quantity >= item.product.stock}
                  className="h-8 w-8 p-0"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              
              {/* Subtotal */}
              <div className="text-right">
                <p className="text-xs text-gray-500">Subtotal</p>
                <p className="font-semibold text-lg text-green-600">
                  R$ {computedValues.formattedSubtotal}
                </p>
              </div>
            </div>
            
            {/* Stock Warning */}
            {item.product.stock !== undefined && item.quantity > item.product.stock && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                ⚠️ Quantidade solicitada maior que o estoque disponível ({item.product.stock} unidades)
              </div>
            )}
            
            {/* Low Stock Warning */}
            {item.product.stock !== undefined && item.product.stock <= 5 && item.product.stock > 0 && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-600">
                ⚠️ Últimas unidades em estoque!
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Display name for debugging
CartItem.displayName = 'CartItem';

export { CartItem };
export default CartItem;