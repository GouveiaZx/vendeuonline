-- Dados de teste para o marketplace
-- Deve ser executado após as migrações

-- Criar loja para o vendedor existente
INSERT INTO "Store" (
  id, 
  "sellerId", 
  name, 
  description, 
  slug, 
  "isActive", 
  "createdAt", 
  "updatedAt"
) VALUES (
  'store-maria-vendedora',
  '88acbec9-3e0c-43f0-bfd8-e39527633e5e',
  'Loja da Maria',
  'Eletrônicos e gadgets com os melhores preços do mercado',
  'loja-da-maria',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Criar algumas categorias básicas
INSERT INTO "Category" (
  id,
  name,
  description,
  slug,
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES 
('cat-1', 'Eletrônicos', 'Smartphones, tablets e acessórios', 'eletronicos', true, NOW(), NOW()),
('cat-2', 'Informática', 'Computadores, notebooks e periféricos', 'informatica', true, NOW(), NOW()),
('cat-3', 'Casa e Decoração', 'Móveis, decoração e utensílios domésticos', 'casa-decoracao', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Criar produtos funcionais
INSERT INTO "Product" (
  id,
  "storeId",
  "categoryId", 
  name,
  description,
  price,
  "comparePrice",
  sku,
  stock,
  "isActive",
  "isFeatured",
  tags,
  "createdAt",
  "updatedAt"
) VALUES 
(
  'product-iphone-15',
  'store-maria-vendedora',
  'cat-1',
  'iPhone 15 Pro Max 256GB',
  'O mais avançado iPhone da Apple com câmera profissional de 48MP, tela Super Retina XDR de 6.7 polegadas, processador A17 Pro e design em titânio premium. Ideal para fotografia profissional e jogos.',
  7999.99,
  8999.99,
  'IPHONE15PM256GB',
  8,
  true,
  true,
  ARRAY['smartphone', 'apple', 'premium', 'camera'],
  NOW(),
  NOW()
),
(
  'product-samsung-s24',
  'store-maria-vendedora', 
  'cat-1',
  'Samsung Galaxy S24 Ultra',
  'Smartphone Android premium com tela de 6.8 polegadas, câmera de 200MP, S Pen integrada e bateria de longa duração. Perfeito para produtividade e entretenimento.',
  4999.99,
  5499.99,
  'GALAXYS24ULTRA',
  12,
  true,
  true,
  ARRAY['smartphone', 'samsung', 'android', 's-pen'],
  NOW(),
  NOW()
),
(
  'product-macbook-air',
  'store-maria-vendedora',
  'cat-2', 
  'MacBook Air M3 13" 256GB',
  'Notebook ultrafino da Apple com chip M3, tela Liquid Retina de 13.6 polegadas, até 18 horas de bateria e design elegante. Ideal para trabalho e estudos.',
  9999.99,
  10999.99,
  'MACBOOKAIRM3256',
  5,
  true,
  false,
  ARRAY['notebook', 'apple', 'macbook', 'm3'],
  NOW(),
  NOW()
),
(
  'product-airpods-pro',
  'store-maria-vendedora',
  'cat-1',
  'AirPods Pro (3ª Geração)',
  'Fones de ouvido sem fio da Apple com cancelamento ativo de ruído, áudio espacial e até 30 horas de reprodução com o estojo de carregamento.',
  2199.99,
  2499.99,
  'AIRPODSPRO3GEN',
  25,
  true,
  false,
  ARRAY['fones', 'apple', 'wireless', 'cancelamento-ruido'],
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Atualizar produto existente para ter dados corretos
UPDATE "Product" 
SET 
  "storeId" = 'store-maria-vendedora',
  "categoryId" = 'cat-1',
  name = 'Samsung Galaxy S24 128GB',
  description = 'Smartphone Galaxy S24 com tela Dynamic AMOLED de 6.1 polegadas, câmera tripla de 50MP, processador Exynos 2400 e 128GB de armazenamento.',
  price = 3499.99,
  "comparePrice" = 3799.99,
  sku = 'GALAXYS24128GB',
  stock = 15,
  "isActive" = true,
  "isFeatured" = false,
  tags = ARRAY['smartphone', 'samsung', 'android', 'galaxy'],
  "updatedAt" = NOW()
WHERE id = 'test-product-1';