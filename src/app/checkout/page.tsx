'use client';

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useOrders } from '@/store/orderStore';
import PaymentForm from '@/components/payment/PaymentForm';
import PaymentStatus from '@/components/payment/PaymentStatus';
import { usePayment } from '@/hooks/usePayment';
import { asaasService } from '@/services/asaasService';
import { toast } from 'sonner';

interface CheckoutFormData {
  email: string;
  cpf: string;
  fullName: string;
  phone: string;
  address: {
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
}

const initialFormData: CheckoutFormData = {
  email: '',
  cpf: '',
  fullName: '',
  phone: '',
  address: {
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  }
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId') || `order_${Date.now()}`;
  
  const { checkPaymentStatus } = usePayment();
  const { items, total, clearCart } = useCartStore();
  const { createOrder } = useOrders();
  
  const [step, setStep] = useState<'form' | 'payment' | 'confirmation'>('form');
  const [formData, setFormData] = useState<CheckoutFormData>(initialFormData);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && step === 'form') {
      navigate('/cart');
    }
  }, [items, step, navigate]);



  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      setPaymentId(paymentId);
      
      // Buscar dados do pagamento
      const payment = await asaasService.getPayment(paymentId);
      setPaymentData(payment);
      
      // Criar pedido no sistema
      const shippingAddress = {
        name: formData.fullName,
        street: formData.address.street,
        number: formData.address.number,
        complement: formData.address.complement || '',
        neighborhood: formData.address.neighborhood,
        city: formData.address.city,
        state: formData.address.state,
        zipCode: formData.address.zipCode,
        phone: formData.phone
      };
      
      await createOrder(shippingAddress, paymentId);
      
      // Limpar carrinho se pagamento foi confirmado
      if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
        clearCart();
      }
      
      setStep('confirmation');
    } catch (error) {
      console.error('Erro ao processar sucesso do pagamento:', error);
      toast.error('Erro ao finalizar pedido');
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(`Erro no pagamento: ${error}`);
  };



  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value / 100);
  };

  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {paymentData ? (
            <PaymentStatus
              payment={paymentData}
              onClose={() => navigate('/buyer/orders')}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Pedido Criado!</h1>
              <p className="text-gray-600 mb-6">Seu pedido foi criado com sucesso</p>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Pedido:</p>
                    <p className="font-medium">#{orderId.slice(-8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total:</p>
                    <p className="font-medium">R$ {(total / 100).toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/buyer/orders')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ver Meus Pedidos
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => step === 'form' ? navigate('/cart') : setStep('form')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Finalizar Compra</h1>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'form' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
            }`}>
              {step === 'form' ? '1' : <Check className="h-4 w-4" />}
            </div>
            <div className="w-16 h-1 bg-gray-200 mx-2">
              <div className={`h-full bg-blue-600 transition-all duration-300 ${
                step === 'payment' ? 'w-full' : 'w-0'
              }`} />
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'form' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Dados de Entrega</h2>
                
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CPF *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.cpf}
                        onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CEP *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.address.zipCode}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, zipCode: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Endereço *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.address.street}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, street: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.address.number}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, number: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={formData.address.complement}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, complement: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bairro *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.address.neighborhood}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, neighborhood: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.address.state}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, state: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address.city}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Continuar para Pagamento
                  </button>
                </form>
              </div>
            )}

            {step === 'payment' && (
              <PaymentForm
                totalAmount={total * 100} // Converter para centavos
                orderId={orderId}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
              />
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Pedido</h3>
              
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-gray-600">Qtd: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-900">
                      R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frete:</span>
                  <span className="text-green-600">Grátis</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>Total:</span>
                  <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}