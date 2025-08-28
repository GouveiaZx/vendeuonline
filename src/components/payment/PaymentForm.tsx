import React, { useState } from 'react';
import { CreditCard, QrCode, FileText, Loader2 } from 'lucide-react';
import { usePayment, PaymentData } from '@/hooks/usePayment';
import { toast } from 'sonner';

export interface PaymentFormProps {
  planId: string;
  orderId?: string;
  totalAmount: number;
  onPaymentSuccess?: (paymentId: string) => void;
  onPaymentError?: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  planId,
  orderId,
  totalAmount,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const { processPayment, isProcessing, getPixQrCode } = usePayment();
  const [selectedMethod, setSelectedMethod] = useState<'pix' | 'credit_card'>('pix');
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // Dados do cliente (para cartão de crédito)
    name: '',
    email: '',
    phone: '',
    cpfCnpj: '',
    postalCode: '',
    address: '',
    addressNumber: '',
    complement: '',
    // Dados do cartão de crédito
    cardHolderName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
    installments: 1,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatCpfCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatPostalCode = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const validateForm = (): boolean => {
    if (selectedMethod === 'credit_card') {
      if (!formData.cardHolderName || !formData.cardNumber || !formData.expiryMonth || !formData.expiryYear || !formData.ccv || !formData.name || !formData.email || !formData.cpfCnpj) {
        toast.error('Preencha todos os dados do cartão de crédito e do titular');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const paymentData: PaymentData = {
      planId,
      paymentMethod: selectedMethod,
      creditCard: selectedMethod === 'credit_card' ? {
        holderName: formData.cardHolderName,
        number: formData.cardNumber.replace(/\s/g, ''),
        expiryMonth: formData.expiryMonth,
        expiryYear: formData.expiryYear,
        ccv: formData.ccv,
      } : undefined,
      creditCardHolderInfo: selectedMethod === 'credit_card' ? {
        name: formData.name,
        email: formData.email,
        cpfCnpj: formData.cpfCnpj.replace(/\D/g, ''),
        phone: formData.phone,
        postalCode: formData.postalCode,
        addressNumber: formData.addressNumber,
        addressComplement: formData.complement || undefined,
      } : undefined,
      installmentCount: selectedMethod === 'credit_card' ? formData.installments : undefined,
    };

    try {
      const result = await processPayment(paymentData);

      if (result.error) {
        toast.error(result.error);
        onPaymentError?.(result.error);
        return;
      }

      // Para pagamentos via PIX, exibir QR Code
      if (selectedMethod === 'pix' && result.paymentId) {
        const qrCode = await getPixQrCode(result.paymentId);
        setPixQrCode(qrCode?.encodedImage || null);
      }

      toast.success('Pagamento iniciado com sucesso');

      if (result.paymentId) {
        onPaymentSuccess?.(result.paymentId);
      }
    } catch (error: any) {
      const message = error?.message || 'Erro ao processar pagamento';
      toast.error(message);
      onPaymentError?.(message);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value / 100);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Finalizar Pagamento</h2>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-lg font-semibold text-gray-900">
          Total: {formatCurrency(totalAmount)}
        </p>
      </div>

      {/* Seleção do método de pagamento */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Método de Pagamento</h3>
        <div className="grid grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setSelectedMethod('pix')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
              selectedMethod === 'pix'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <QrCode className="w-8 h-8" />
            <span className="font-medium">PIX</span>
          </button>
          
          <button
            type="button"
            onClick={() => setSelectedMethod('credit_card')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
              selectedMethod === 'credit_card'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CreditCard className="w-8 h-8" />
            <span className="font-medium">Cartão de Crédito</span>
          </button>
          
          <button
            type="button"
            onClick={() => setSelectedMethod('pix')}
            className="p-4 border-2 border-gray-200 hover:border-gray-300 rounded-lg flex flex-col items-center space-y-2 transition-colors opacity-50 cursor-not-allowed"
            disabled
            title="Em breve"
          >
            <FileText className="w-8 h-8" />
            <span className="font-medium">Boleto (Em breve)</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do cliente */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Dados do Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF/CNPJ *
              </label>
              <input
                type="text"
                name="cpfCnpj"
                value={formatCpfCnpj(formData.cpfCnpj)}
                onChange={(e) => setFormData(prev => ({ ...prev, cpfCnpj: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Dados do cartão de crédito */}
        {selectedMethod === 'credit_card' && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Dados do Cartão</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome no Cartão *
                </label>
                <input
                  type="text"
                  name="cardHolderName"
                  value={formData.cardHolderName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número do Cartão *
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formatCardNumber(formData.cardNumber)}
                  onChange={(e) => setFormData(prev => ({ ...prev, cardNumber: e.target.value }))}
                  required
                  maxLength={19}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mês *
                </label>
                <select
                  name="expiryMonth"
                  value={formData.expiryMonth}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Mês</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = (i + 1).toString().padStart(2, '0');
                    return (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ano *
                </label>
                <select
                  name="expiryYear"
                  value={formData.expiryYear}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Ano</option>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = (new Date().getFullYear() + i).toString();
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV *
                </label>
                <input
                  type="text"
                  name="ccv"
                  value={formData.ccv}
                  onChange={handleInputChange}
                  required
                  maxLength={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parcelas
                </label>
                <select
                  name="installments"
                  value={formData.installments}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const installment = i + 1;
                    const installmentValue = totalAmount / installment;
                    return (
                      <option key={installment} value={installment}>
                        {installment}x de {formatCurrency(installmentValue)}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* QR Code PIX */}
        {pixQrCode && selectedMethod === 'pix' && (
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">QR Code PIX</h3>
            <img
              src={`data:image/png;base64,${pixQrCode}`}
              alt="QR Code PIX"
              className="mx-auto mb-4 border border-gray-300 rounded-lg"
            />
            <p className="text-sm text-gray-600">
              Escaneie o QR Code com o app do seu banco para pagar
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processando...</span>
            </>
          ) : (
            <span>Finalizar Pagamento</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default PaymentForm;