'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Building, Store } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Logo from '@/components/ui/Logo';

const baseSchema = {
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
  phone: z.string().min(10, 'Telefone inválido'),
  userType: z.enum(['buyer', 'seller'], {
    message: 'Selecione o tipo de usuário'
  })
};

const buyerSchema = z.object({
  ...baseSchema,
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
});

const sellerSchema = z.object({
  ...baseSchema,
  storeName: z.string().min(2, 'Nome da loja é obrigatório'),
  storeDescription: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  cnpj: z.string().optional(),
  address: z.string().min(5, 'Endereço é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zipCode: z.string().min(8, 'CEP inválido'),
  category: z.string().min(1, 'Categoria é obrigatória')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
});

type BuyerFormData = z.infer<typeof buyerSchema>;
type SellerFormData = z.infer<typeof sellerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<'buyer' | 'seller'>('buyer');
  const router = useRouter();

  const schema = userType === 'buyer' ? buyerSchema : sellerSchema;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      userType: 'buyer'
    }
  });

  const watchedUserType = watch('userType');

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    
    try {
      // Usar a API real de registro
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          userType: data.userType,
          city: data.city,
          state: data.state,
          // Campos especÃ­ficos para vendedor
          ...(data.userType === 'seller' && {
            storeName: data.storeName,
            storeDescription: data.storeDescription,
            cnpj: data.cnpj,
            address: data.address,
            zipCode: data.zipCode,
            category: data.category
          })
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar conta');
      }
      
      toast.success('Conta criada com sucesso!');
      
      // Redirecionar para login
      router.push('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserTypeChange = (type: 'buyer' | 'seller') => {
    setUserType(type);
    setValue('userType', type);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo size="lg" showText={false} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Criar nova conta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ou{' '}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            entrar na sua conta existente
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Tipo de UsuÃ¡rio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Conta
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative">
                  <input
                    type="radio"
                    value="buyer"
                    checked={userType === 'buyer'}
                    onChange={() => handleUserTypeChange('buyer')}
                    className="sr-only peer"
                  />
                  <div className="p-4 text-center border-2 rounded-lg cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 transition-all">
                    <User className="h-8 w-8 mx-auto mb-2 text-gray-400 peer-checked:text-blue-600" />
                    <div className="font-medium">Comprador</div>
                    <div className="text-xs text-gray-500 mt-1">Quero comprar produtos</div>
                  </div>
                </label>
                <label className="relative">
                  <input
                    type="radio"
                    value="seller"
                    checked={userType === 'seller'}
                    onChange={() => handleUserTypeChange('seller')}
                    className="sr-only peer"
                  />
                  <div className="p-4 text-center border-2 rounded-lg cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 transition-all">
                    <Building className="h-8 w-8 mx-auto mb-2 text-gray-400 peer-checked:text-blue-600" />
                    <div className="font-medium">Vendedor</div>
                    <div className="text-xs text-gray-500 mt-1">Quero vender produtos</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Dados Pessoais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    {...register('name')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Seu nome completo"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="seu@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Senha */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Confirmar Senha */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar Senha
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirme sua senha"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Cidade */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  Cidade
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="city"
                    type="text"
                    {...register('city')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Sua cidade"
                  />
                </div>
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              {/* Estado */}
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <select
                  id="state"
                  {...register('state')}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione o estado</option>
                  <option value="SP">São Paulo</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="PR">Paraná</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="SC">Santa Catarina</option>
                </select>
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                )}
              </div>
            </div>

            {/* Campos especÃ­ficos para vendedor */}
            {userType === 'seller' && (
              <div className="space-y-6 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900">Informações da Loja</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome da Loja */}
                  <div>
                    <label htmlFor="storeName" className="block text-sm font-medium text-gray-700">
                      Nome da Loja
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Store className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="storeName"
                        type="text"
                        {...register('storeName' as any)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nome da sua loja"
                      />
                    </div>
                    {(errors as any).storeName && (
                      <p className="mt-1 text-sm text-red-600">{(errors as any).storeName.message}</p>
                    )}
                  </div>

                  {/* CNPJ */}
                  <div>
                    <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">
                      CNPJ (Opcional)
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="cnpj"
                        type="text"
                        {...register('cnpj' as any)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                  </div>

                  {/* Categoria */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Categoria Principal
                    </label>
                    <select
                      id="category"
                      {...register('category' as any)}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione uma categoria</option>
                      <option value="eletronicos">Eletrônicos</option>
                      <option value="roupas">Roupas e Acessórios</option>
                      <option value="casa">Casa e Jardim</option>
                      <option value="alimentacao">Alimentação</option>
                      <option value="beleza">Beleza e Cuidados</option>
                      <option value="esportes">Esportes e Lazer</option>
                      <option value="livros">Livros e Mídia</option>
                      <option value="artesanato">Artesanato</option>
                    </select>
                    {(errors as any).category && (
                      <p className="mt-1 text-sm text-red-600">{(errors as any).category.message}</p>
                    )}
                  </div>

                  {/* CEP */}
                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                      CEP
                    </label>
                    <input
                      id="zipCode"
                      type="text"
                      {...register('zipCode' as any)}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="00000-000"
                    />
                    {(errors as any).zipCode && (
                      <p className="mt-1 text-sm text-red-600">{(errors as any).zipCode.message}</p>
                    )}
                  </div>
                </div>

                {/* EndereÃ§o */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Endereço Completo
                  </label>
                  <input
                    id="address"
                    type="text"
                    {...register('address' as any)}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Rua, número, bairro"
                  />
                  {(errors as any).address && (
                    <p className="mt-1 text-sm text-red-600">{(errors as any).address.message}</p>
                  )}
                </div>

                {/* DescriÃ§Ã£o da Loja */}
                <div>
                  <label htmlFor="storeDescription" className="block text-sm font-medium text-gray-700">
                    Descrição da Loja
                  </label>
                  <textarea
                    id="storeDescription"
                    rows={3}
                    {...register('storeDescription' as any)}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Conte um pouco sobre sua loja e produtos..."
                  />
                  {(errors as any).storeDescription && (
                    <p className="mt-1 text-sm text-red-600">{(errors as any).storeDescription.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Termos e CondiÃ§Ãµes */}
            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                Eu aceito os{' '}
                <Link href="/terms" className="text-primary hover:text-primary/80">
                  Termos de Uso
                </Link>{' '}
                e a{' '}
                <Link href="/privacy" className="text-primary hover:text-primary/80">
                  Política de Privacidade
                </Link>
              </label>
            </div>

            {/* BotÃ£o de Submit */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

