'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, DollarSign, Calendar, Crown, Star, Zap, Building, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { usePlanStore, Plan } from '@/store/planStore';
import { DeleteConfirmDialog, StatusChangeConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingButton, ContextLoading } from '@/components/ui/LoadingStates';

export default function AdminPricingPage() {
  const { 
    plans, 
    loading, 
    error, 
    fetchPlans, 
    updatePlan, 
    deletePlan, 
    clearError 
  } = usePlanStore();
  
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; plan: Plan | null }>({ show: false, plan: null });
  const [statusConfirm, setStatusConfirm] = useState<{ show: boolean; plan: Plan | null }>({ show: false, plan: null });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Carregar planos ao montar o componente
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleStatusToggle = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    
    setActionLoading(planId);
    try {
      await updatePlan(planId, { isActive: !plan.isActive });
      toast.success('Status do plano atualizado');
      setStatusConfirm({ show: false, plan: null });
    } catch (error) {
      toast.error('Erro ao atualizar status do plano');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (planId: string) => {
    setActionLoading(planId);
    try {
      await deletePlan(planId);
      toast.success('Plano excluído com sucesso');
      setDeleteConfirm({ show: false, plan: null });
    } catch (error) {
      toast.error('Erro ao excluir plano');
    } finally {
      setActionLoading(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'básico': return <Users className="h-6 w-6" />;
      case 'profissional': return <Star className="h-6 w-6" />;
      case 'premium': return <Crown className="h-6 w-6" />;
      case 'empresarial': return <Building className="h-6 w-6" />;
      default: return <Zap className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'básico': return 'bg-gray-100 text-gray-600';
      case 'profissional': return 'bg-blue-100 text-blue-600';
      case 'premium': return 'bg-purple-100 text-purple-600';
      case 'empresarial': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getSupportLabel = (support: string) => {
    const labels = {
      BASIC: 'Básico',
      PRIORITY: 'Prioritário',
      DEDICATED: 'Dedicado'
    };
    return labels[support as keyof typeof labels] || support;
  };

  // Calcular estatísticas dos planos
  const totalSubscribers = plans.reduce((sum, plan) => sum + (plan._count?.subscriptions || 0), 0);
  const totalRevenue = plans.reduce((sum, plan) => sum + (plan.price * (plan._count?.subscriptions || 0)), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Planos</h1>
            <p className="text-gray-600">Gerencie os planos de preços da plataforma</p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Plano
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="text-red-800 font-medium">Erro ao carregar planos</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => {
                  clearError();
                  fetchPlans();
                }}
                className="ml-auto bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <ContextLoading 
            message="Carregando planos..."
            type="orders"
          />
        )}

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Assinantes</p>
                <p className="text-2xl font-bold text-gray-900">{totalSubscribers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Crown className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Planos Ativos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {plans.filter(p => p.isActive).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {totalSubscribers > 0 ? (totalRevenue / totalSubscribers).toFixed(2) : '0,00'}
                </p>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Plans Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
              {/* Plan Header */}
              <div className={`p-4 ${getPlanColor(plan.name)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPlanIcon(plan.name)}
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    plan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {plan.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              
              {/* Plan Content */}
              <div className="p-4">
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                
                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-gray-500 ml-1">/mês</span>
                  </div>
                </div>
                
                {/* Features */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Anúncios:</span>
                    <span className="font-medium">
                      {plan.maxListings === -1 ? 'Ilimitados' : plan.maxListings}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duração:</span>
                    <span className="font-medium">{plan.listingDuration} dias</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Suporte:</span>
                    <span className="font-medium">{getSupportLabel(plan.support)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Destaque:</span>
                    <span className={`font-medium ${plan.featured ? 'text-green-600' : 'text-red-600'}`}>
                      {plan.featured ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="border-t pt-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Assinantes:</span>
                      <div className="font-bold text-lg">{plan._count?.subscriptions || 0}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Receita:</span>
                      <div className="font-bold text-lg text-green-600">
                        R$ {(plan.price * (plan._count?.subscriptions || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <LoadingButton
                      variant="ghost"
                      size="sm"
                      loading={false}
                      onClick={() => setEditingPlan(plan)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-4 w-4" />
                    </LoadingButton>
                    <LoadingButton
                      variant="ghost"
                      size="sm"
                      loading={actionLoading === plan.id}
                      onClick={() => setDeleteConfirm({ show: true, plan })}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </LoadingButton>
                  </div>
                  
                  <LoadingButton
                    variant="ghost"
                    size="sm"
                    loading={actionLoading === plan.id}
                    onClick={() => setStatusConfirm({ show: true, plan })}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      plan.isActive 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {plan.isActive ? 'Desativar' : 'Ativar'}
                  </LoadingButton>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* Empty State */}
        {plans.length === 0 && (
          <div className="text-center py-12">
            <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum plano encontrado</h3>
            <p className="text-gray-500 mb-4">Comece criando seu primeiro plano de preços</p>
            <button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar Plano
            </button>
          </div>
        )}

        {/* Form Modal Placeholder */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Novo Plano</h2>
              <p className="text-gray-600 mb-4">Formulário de criação de plano será implementado aqui.</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialogs */}
        <DeleteConfirmDialog
           isOpen={deleteConfirm.show}
           onClose={() => setDeleteConfirm({ show: false, plan: null })}
           onConfirm={() => deleteConfirm.plan?.id && handleDelete(deleteConfirm.plan.id)}
           itemName={deleteConfirm.plan?.name || ''}
           loading={actionLoading === deleteConfirm.plan?.id}
         />

        <StatusChangeConfirmDialog
           isOpen={statusConfirm.show}
           onClose={() => setStatusConfirm({ show: false, plan: null })}
           onConfirm={() => statusConfirm.plan?.id && handleStatusToggle(statusConfirm.plan.id)}
           itemName={statusConfirm.plan?.name || ''}
           newStatus={statusConfirm.plan?.isActive ? 'inativo' : 'ativo'}
           loading={actionLoading === statusConfirm.plan?.id}
         />
      </div>
    </div>
  );
}