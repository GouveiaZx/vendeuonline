'use client';

import { useState, useEffect } from 'react';
import { Check, Loader2, Building2, Users, Briefcase, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { formatters } from '@/utils/formatters';
import { usePlanStore } from '@/store/planStore';

interface PlanSelectorProps {
  onPlanSelect?: (planId: string) => void;
  selectedPlanId?: string;
  showPaymentButton?: boolean;
}

export default function PlanSelector({ 
  onPlanSelect, 
  selectedPlanId, 
  showPaymentButton = true 
}: PlanSelectorProps) {
  const { plans, loading, fetchPlans } = usePlanStore();
  const [selectedPlan, setSelectedPlan] = useState<string>(selectedPlanId || '');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Ícones para cada tipo de plano
  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'Micro-Empresa':
        return Building2;
      case 'Pequena Empresa':
        return Users;
      case 'Empresa Simples':
        return Briefcase;
      case 'Empresa Plus':
        return Crown;
      default:
        return Building2;
    }
  };

  // Cores para cada tipo de plano
  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'Micro-Empresa':
        return 'text-blue-600';
      case 'Pequena Empresa':
        return 'text-green-600';
      case 'Empresa Simples':
        return 'text-purple-600';
      case 'Empresa Plus':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  // Features detalhadas baseadas na documentação
  const getPlanFeatures = (planName: string) => {
    switch (planName) {
      case 'Micro-Empresa':
        return [
          '2 anúncios simultâneos',
          'Duração de 30 dias',
          'Até 6 fotos por anúncio',
          'Anúncio extra por R$ 14,90',
          'Estatísticas básicas',
          'Suporte por email',
          'Verificação do perfil',
          'Atendimento prioritário'
        ];
      case 'Pequena Empresa':
        return [
          '5 anúncios simultâneos',
          'Duração de 30 dias',
          'Até 10 fotos por anúncio',
          'Anúncio extra por R$ 14,90',
          'Estatísticas detalhadas',
          'Atendimento prioritário',
          'Verificação do perfil',
          'Logo na página de anúncios'
        ];
      case 'Empresa Simples':
        return [
          '10 anúncios simultâneos',
          'Duração de 30 dias',
          'Até 15 fotos por anúncio',
          'Anúncio extra por R$ 14,90',
          'Estatísticas avançadas',
          'Atendimento prioritário',
          'Verificação do perfil',
          'Perfil de loja personalizado'
        ];
      case 'Empresa Plus':
        return [
          '20 anúncios simultâneos',
          'Duração de 30 dias',
          'Até 20 fotos por anúncio',
          'Anúncio extra por R$ 14,90',
          'Estatísticas premium',
          'Suporte dedicado',
          'Verificação do perfil',
          'Perfil de loja personalizado'
        ];
      default:
        return [];
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    onPlanSelect?.(planId);
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      toast.error('Selecione um plano primeiro');
      return;
    }

    setProcessingPayment(true);

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan,
          paymentMethod
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Redirecionar para o checkout do Mercado Pago
        if (data.init_point && typeof window !== 'undefined') {
          window.location.href = data.init_point;
        } else {
          toast.error('Erro ao processar pagamento');
        }
      } else {
        toast.error(data.error || 'Erro ao processar pagamento');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento');
    } finally {
      setProcessingPayment(false);
    }
  };



  const getBillingText = (period: string) => {
    switch (period) {
      case 'MONTHLY':
        return '/mês';
      case 'YEARLY':
        return '/ano';
      case 'LIFETIME':
        return 'único';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const isPopular = plan.name === 'Pequena Empresa';
          const PlanIcon = getPlanIcon(plan.name);
          const planColor = getPlanColor(plan.name);
          const features = getPlanFeatures(plan.name);
          
          return (
            <Card 
              key={plan.id} 
              className={`relative cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' 
                  : 'hover:shadow-lg border-gray-200'
              } ${
                isPopular ? 'border-green-500 shadow-md' : ''
              }`}
              onClick={() => handlePlanSelect(plan.id)}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-green-500 text-white px-4 py-1 text-xs font-semibold">
                    MAIS POPULAR
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center ${
                  plan.name === 'Micro-Empresa' ? 'bg-blue-100' :
                  plan.name === 'Pequena Empresa' ? 'bg-green-100' :
                  plan.name === 'Empresa Simples' ? 'bg-purple-100' :
                  'bg-yellow-100'
                }`}>
                  <PlanIcon className={`h-6 w-6 ${planColor}`} />
                </div>
                
                <CardTitle className="text-lg font-bold text-gray-900">{plan.name}</CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  {plan.description}
                </CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatters.formatPrice(plan.price)}
                    </span>
                    <span className="text-gray-500 ml-1 text-sm">/mês</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-start text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4">
                  <Button 
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full ${
                      isSelected 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : plan.name === 'Pequena Empresa'
                        ? 'border-green-500 text-green-600 hover:bg-green-50'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlanSelect(plan.id);
                    }}
                  >
                    {isSelected ? 'Plano Selecionado' : 'Fazer Upgrade'}
                    {plan.name === 'Pequena Empresa' && !isSelected && (
                      <span className="ml-2 text-xs">🔥 30 dias grátis</span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {showPaymentButton && selectedPlan && (
        <div className="space-y-4 max-w-md mx-auto">
          <div className="space-y-3">
            <Label className="text-base font-medium">Método de Pagamento</Label>
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={(value) => setPaymentMethod(value as 'pix' | 'credit_card')}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pix" id="pix" />
                <Label htmlFor="pix" className="cursor-pointer">PIX</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credit_card" id="credit_card" />
                <Label htmlFor="credit_card" className="cursor-pointer">Cartão de Crédito</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Button 
            onClick={handlePayment}
            disabled={processingPayment}
            className="w-full"
            size="lg"
          >
            {processingPayment ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processando...
              </>
            ) : (
              'Continuar para Pagamento'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}