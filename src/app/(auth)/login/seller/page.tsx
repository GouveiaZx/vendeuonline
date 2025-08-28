'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Store, ShoppingBag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuthStoreSafe } from '@/hooks/useAuthStoreSafe';
import Logo from '@/components/ui/Logo';

const sellerLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
});

type SellerLoginFormData = z.infer<typeof sellerLoginSchema>;

export default function SellerLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, isLoading, error } = useAuthStoreSafe();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SellerLoginFormData>({
    resolver: zodResolver(sellerLoginSchema),
    mode: 'onChange'
  });

  const onSubmit = async (data: SellerLoginFormData) => {
    try {
      await login({ 
        email: data.email, 
        password: data.password,
        
      });
      
      toast.success('Login realizado com sucesso! Bem-vindo ao seu painel de vendas.');
      
      // Redirecionar para o dashboard do vendedor
      router.push('/seller');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo size="lg" variant="white" />
        </div>
        <div className="flex items-center justify-center mt-6">
          <Store className="h-8 w-8 text-green-400 mr-2" />
          <h2 className="text-center text-3xl font-bold text-white">
            Portal do Vendedor
          </h2>
        </div>
        <p className="mt-2 text-center text-sm text-gray-300">
          Acesse seu painel para gerenciar sua loja
        </p>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            <Link
              href="/login"
              className="font-medium text-blue-400 hover:text-blue-300 transition-colors mr-4"
            >
              ← Login Cliente
            </Link>
            |
            <Link
              href="/register/seller"
              className="font-medium text-green-400 hover:text-green-300 transition-colors ml-4"
            >
              Cadastrar como Vendedor
            </Link>
          </p>
        </div>
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
                Email da Conta de Vendedor
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
                  className="block w-full pl-10 pr-3 py-2 border border-white/30 rounded-md shadow-sm placeholder-gray-400 bg-white/10 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 backdrop-blur-sm"
                  placeholder="vendedor@exemplo.com"
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
                  className="block w-full pl-10 pr-10 py-2 border border-white/30 rounded-md shadow-sm placeholder-gray-400 bg-white/10 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 backdrop-blur-sm"
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

            {/* Lembrar de mim e Esqueci a senha */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-white/30 rounded bg-white/10"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-white">
                  Lembrar de mim
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-green-400 hover:text-green-300 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            {/* Botão de Submit */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Entrando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Store className="h-4 w-4 mr-2" />
                    Acessar Painel de Vendas
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Recursos para vendedores */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-300">Recursos para vendedores</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <ShoppingBag className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <p className="text-xs text-white">Gerenciar Produtos</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <Store className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <p className="text-xs text-white">Painel da Loja</p>
              </div>
            </div>
          </div>

          {/* Call to action para novos vendedores */}
          <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-400/30 rounded-md">
            <div className="text-center">
              <h3 className="text-sm font-medium text-green-300">Novo por aqui?</h3>
              <p className="mt-1 text-xs text-gray-300">
                Cadastre-se como vendedor e comece a vender hoje mesmo!
              </p>
              <Link
                href="/register/seller"
                className="mt-2 inline-flex items-center text-xs font-medium text-green-400 hover:text-green-300 transition-colors"
              >
                Criar conta de vendedor →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}