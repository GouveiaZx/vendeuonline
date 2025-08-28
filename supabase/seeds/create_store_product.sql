-- Inserir categorias
INSERT INTO "Category" (id, name, description, slug, "isActive", "createdAt", "updatedAt") 
VALUES 
('cat-1', 'Eletrônicos', 'Smartphones, tablets e acessórios', 'eletronicos', true, NOW(), NOW()),
('cat-2', 'Informática', 'Computadores, notebooks e periféricos', 'informatica', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = NOW();

-- Inserir loja para o vendedor João Eletrônicos
INSERT INTO "Store" (id, "sellerId", name, description, slug, "isActive", "createdAt", "updatedAt")
VALUES ('store-joao-eletronicos', '5176035b-ab9a-4640-88e5-d6fa37c749ed', 'Eletrônicos João', 'Especialista em smartphones, notebooks e acessórios tecnológicos', 'eletronicos-joao', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = NOW();

-- Inserir produtos
INSERT INTO "Product" (
  id, "storeId", "categoryId", name, description, price, "comparePrice", 
  sku, stock, "isActive", "isFeatured", tags, "createdAt", "updatedAt"
)
VALUES 
(
  'product-iphone-15',
  'store-joao-eletronicos',
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
  'store-joao-eletronicos',
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
  'product-airpods-pro',
  'store-joao-eletronicos',
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
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  "updatedAt" = NOW();