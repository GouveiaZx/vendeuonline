'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Eye, EyeOff, ArrowLeft, UserCheck, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Schema de validação
const adminRegisterSchema = z.object({
  inviteCode: z.string().min(1, 'Código de convite obrigatório'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/(?=.*[a-z])/, 'Deve conter pelo menos uma letra minúscula')
    .regex(/(?=.*[A-Z])/, 'Deve conter pelo menos uma letra maiúscula')
    .regex(/(?=.*\d)/, 'Deve conter pelo menos um número')
    .regex(/(?=.*[@$!%*?&])/, 'Deve conter pelo menos um caractere especial'),
  confirmPassword: z.string(),
  adminCode: z.string().min(1, 'Código administrativo obrigatório'),
  securityQuestion: z.string().min(1, 'Pergunta de segurança obrigatória'),
  securityAnswer: z.string().min(3, 'Resposta deve ter pelo menos 3 caracteres'),
  termsAccepted: z.boolean().refine(val => val === true, 'Aceite dos termos obrigatório'),
  securityTermsAccepted: z.boolean().refine(val => val === true, 'Aceite dos termos de segurança obrigatório')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

type AdminRegisterForm = z.infer<typeof adminRegisterSchema>;

const securityQuestions = [
  'Qual o nome da sua primeira escola?',
  'Qual o nome do seu primeiro animal de estimação?',
  'Em que cidade você nasceu?',
  'Qual o nome de solteira da sua mãe?',
  'Qual seu filme favorito da infância?',
  'Qual o nome da rua onde você morava quando criança?',
  'Qual seu professor favorito da escola?'
];

export default function AdminRegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AdminRegisterForm>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      inviteCode: '',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      adminCode: '',
      securityQuestion: '',
      securityAnswer: '',
      termsAccepted: false,
      securityTermsAccepted: false
    }
  });

  const onSubmit = async (data: AdminRegisterForm) => {
    try {
      setIsLoading(true);
      
      await register({
        name: data.name,
        email: data.email,
        password: data.password,
        type: 'ADMIN',
        phone: '',
        city: '',
        state: ''
      } as any);
      
      router.push('/admin');
    } catch (error: any) {
      console.error('Erro no registro:', error);
      form.setError('root', {
        message: error.message || 'Erro ao criar conta de administrador'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-center">
          <Shield className="h-12 w-12 text-white mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white mb-1">
            Registro Administrativo
          </h1>
          <p className="text-purple-100 text-sm">
            Criação de conta para administradores do sistema
          </p>
        </div>

        {/* Security Warning */}
        <div className="p-4 bg-amber-50 border-l-4 border-amber-400 mx-6 mt-6 rounded-r">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 font-medium">
                Aviso de Segurança
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Este registro requer códigos de autorização válidos. 
                Todas as tentativas são monitoradas e registradas.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Código de Convite */}
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
              Código de Convite *
            </label>
            <Input
              id="inviteCode"
              {...form.register('inviteCode')}
              placeholder="Digite o código de convite"
              className="text-center tracking-widest"
            />
            {form.formState.errors.inviteCode && (
              <p className="text-red-600 text-xs mt-1">{form.formState.errors.inviteCode.message}</p>
            )}
          </div>

          {/* Dados Pessoais */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo *
            </label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Digite seu nome completo"
            />
            {form.formState.errors.name && (
              <p className="text-red-600 text-xs mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-mail *
            </label>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
              placeholder="admin@empresa.com"
            />
            {form.formState.errors.email && (
              <p className="text-red-600 text-xs mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Senhas */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha *
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...form.register('password')}
                placeholder="Senha forte obrigatória"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-red-600 text-xs mt-1">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Senha *
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                {...form.register('confirmPassword')}
                placeholder="Confirme sua senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-500"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-red-600 text-xs mt-1">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Código Administrativo */}
          <div>
            <label htmlFor="adminCode" className="block text-sm font-medium text-gray-700 mb-1">
              Código Administrativo *
            </label>
            <Input
              id="adminCode"
              {...form.register('adminCode')}
              placeholder="Código especial de admin"
              className="text-center tracking-widest font-mono"
            />
            {form.formState.errors.adminCode && (
              <p className="text-red-600 text-xs mt-1">{form.formState.errors.adminCode.message}</p>
            )}
          </div>

          {/* Pergunta de Segurança */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pergunta de Segurança *
            </label>
            <select
              {...form.register('securityQuestion')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Selecione uma pergunta</option>
              {securityQuestions.map((question, index) => (
                <option key={index} value={question}>
                  {question}
                </option>
              ))}
            </select>
            {form.formState.errors.securityQuestion && (
              <p className="text-red-600 text-xs mt-1">
                {form.formState.errors.securityQuestion.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="securityAnswer" className="block text-sm font-medium text-gray-700 mb-1">
              Resposta de Segurança *
            </label>
            <Input
              id="securityAnswer"
              {...form.register('securityAnswer')}
              placeholder="Sua resposta secreta"
            />
            {form.formState.errors.securityAnswer && (
              <p className="text-red-600 text-xs mt-1">{form.formState.errors.securityAnswer.message}</p>
            )}
          </div>

          {/* Termos */}
          <div className="space-y-3">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                {...form.register('termsAccepted')}
                className="mt-1"
              />
              <span className="text-sm text-gray-700">
                Li e aceito os{' '}
                <Link href="/terms" className="text-purple-600 hover:underline">
                  Termos de Uso
                </Link>{' '}
                e{' '}
                <Link href="/privacy" className="text-purple-600 hover:underline">
                  Política de Privacidade
                </Link>
              </span>
            </label>
            {form.formState.errors.termsAccepted && (
              <p className="text-red-600 text-xs">
                {form.formState.errors.termsAccepted.message}
              </p>
            )}

            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                {...form.register('securityTermsAccepted')}
                className="mt-1"
              />
              <span className="text-sm text-gray-700">
                Aceito as{' '}
                <Link href="/admin/security-terms" className="text-purple-600 hover:underline">
                  Condições de Segurança Administrativa
                </Link>{' '}
                e responsabilidades do cargo
              </span>
            </label>
            {form.formState.errors.securityTermsAccepted && (
              <p className="text-red-600 text-xs">
                {form.formState.errors.securityTermsAccepted.message}
              </p>
            )}
          </div>

          {/* Erro Geral */}
          {form.formState.errors.root && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{form.formState.errors.root.message}</p>
            </div>
          )}

          {/* Botões */}
          <div className="space-y-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Criando Conta...
                </div>
              ) : (
                <div className="flex items-center">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Criar Conta Administrativa
                </div>
              )}
            </Button>

            <Link
              href="/login"
              className="flex items-center justify-center w-full p-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Login
            </Link>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            Conta administrativa criada com sucesso será submetida à aprovação
          </p>
        </div>
      </div>
    </div>
  );
}