import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes
  await prisma.plan.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🗑️  Dados existentes removidos');

  // Seed de Planos
  const plans = [
    {
      name: 'Gratuito',
      slug: 'gratuito',
      description: 'Plano básico para começar a vender',
      price: 0,
      billingPeriod: 'monthly',
      maxAds: 5,
      maxPhotos: 3,
      maxProducts: 5,
      maxImages: 3,
      maxCategories: 2,
      prioritySupport: false,
      support: 'Community',
      features: JSON.stringify([
        '5 anúncios ativos',
        '3 fotos por produto',
        'Suporte por comunidade',
        'Painel básico'
      ]),
      isActive: true,
      order: 1
    },
    {
      name: 'Básico',
      slug: 'basico',
      description: 'Para vendedores iniciantes com mais recursos',
      price: 29.90,
      billingPeriod: 'monthly',
      maxAds: 25,
      maxPhotos: 5,
      maxProducts: 25,
      maxImages: 5,
      maxCategories: 5,
      prioritySupport: false,
      support: 'Email',
      features: JSON.stringify([
        '25 anúncios ativos',
        '5 fotos por produto',
        'Suporte por email',
        'Relatórios básicos',
        'Destacar produtos'
      ]),
      isActive: true,
      order: 2
    },
    {
      name: 'Premium',
      slug: 'premium',
      description: 'Para vendedores sérios que querem crescer',
      price: 59.90,
      billingPeriod: 'monthly',
      maxAds: 100,
      maxPhotos: 10,
      maxProducts: 100,
      maxImages: 10,
      maxCategories: -1,
      prioritySupport: false,
      support: 'Email + Chat',
      features: JSON.stringify([
        '100 anúncios ativos',
        '10 fotos por produto',
        'Suporte por email e chat',
        'Relatórios avançados',
        'Destacar produtos',
        'Análise de performance',
        'Categorias ilimitadas'
      ]),
      isActive: true,
      order: 3
    },
    {
      name: 'Profissional',
      slug: 'profissional',
      description: 'Para grandes vendedores e lojas estabelecidas',
      price: 99.90,
      billingPeriod: 'monthly',
      maxAds: 500,
      maxPhotos: 15,
      maxProducts: 500,
      maxImages: 15,
      maxCategories: -1,
      prioritySupport: true,
      support: 'Priority Support',
      features: JSON.stringify([
        '500 anúncios ativos',
        '15 fotos por produto',
        'Suporte prioritário',
        'Relatórios completos',
        'Destacar produtos',
        'Análise avançada',
        'Integrações API',
        'Gerente de conta'
      ]),
      isActive: true,
      order: 4
    },
    {
      name: 'Empresa Plus',
      slug: 'empresa-plus',
      description: 'Para empresas com volume alto de vendas',
      price: 199.90,
      billingPeriod: 'monthly',
      maxAds: -1,
      maxPhotos: -1,
      maxProducts: -1,
      maxImages: -1,
      maxCategories: -1,
      prioritySupport: true,
      support: 'Dedicated Support',
      features: JSON.stringify([
        'Anúncios ilimitados',
        'Fotos ilimitadas',
        'Suporte dedicado',
        'Relatórios personalizados',
        'API completa',
        'Integrações avançadas',
        'Consultoria especializada',
        'SLA garantido'
      ]),
      isActive: true,
      order: 5
    }
  ];

  console.log('📋 Criando planos...');
  const createdPlans = [];
  for (const plan of plans) {
    const created = await prisma.plan.create({
      data: plan
    });
    createdPlans.push(created);
    console.log(`✅ Plano "${created.name}" criado`);
  }

  // Seed de Categorias
  const categories = [
    { name: 'Eletrônicos', slug: 'eletronicos', description: 'Celulares, computadores, TVs e mais', isActive: true, order: 1 },
    { name: 'Moda', slug: 'moda', description: 'Roupas, sapatos e acessórios', isActive: true, order: 2 },
    { name: 'Casa e Jardim', slug: 'casa-jardim', description: 'Móveis, decoração e utensílios', isActive: true, order: 3 },
    { name: 'Veículos', slug: 'veiculos', description: 'Carros, motos e peças', isActive: true, order: 4 },
    { name: 'Esportes', slug: 'esportes', description: 'Equipamentos esportivos e lazer', isActive: true, order: 5 },
    { name: 'Bebês e Crianças', slug: 'bebes-criancas', description: 'Produtos infantis e brinquedos', isActive: true, order: 6 },
    { name: 'Livros', slug: 'livros', description: 'Livros, revistas e materiais educativos', isActive: true, order: 7 },
    { name: 'Imóveis', slug: 'imoveis', description: 'Casas, apartamentos e terrenos', isActive: true, order: 8 },
    { name: 'Serviços', slug: 'servicos', description: 'Prestação de serviços diversos', isActive: true, order: 9 },
    { name: 'Outros', slug: 'outros', description: 'Produtos diversos', isActive: true, order: 10 }
  ];

  console.log('📂 Criando categorias...');
  for (const category of categories) {
    const created = await prisma.category.create({
      data: category
    });
    console.log(`✅ Categoria "${created.name}" criada`);
  }

  // Seed de Usuários de teste
  console.log('👤 Criando usuários de teste...');
  
  const hashedPassword = await bcrypt.hash('123456', 12);
  
  const buyers = [
    {
      name: 'João Comprador',
      email: 'joao@teste.com',
      password: hashedPassword,
      phone: '(54) 99999-1111',
      type: 'BUYER',
      city: 'Erechim',
      state: 'RS',
      isVerified: true,
      isActive: true
    },
    {
      name: 'Maria Cliente',
      email: 'maria@teste.com',
      password: hashedPassword,
      phone: '(54) 99999-2222',
      type: 'BUYER',
      city: 'Erechim',
      state: 'RS',
      isVerified: true,
      isActive: true
    }
  ];

  for (const userData of buyers) {
    const user = await prisma.user.create({
      data: userData
    });
    
    // Criar perfil de buyer
    await prisma.buyer.create({
      data: {
        userId: user.id
      }
    });
    
    console.log(`✅ Buyer "${user.name}" criado`);
  }

  const sellers = [
    {
      name: 'Pedro Vendedor',
      email: 'pedro@teste.com',
      password: hashedPassword,
      phone: '(54) 99999-3333',
      type: 'SELLER',
      city: 'Erechim',
      state: 'RS',
      isVerified: true,
      isActive: true
    },
    {
      name: 'Ana Lojista',
      email: 'ana@teste.com',
      password: hashedPassword,
      phone: '(54) 99999-4444',
      type: 'SELLER',
      city: 'Erechim',
      state: 'RS',
      isVerified: true,
      isActive: true
    }
  ];

  for (const userData of sellers) {
    const user = await prisma.user.create({
      data: userData
    });
    
    // Criar perfil de seller
    const seller = await prisma.seller.create({
      data: {
        userId: user.id,
        rating: 4.5,
        totalSales: 0,
        commission: 5.0,
        isVerified: true,
        planId: createdPlans[0].id // Plano gratuito
      }
    });
    
    // Criar loja
    const storeName = `Loja ${user.name.split(' ')[0]}`;
    const storeSlug = storeName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    await prisma.store.create({
      data: {
        sellerId: seller.id,
        name: storeName,
        slug: `${storeSlug}-${Date.now()}`,
        description: `Bem-vindos à ${storeName}! Produtos de qualidade com ótimos preços.`,
        email: user.email,
        phone: user.phone,
        city: user.city,
        state: user.state,
        isVerified: true,
        isActive: true
      }
    });
    
    console.log(`✅ Seller "${user.name}" criado com loja "${storeName}"`);
  }

  // Admin de teste
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin Sistema',
      email: 'admin@vendeuonline.com',
      password: hashedPassword,
      phone: '(54) 99999-0000',
      type: 'ADMIN',
      city: 'Erechim',
      state: 'RS',
      isVerified: true,
      isActive: true
    }
  });

  await prisma.admin.create({
    data: {
      userId: adminUser.id,
      permissions: JSON.stringify(['all'])
    }
  });

  console.log(`✅ Admin "${adminUser.name}" criado`);

  console.log('');
  console.log('📋 Usuários de teste criados:');
  console.log('🔹 Buyers: joao@teste.com, maria@teste.com');
  console.log('🔹 Sellers: pedro@teste.com, ana@teste.com');
  console.log('🔹 Admin: admin@vendeuonline.com');
  console.log('🔑 Senha para todos: 123456');
  console.log('');
  console.log('✨ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });