'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Store, FileText, Phone, Building } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import Logo from '@/components/ui/Logo';

const sellerRegistrationSchema = z.object({
  // Dados pessoais
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
  
  // Dados da loja
  storeName: z.string().min(3, 'Nome da loja deve ter pelo menos 3 caracteres'),
  storeDescription: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  category: z.string().min(1, 'Selecione uma categoria'),
  
  // Dados comerciais
  cnpj: z.string().optional(),
  companyName: z.string().optional(),
  
  // Endereço
  cep: z.string().min(8, 'CEP deve ter 8 dígitos'),
  street: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(3, 'Bairro deve ter pelo menos 3 caracteres'),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  state: z.string().min(2, 'Estado deve ter 2 caracteres'),
  
  // Termos
  acceptTerms: z.boolean().refine(val => val === true, 'Você deve aceitar os termos'),
  acceptPrivacy: z.boolean().refine(val => val === true, 'Você deve aceitar a política de privacidade')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type SellerRegistrationFormData = z.infer<typeof sellerRegistrationSchema>;

const categories = [
  'Eletrônicos',
  'Moda e Vestuário',
  'Casa e Jardim',
  'Esportes e Lazer',
  'Livros e Educação',
  'Saúde e Beleza',
  'Automotivo',
  'Pets',
  'Brinquedos',
  'Outros'
];

export default function SellerRegistrationPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger
  } = useForm<SellerRegistrationFormData>({
    resolver: zodResolver(sellerRegistrationSchema),
    mode: 'onChange'
  });

  const onSubmit = async (data: SellerRegistrationFormData) => {
    clearError();
    
    try {
      await registerUser({ 
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        type: 'SELLER',
        city: data.city,
        state: data.state,
        storeName: data.storeName,
        storeDescription: data.storeDescription,
        cnpj: data.cnpj,
        address: data.street,
        zipCode: data.cep,
        category: data.category
      } as any);
      
      toast.success('Cadastro realizado com sucesso! Bem-vindo ao marketplace!');
      
      // Redirecionar para o dashboard do vendedor
      router.push('/seller');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar conta. Tente novamente.');
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof SellerRegistrationFormData)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['name', 'email', 'phone', 'password', 'confirmPassword'];
        break;
      case 2:
        fieldsToValidate = ['storeName', 'storeDescription', 'category'];
        break;
      case 3:
        fieldsToValidate = ['cep', 'street', 'number', 'neighborhood', 'city', 'state'];
        break;
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="flex justify-center">
          <Logo size="lg" variant="default" />
        </div>
        <div className="flex items-center justify-center mt-6">
          <Store className="h-8 w-8 text-green-600 mr-2" />
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Cadastro de Vendedor
          </h2>
        </div>
        <p className="mt-2 text-center text-sm text-gray-600">
          Crie sua loja e comece a vender hoje mesmo
        </p>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Já possui uma conta?{' '}
            <Link
              href="/login/seller"
              className="font-medium text-green-600 hover:text-green-500 transition-colors"
            >
              Faça login aqui
            </Link>
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl mt-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  ${step <= currentStep 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-600'}
                `}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`
                    h-1 w-16 mx-2
                    ${step < currentStep ? 'bg-green-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Dados Pessoais</span>
            <span>Dados da Loja</span>
            <span>Endereço</span>
            <span>Confirmação</span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Mensagem de erro global */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Step 1: Dados Pessoais */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Dados Pessoais</h3>
                  <p className="text-sm text-gray-600">Informações básicas da sua conta</p>
                </div>

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
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
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
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
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
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
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
                      className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Sua senha"
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
                      className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
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
              </div>
            )}

            {/* Step 2: Dados da Loja */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Dados da Loja</h3>
                  <p className="text-sm text-gray-600">Configure sua loja virtual</p>
                </div>

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
                      {...register('storeName')}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Nome da sua loja"
                    />
                  </div>
                  {errors.storeName && (
                    <p className="mt-1 text-sm text-red-600">{errors.storeName.message}</p>
                  )}
                </div>

                {/* Descrição da Loja */}
                <div>
                  <label htmlFor="storeDescription" className="block text-sm font-medium text-gray-700">
                    Descrição da Loja
                  </label>
                  <textarea
                    id="storeDescription"
                    rows={3}
                    {...register('storeDescription')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Descreva sua loja e os produtos que vende"
                  />
                  {errors.storeDescription && (
                    <p className="mt-1 text-sm text-red-600">{errors.storeDescription.message}</p>
                  )}
                </div>

                {/* Categoria */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Categoria Principal
                  </label>
                  <select
                    id="category"
                    {...register('category')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                {/* CNPJ (Opcional) */}
                <div>
                  <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">
                    CNPJ (Opcional)
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="cnpj"
                      type="text"
                      {...register('cnpj')}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>

                {/* Nome da Empresa (Opcional) */}
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Razão Social (Opcional)
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="companyName"
                      type="text"
                      {...register('companyName')}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Nome da empresa"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Endereço */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Endereço</h3>
                  <p className="text-sm text-gray-600">Endereço para entrega e retirada</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* CEP */}
                  <div>
                    <label htmlFor="cep" className="block text-sm font-medium text-gray-700">
                      CEP
                    </label>
                    <input
                      id="cep"
                      type="text"
                      {...register('cep')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="00000-000"
                    />
                    {errors.cep && (
                      <p className="mt-1 text-sm text-red-600">{errors.cep.message}</p>
                    )}
                  </div>

                  {/* Estado */}
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      Estado
                    </label>
                    <input
                      id="state"
                      type="text"
                      {...register('state')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="SP"
                    />
                    {errors.state && (
                      <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                    )}
                  </div>
                </div>

                {/* Rua */}
                <div>
                  <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                    Endereço
                  </label>
                  <input
                    id="street"
                    type="text"
                    {...register('street')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Rua, Avenida, etc."
                  />
                  {errors.street && (
                    <p className="mt-1 text-sm text-red-600">{errors.street.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Número */}
                  <div>
                    <label htmlFor="number" className="block text-sm font-medium text-gray-700">
                      Número
                    </label>
                    <input
                      id="number"
                      type="text"
                      {...register('number')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="123"
                    />
                    {errors.number && (
                      <p className="mt-1 text-sm text-red-600">{errors.number.message}</p>
                    )}
                  </div>

                  {/* Complemento */}
                  <div>
                    <label htmlFor="complement" className="block text-sm font-medium text-gray-700">
                      Complemento
                    </label>
                    <input
                      id="complement"
                      type="text"
                      {...register('complement')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Apto, sala, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bairro */}
                  <div>
                    <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700">
                      Bairro
                    </label>
                    <input
                      id="neighborhood"
                      type="text"
                      {...register('neighborhood')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Nome do bairro"
                    />
                    {errors.neighborhood && (
                      <p className="mt-1 text-sm text-red-600">{errors.neighborhood.message}</p>
                    )}
                  </div>

                  {/* Cidade */}
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      Cidade
                    </label>
                    <input
                      id="city"
                      type="text"
                      {...register('city')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Nome da cidade"
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Confirmação */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Confirmação</h3>
                  <p className="text-sm text-gray-600">Revise seus dados e aceite os termos</p>
                </div>

                {/* Resumo dos dados */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <strong>Nome:</strong> {watch('name')}
                  </div>
                  <div>
                    <strong>Email:</strong> {watch('email')}
                  </div>
                  <div>
                    <strong>Loja:</strong> {watch('storeName')}
                  </div>
                  <div>
                    <strong>Categoria:</strong> {watch('category')}
                  </div>
                  <div>
                    <strong>Endereço:</strong> {watch('street')}, {watch('number')} - {watch('city')}, {watch('state')}
                  </div>
                </div>

                {/* Termos e Condições */}
                <div className="space-y-4">
                  <div className="flex items-start">
                    <input
                      id="acceptTerms"
                      type="checkbox"
                      {...register('acceptTerms')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                    />
                    <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900">
                      Aceito os{' '}
                      <Link href="/terms" className="text-green-600 hover:text-green-500">
                        Termos de Uso
                      </Link>{' '}
                      e{' '}
                      <Link href="/seller-agreement" className="text-green-600 hover:text-green-500">
                        Contrato de Vendedor
                      </Link>
                    </label>
                  </div>
                  {errors.acceptTerms && (
                    <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
                  )}

                  <div className="flex items-start">
                    <input
                      id="acceptPrivacy"
                      type="checkbox"
                      {...register('acceptPrivacy')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                    />
                    <label htmlFor="acceptPrivacy" className="ml-2 block text-sm text-gray-900">
                      Aceito a{' '}
                      <Link href="/privacy" className="text-green-600 hover:text-green-500">
                        Política de Privacidade
                      </Link>
                    </label>
                  </div>
                  {errors.acceptPrivacy && (
                    <p className="text-sm text-red-600">{errors.acceptPrivacy.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Anterior
                </button>
              )}
              
              <div className="flex-1" />
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Próximo
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  Criar Conta de Vendedor
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}