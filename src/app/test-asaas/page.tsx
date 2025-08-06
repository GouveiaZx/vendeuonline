'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createCustomer, createPixPayment, AsaasCustomer } from '@/lib/asaas';

export default function TestAsaasPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testAsaasIntegration = async () => {
    setLoading(true);
    setResult('');
    setError('');
    
    try {
      // Teste 1: Criar cliente
      const customerData: AsaasCustomer = {
        name: 'João Silva Teste',
        email: 'joao.teste@email.com',
        cpfCnpj: '12345678901',
        externalReference: 'test-order-' + Date.now()
      };
      
      const customer = await createCustomer(customerData);
      setResult(prev => prev + `✅ Cliente criado: ${customer.id}\n`);
      
      // Teste 2: Criar pagamento PIX
      const pixPayment = await createPixPayment({
        customerId: customer.id!,
        amount: 50.00,
        description: 'Teste de pagamento PIX',
        externalReference: 'test-payment-' + Date.now()
      });
      
      if (pixPayment) {
        setResult(prev => prev + `✅ Pagamento PIX criado: ${pixPayment.id}\n`);
        setResult(prev => prev + `📱 Status: ${pixPayment.status}\n`);
        if (pixPayment.pixTransaction?.payload) {
          setResult(prev => prev + `🔗 Código PIX: ${pixPayment.pixTransaction.payload.substring(0, 50)}...\n`);
        }
      } else {
        setError('❌ Falha ao criar pagamento PIX');
      }
      
    } catch (err: any) {
      setError(`❌ Erro no teste: ${err.message}`);
      console.error('Erro completo:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>🧪 Teste de Integração Asaas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testAsaasIntegration} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testando...' : 'Executar Teste'}
          </Button>
          
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Resultados:</h3>
              <pre className="text-sm text-green-700 whitespace-pre-wrap">{result}</pre>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Erro:</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Informações:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Este teste verifica se a API Asaas está configurada corretamente</li>
              <li>• Cria um cliente de teste e um pagamento PIX</li>
              <li>• Utiliza dados fictícios para teste</li>
              <li>• Ambiente: Sandbox</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}