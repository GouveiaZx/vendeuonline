import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle, CreditCard, QrCode, FileText } from 'lucide-react';
import { PaymentInfo } from '@/types';
import { formatters } from '@/utils/formatters';

export interface PaymentStatusProps {
  payment: PaymentInfo & {
    // Campos adicionais mantidos para compatibilidade
    description?: string;
    externalReference?: string;
    paymentLink?: string;
    pixTransaction?: {
      encodedImage: string;
      expirationDate: string;
    };
  };
  onRetry?: () => void;
  onClose?: () => void;
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({ payment, onRetry, onClose }) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'Pagamento Pendente',
          description: 'Aguardando confirmação do pagamento',
        };
      case 'CONFIRMED':
      case 'RECEIVED':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'Pagamento Confirmado',
          description: 'Seu pagamento foi processado com sucesso',
        };
      case 'OVERDUE':
        return {
          icon: AlertCircle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          title: 'Pagamento Vencido',
          description: 'O prazo para pagamento expirou',
        };
      case 'REFUNDED':
        return {
          icon: XCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          title: 'Pagamento Estornado',
          description: 'O pagamento foi estornado',
        };
      case 'AWAITING_RISK_ANALYSIS':
        return {
          icon: AlertCircle,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          title: 'Análise de Risco',
          description: 'Pagamento em análise de segurança',
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          title: 'Status Desconhecido',
          description: 'Status do pagamento não identificado',
        };
    }
  };

  const getBillingTypeInfo = (billingType: string) => {
    switch (billingType) {
      case 'PIX':
        return { icon: QrCode, name: 'PIX' };
      case 'CREDIT_CARD':
        return { icon: CreditCard, name: 'Cartão de Crédito' };
      case 'BOLETO':
        return { icon: FileText, name: 'Boleto Bancário' };
      default:
        return { icon: CreditCard, name: billingType };
    }
   };

   const { formatCurrency, formatDate } = formatters;

  const statusInfo = getStatusInfo(payment.status);
  const billingTypeInfo = getBillingTypeInfo(payment.billing_type);
  const StatusIcon = statusInfo.icon;
  const BillingIcon = billingTypeInfo.icon;

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header com status */}
      <div className={`p-6 ${statusInfo.bgColor} ${statusInfo.borderColor} border-b`}>
        <div className="flex items-center space-x-3">
          <StatusIcon className={`w-8 h-8 ${statusInfo.color}`} />
          <div>
            <h2 className={`text-xl font-bold ${statusInfo.color}`}>
              {statusInfo.title}
            </h2>
            <p className={`text-sm ${statusInfo.color} opacity-80`}>
              {statusInfo.description}
            </p>
          </div>
        </div>
      </div>

      {/* Detalhes do pagamento */}
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Valor:</span>
          <span className="text-lg font-semibold text-gray-900">
            {formatCurrency(payment.value)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Método:</span>
          <div className="flex items-center space-x-2">
            <BillingIcon className="w-4 h-4 text-gray-600" />
            <span className="text-gray-900">{billingTypeInfo.name}</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">ID do Pagamento:</span>
          <span className="text-sm font-mono text-gray-900">
            {payment.id}
          </span>
        </div>

        {payment.date_created && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Data de Criação:</span>
            <span className="text-gray-900">
              {formatDate(payment.date_created)}
            </span>
          </div>
        )}

        {payment.due_date && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Vencimento:</span>
            <span className="text-gray-900">
              {formatDate(payment.due_date)}
            </span>
          </div>
        )}

        {payment.payment_date && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Data do Pagamento:</span>
            <span className="text-green-600 font-semibold">
              {formatDate(payment.payment_date)}
            </span>
          </div>
        )}

        {payment.description && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Descrição:</span>
            <span className="text-gray-900 text-right max-w-48 truncate">
              {payment.description}
            </span>
          </div>
        )}

        {payment.externalReference && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Pedido:</span>
            <span className="text-gray-900">
              #{payment.externalReference}
            </span>
          </div>
        )}
      </div>

      {/* Links e ações */}
      <div className="p-6 bg-gray-50 border-t space-y-3">
        {payment.invoice_url && (
          <a
            href={payment.invoice_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Ver Fatura
          </a>
        )}

        {payment.paymentLink && (
          <a
            href={payment.paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            Link de Pagamento
          </a>
        )}

        {/* PIX QR Code */}
        {payment.billing_type === 'PIX' && payment.pixTransaction && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">QR Code PIX:</p>
            <img
              src={`data:image/png;base64,${payment.pixTransaction.encodedImage}`}
              alt="QR Code PIX"
              className="mx-auto border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-2">
              Válido até: {formatDate(payment.pixTransaction.expirationDate)}
            </p>
          </div>
        )}

        <div className="flex space-x-2">
          {onRetry && (payment.status === 'OVERDUE' || payment.status === 'PENDING') && (
            <button
              onClick={onRetry}
              className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors"
            >
              Tentar Novamente
            </button>
          )}
          
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;