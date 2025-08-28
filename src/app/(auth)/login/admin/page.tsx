'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import Logo from '@/components/ui/Logo';

const adminLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  adminCode: z.string().min(4, 'Código administrativo deve ter pelo menos 4 caracteres')
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    mode: 'onChange'
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    clearError();
    
    try {
      // Aqui você pode adicionar validação específica do código admin
      if (data.adminCode !== 'ADMIN2024') {
        toast.error('Código administrativo inválido');
        return;
      }

      await login({ 
        email: data.email, 
        password: data.password
      });
      
      toast.success('Login administrativo realizado com sucesso!');
      
      // Redirecionar para o dashboard admin
      router.push('/admin');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login administrativo. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo size="lg" variant="white" />
        </div>
        <div className="flex items-center justify-center mt-6">
          <Shield className="h-8 w-8 text-white mr-2" />
          <h2 className="text-center text-3xl font-bold text-white">
            Acesso Administrativo
          </h2>
        </div>
        <p className="mt-2 text-center text-sm text-gray-300">
          Área restrita para administradores do sistema
        </p>
        <p className="mt-4 text-center text-sm text-gray-400">
          <Link
            href="/login"
            className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Voltar ao login regular
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/10 backdrop-blur-sm py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Mensagem de erro global */}
            {error && (
              <div className="bg-red-500/10 border border-red-400/50 rounded-md p-3">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white">
                Email Administrativo
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="block w-full pl-10 pr-3 py-2 border border-white/30 rounded-md shadow-sm placeholder-gray-400 bg-white/10 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                  placeholder="admin@exemplo.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Senha
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className="block w-full pl-10 pr-10 py-2 border border-white/30 rounded-md shadow-sm placeholder-gray-400 bg-white/10 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-white" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-white" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-300">{errors.password.message}</p>
              )}
            </div>

            {/* Código Administrativo */}
            <div>
              <label htmlFor="adminCode" className="block text-sm font-medium text-white">
                Código Administrativo
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="adminCode"
                  type={showAdminCode ? 'text' : 'password'}
                  {...register('adminCode')}
                  className="block w-full pl-10 pr-10 py-2 border border-white/30 rounded-md shadow-sm placeholder-gray-400 bg-white/10 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                  placeholder="Código de acesso administrativo"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowAdminCode(!showAdminCode)}
                >
                  {showAdminCode ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-white" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-white" />
                  )}
                </button>
              </div>
              {errors.adminCode && (
                <p className="mt-1 text-sm text-red-300">{errors.adminCode.message}</p>
              )}
            </div>

            {/* Botão de Submit */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verificando acesso...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Acessar Painel Admin
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Informações de segurança */}
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-md">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-yellow-300 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-yellow-300">Acesso Restrito</h3>
                <p className="mt-1 text-xs text-yellow-200">
                  Este é um acesso administrativo restrito. Todos os acessos são monitorados e registrados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}