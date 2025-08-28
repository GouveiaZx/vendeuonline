'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Smartphone, QrCode, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateOrderId } from '@/lib/ssrUtils';

interface CheckoutItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  image?: string;
}

interface CheckoutFormProps {
  items: CheckoutItem[];
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentError?: (error: any) => void;
}

interface PayerData {
  email: string;
  first_name: string;
  last_name: string;
  phone?: {
    area_code: string;
    number: string;
  };
  identification?: {
    type: string;
    number: string;
  };
  address?: {
    street_name: string;
    street_number: string;
    zip_code: string;
  };
}

export default function CheckoutForm({ items, onPaymentSuccess, onPaymentError }: CheckoutFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('pix');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [payerData, setPayerData] = useState<PayerData>({
    email: '',
    first_name: '',
    last_name: ''
  });

  const totalAmount = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

  const handlePayerDataChange = (field: keyof PayerData, value: string) => {
    setPayerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!payerData.email || !payerData.first_name || !payerData.last_name) {
      toast.error('Preencha todos os campos obrigatórios');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payerData.email)) {
      toast.error('Email inválido');
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const orderId = generateOrderId();
      
      const paymentData = {
        orderId,
        paymentMethod: paymentMethod.toUpperCase(),
        amount: totalAmount,
        pixData: paymentMethod === 'pix' ? {
          email: payerData.email,
          cpf: '00000000000' // Em produção, coletar CPF do usuário
        } : undefined,
        customerData: {
          name: `${payerData.first_name} ${payerData.last_name}`,
          email: payerData.email,
          phone: '5454999999999' // Em produção, coletar telefone do usuário
        }
      };

      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar pagamento');
      }

      if (paymentMethod === 'pix') {
        setPixData(result.data);
        toast.success('PIX gerado com sucesso!');
      } else {
        // Para cartão de crédito, mostrar sucesso ou redirecionar
        toast.success('Pagamento processado com sucesso!');
        onPaymentSuccess?.(result);
      }

      onPaymentSuccess?.(result);

    } catch (error) {
      console.error('Erro no pagamento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao processar pagamento');
      onPaymentError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = () => {
    if (pixData?.pixCode && typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pixData.pixCode);
      toast.success('Código PIX copiado!');
    }
  };

  if (pixData) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Pagamento PIX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Escaneie o QR Code ou copie o código PIX
            </p>
            
            {pixData.pixQrCode && (
              <div className="mb-4">
                <img 
                  src={pixData.pixQrCode}
                  alt="QR Code PIX"
                  className="mx-auto border rounded w-48 h-48"
                />
              </div>
            )}
            
            <Button 
              onClick={copyPixCode}
              variant="outline" 
              className="w-full mb-4"
            >
              Copiar código PIX
            </Button>
            
            <div className="text-lg font-semibold">
              Total: R$ {(() => {
                const safeTotal = totalAmount != null && !isNaN(Number(totalAmount)) ? Number(totalAmount) : 0;
                return safeTotal.toFixed(2);
              })()}
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              ID do Pagamento: {pixData.id}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Finalizar Compra</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumo do pedido */}
        <div>
          <h3 className="font-medium mb-3">Resumo do Pedido</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.title} x{item.quantity}</span>
                <span>R$ {(() => {
                  const safePrice = item.unit_price != null && !isNaN(Number(item.unit_price)) ? Number(item.unit_price) : 0;
                  const safeQuantity = item.quantity != null && !isNaN(Number(item.quantity)) ? Number(item.quantity) : 0;
                  const subtotal = safePrice * safeQuantity;
                  return subtotal.toFixed(2);
                })()}</span>
              </div>
            ))}
          </div>
          <Separator className="my-3" />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>R$ {(() => {
              const safeTotal = totalAmount != null && !isNaN(Number(totalAmount)) ? Number(totalAmount) : 0;
              return safeTotal.toFixed(2);
            })()}</span>
          </div>
        </div>

        {/* Dados do comprador */}
        <div>
          <h3 className="font-medium mb-3">Dados do Comprador</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={payerData.email}
                onChange={(e) => handlePayerDataChange('email', e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  value={payerData.first_name}
                  onChange={(e) => handlePayerDataChange('first_name', e.target.value)}
                  placeholder="João"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Sobrenome *</Label>
                <Input
                  id="lastName"
                  value={payerData.last_name}
                  onChange={(e) => handlePayerDataChange('last_name', e.target.value)}
                  placeholder="Silva"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Método de pagamento */}
        <div>
          <h3 className="font-medium mb-3">Método de Pagamento</h3>
          <RadioGroup value={paymentMethod} onValueChange={(value: 'credit_card' | 'pix') => setPaymentMethod(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pix" id="pix" />
              <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer">
                <Smartphone className="h-4 w-4" />
                PIX (Instantâneo)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="credit_card" id="credit_card" />
              <Label htmlFor="credit_card" className="flex items-center gap-2 cursor-pointer">
                <CreditCard className="h-4 w-4" />
                Cartão de Crédito
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Button 
          onClick={handlePayment} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            (() => {
              const safeTotal = totalAmount != null && !isNaN(Number(totalAmount)) ? Number(totalAmount) : 0;
              return `Pagar R$ ${safeTotal.toFixed(2)}`;
            })()
          )}
        </Button>
      </CardContent>
    </Card>
  );
}