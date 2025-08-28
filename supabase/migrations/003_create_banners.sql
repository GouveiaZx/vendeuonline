-- Criar tabela de banners
CREATE TABLE IF NOT EXISTS banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  imageUrl TEXT NOT NULL,
  targetUrl TEXT NOT NULL,
  position VARCHAR(50) NOT NULL CHECK (position IN ('HEADER', 'SIDEBAR', 'FOOTER', 'CATEGORY')),
  isActive BOOLEAN DEFAULT true,
  startDate TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  endDate TIMESTAMP WITH TIME ZONE,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(isActive);
CREATE INDEX IF NOT EXISTS idx_banners_dates ON banners(startDate, endDate);
CREATE INDEX IF NOT EXISTS idx_banners_created_at ON banners(createdAt);

-- Habilitar RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para banners
-- Permitir leitura pública de banners ativos
CREATE POLICY "Banners são visíveis publicamente" ON banners
  FOR SELECT USING (isActive = true);

-- Apenas administradores podem gerenciar banners
CREATE POLICY "Apenas admins podem gerenciar banners" ON banners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text 
      AND users.type = 'ADMIN'
      AND users."isVerified" = true
    )
  );

-- Conceder permissões
GRANT SELECT ON banners TO anon;
GRANT ALL PRIVILEGES ON banners TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Inserir alguns banners de exemplo
INSERT INTO banners (title, description, imageUrl, targetUrl, position, isActive, startDate, endDate) VALUES
('Banner Principal', 'Promoção especial de lançamento', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20marketplace%20banner%20promotion&image_size=landscape_16_9', '/products', 'HEADER', true, NOW(), NOW() + INTERVAL '30 days'),
('Banner Lateral', 'Descubra novos produtos', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=sidebar%20banner%20discover%20products&image_size=portrait_4_3', '/stores', 'SIDEBAR', true, NOW(), NOW() + INTERVAL '15 days'),
('Banner Categoria', 'Eletrônicos em oferta', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=electronics%20sale%20banner&image_size=landscape_4_3', '/products?category=electronics', 'CATEGORY', true, NOW(), NOW() + INTERVAL '7 days');