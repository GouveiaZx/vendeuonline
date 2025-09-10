"use client";

import { useState, useEffect } from "react";
import { Check, Crown, Users, Building, Zap } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billingPeriod: "MONTHLY" | "YEARLY" | "LIFETIME";
  maxAds: number;
  maxPhotosPerAd: number;
  supportLevel: "EMAIL" | "CHAT" | "PHONE" | "PRIORITY";
  features: string[];
  isActive: boolean;
  order: number;
}

interface PricingPlansProps {
  onSelectPlan?: (planId: string) => void;
  currentPlanId?: string;
  showTitle?: boolean;
}

const planIcons = {
  gratuito: Crown,
  basico: Users,
  profissional: Building,
  empresa: Zap,
};

const planColors = {
  gratuito: "bg-gray-50 border-gray-200",
  basico: "bg-blue-50 border-blue-200",
  profissional: "bg-green-50 border-green-200",
  empresa: "bg-purple-50 border-purple-200",
};

const buttonColors = {
  gratuito: "bg-gray-600 hover:bg-gray-700 text-white",
  basico: "bg-blue-600 hover:bg-blue-700 text-white",
  profissional: "bg-green-600 hover:bg-green-700 text-white",
  empresa: "bg-purple-600 hover:bg-purple-700 text-white",
};

export default function PricingPlans({ onSelectPlan, currentPlanId, showTitle = true }: PricingPlansProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/plans");
      const data = await response.json();

      if (data.success) {
        // Mapear campos da API para o formato esperado pelo componente
        const mappedPlans = (data.plans || data.data || []).map((plan: any) => ({
          ...plan,
          billingPeriod: "MONTHLY",
          maxPhotosPerAd: plan.maxPhotos || 1,
          supportLevel:
            plan.support === "email"
              ? "EMAIL"
              : plan.support === "chat"
                ? "CHAT"
                : plan.support === "telefone"
                  ? "PHONE"
                  : plan.support === "whatsapp"
                    ? "PRIORITY"
                    : "EMAIL",
        }));
        setPlans(mappedPlans);
      } else {
        toast.error("Erro ao carregar planos");
      }
    } catch (error) {
      console.error("Erro ao buscar planos:", error);
      toast.error("Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      toast.error("Faça login para assinar um plano");
      return;
    }

    if (onSelectPlan) {
      onSelectPlan(planId);
      return;
    }

    setSubscribing(planId);

    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        // Recarregar dados do usuário se necessário
      } else {
        toast.error(data.error || "Erro ao assinar plano");
      }
    } catch (error) {
      console.error("Erro ao assinar plano:", error);
      toast.error("Erro ao assinar plano");
    } finally {
      setSubscribing(null);
    }
  };

  const formatPrice = (price: number, billingPeriod: string) => {
    if (price === 0) return "Grátis";

    const suffix = billingPeriod === "MONTHLY" ? "/mês" : billingPeriod === "YEARLY" ? "/ano" : "";

    return `R$ ${price.toFixed(2).replace(".", ",")}${suffix}`;
  };

  const getSupportText = (level: string) => {
    switch (level) {
      case "EMAIL":
        return "Suporte por email";
      case "CHAT":
        return "Suporte por chat";
      case "PHONE":
        return "Suporte por telefone";
      case "PRIORITY":
        return "Suporte prioritário";
      default:
        return "Suporte básico";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="py-12">
      {showTitle && (
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Escolha o Plano Ideal para Seu Negócio</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Planos flexíveis para atender desde pequenos empreendedores até grandes empresas
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
        {plans.map((plan) => {
          const IconComponent = planIcons[plan.slug as keyof typeof planIcons] || Crown;
          const isCurrentPlan = currentPlanId === plan.id;
          const isSubscribing = subscribing === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-lg min-h-[500px] flex flex-col ${
                planColors[plan.slug as keyof typeof planColors] || "bg-gray-50 border-gray-200"
              }`}
            >
              {/* Ícone do plano */}
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm mb-4 mx-auto">
                <IconComponent className="w-6 h-6 text-gray-700" />
              </div>

              {/* Nome e descrição */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </div>

              {/* Preço */}
              <div className="text-center mb-6">
                <div className="text-2xl font-bold text-gray-900">{formatPrice(plan.price, plan.billingPeriod)}</div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6 flex-grow">
                {plan.features?.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}

                {/* Features adicionais baseadas no plano */}
                <div className="flex items-center text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>{getSupportText(plan.supportLevel)}</span>
                </div>

                {plan.slug !== "gratuito" && (
                  <div className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Duração de 30 dias</span>
                  </div>
                )}
              </div>

              {/* Botão de ação */}
              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isCurrentPlan || isSubscribing}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                  isCurrentPlan
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : isSubscribing
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : buttonColors[plan.slug as keyof typeof buttonColors] ||
                        "bg-gray-600 hover:bg-gray-700 text-white"
                }`}
              >
                {isCurrentPlan
                  ? "Plano Atual"
                  : isSubscribing
                    ? "Processando..."
                    : plan.price === 0
                      ? "Começar Grátis"
                      : "Fazer Upgrade"}
              </button>

              {plan.price > 0 && <p className="text-xs text-gray-500 text-center mt-2">30 dias grátis</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
