import { createClient } from '@supabase/supabase-js';

// Configurar cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function insertTestData() {
  try {
    console.log('Inserindo dados de teste...');

    // Inserir categorias
    const { error: categoryError } = await supabase
      .from('Category')
      .upsert([
        {
          id: 'cat-1',
          name: 'Eletrônicos',
          description: 'Smartphones, tablets e acessórios',
          slug: 'eletronicos',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'cat-2',
          name: 'Informática',
          description: 'Computadores, notebooks e periféricos',
          slug: 'informatica',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ], { onConflict: 'id' });

    if (categoryError) {
      console.error('Erro ao inserir categorias:', categoryError);
    } else {
      console.log('✓ Categorias inseridas');
    }

    // Inserir loja para o vendedor existente
    const { error: storeError } = await supabase
      .from('Store')
      .upsert([
        {
          id: 'store-joao-eletronicos',
          sellerId: '5176035b-ab9a-4640-88e5-d6fa37c749ed',
          name: 'Eletrônicos João',
          description: 'Especialista em smartphones, notebooks e acessórios tecnológicos',
          slug: 'eletronicos-joao',
          logo: null,
          banner: null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ], { onConflict: 'id' });

    if (storeError) {
      console.error('Erro ao inserir loja:', storeError);
    } else {
      console.log('✓ Loja inserida');
    }

    // Inserir produtos
    const { error: productError } = await supabase
      .from('Product')
      .upsert([
        {
          id: 'product-iphone-15',
          storeId: 'store-joao-eletronicos',
          categoryId: 'cat-1',
          name: 'iPhone 15 Pro Max 256GB',
          description: 'O mais avançado iPhone da Apple com câmera profissional de 48MP, tela Super Retina XDR de 6.7 polegadas, processador A17 Pro e design em titânio premium. Ideal para fotografia profissional e jogos.',
          price: 7999.99,
          comparePrice: 8999.99,
          sku: 'IPHONE15PM256GB',
          stock: 8,
          isActive: true,
          isFeatured: true,
          tags: ['smartphone', 'apple', 'premium', 'camera'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'product-samsung-s24',
          storeId: 'store-joao-eletronicos',
          categoryId: 'cat-1',
          name: 'Samsung Galaxy S24 Ultra',
          description: 'Smartphone Android premium com tela de 6.8 polegadas, câmera de 200MP, S Pen integrada e bateria de longa duração. Perfeito para produtividade e entretenimento.',
          price: 4999.99,
          comparePrice: 5499.99,
          sku: 'GALAXYS24ULTRA',
          stock: 12,
          isActive: true,
          isFeatured: true,
          tags: ['smartphone', 'samsung', 'android', 's-pen'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'product-airpods-pro',
          storeId: 'store-joao-eletronicos',
          categoryId: 'cat-1',
          name: 'AirPods Pro (3ª Geração)',
          description: 'Fones de ouvido sem fio da Apple com cancelamento ativo de ruído, áudio espacial e até 30 horas de reprodução com o estojo de carregamento.',
          price: 2199.99,
          comparePrice: 2499.99,
          sku: 'AIRPODSPRO3GEN',
          stock: 25,
          isActive: true,
          isFeatured: false,
          tags: ['fones', 'apple', 'wireless', 'cancelamento-ruido'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ], { onConflict: 'id' });

    if (productError) {
      console.error('Erro ao inserir produtos:', productError);
    } else {
      console.log('✓ Produtos inseridos');
    }

    console.log('✅ Dados de teste inseridos com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao inserir dados de teste:', error);
  }
}

// Executar inserção
insertTestData();