-- Migração para sistema de avaliações e reviews
-- Atualização da tabela reviews existente do Prisma para incluir campos adicionais

-- Verificar se a tabela reviews já existe (criada pelo Prisma)
-- Se não existir, criar com a estrutura completa
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "productId" TEXT REFERENCES "Product"(id) ON DELETE CASCADE,
  "storeId" TEXT REFERENCES stores(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  "isVerified" BOOLEAN DEFAULT FALSE,
  "helpfulCount" INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'pending_moderation')),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  
  -- Garantir que um review é para produto OU loja, não ambos
  CONSTRAINT check_review_target CHECK (
    ("productId" IS NOT NULL AND "storeId" IS NULL) OR
    ("productId" IS NULL AND "storeId" IS NOT NULL)
  ),
  
  -- Índices para performance
  CONSTRAINT unique_user_product_review UNIQUE ("userId", "productId"),
  CONSTRAINT unique_user_store_review UNIQUE ("userId", "storeId")
);

-- Tabela para votos úteis nos reviews
CREATE TABLE IF NOT EXISTS review_votes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "reviewId" TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "voteType" VARCHAR(10) NOT NULL CHECK ("voteType" IN ('helpful', 'not_helpful')),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_user_review_vote UNIQUE ("userId", "reviewId")
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews("productId") WHERE "productId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_store_id ON reviews("storeId") WHERE "storeId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews("userId");
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews("createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes("reviewId");
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON review_votes("userId");

-- Triggers para atualizar updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Views para estatísticas de reviews
CREATE OR REPLACE VIEW product_review_stats AS
SELECT 
  "productId",
  COUNT(*) as total_reviews,
  AVG(rating)::DECIMAL(3,2) as average_rating,
  COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
  COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
  COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
  COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
  COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count
FROM reviews 
WHERE status = 'active' AND "productId" IS NOT NULL
GROUP BY "productId";

CREATE OR REPLACE VIEW store_review_stats AS
SELECT 
  "storeId",
  COUNT(*) as total_reviews,
  AVG(rating)::DECIMAL(3,2) as average_rating,
  COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
  COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
  COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
  COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
  COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count
FROM reviews 
WHERE status = 'active' AND "storeId" IS NOT NULL
GROUP BY "storeId";

-- Habilitar RLS (Row Level Security)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para reviews
CREATE POLICY "Users can view active reviews" ON reviews
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can create their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (auth.uid()::text = "userId");

-- Políticas de segurança para review_votes
CREATE POLICY "Users can view all review votes" ON review_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own review votes" ON review_votes
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own review votes" ON review_votes
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete their own review votes" ON review_votes
  FOR DELETE USING (auth.uid()::text = "userId");

-- Dados de exemplo para testes (opcional)
-- Comentado para evitar erros se as tabelas não existirem ainda
/*
INSERT INTO reviews ("productId", "userId", rating, title, comment, "isVerified") 
SELECT 
  p.id,
  (SELECT id FROM users LIMIT 1),
  (RANDOM() * 4 + 1)::INTEGER,
  'Ótimo produto!',
  'Produto de excelente qualidade, recomendo!',
  true
FROM products p 
LIMIT 3
ON CONFLICT ("userId", "productId") DO NOTHING;

INSERT INTO reviews ("storeId", "userId", rating, title, comment, "isVerified") 
SELECT 
  s.id,
  (SELECT id FROM users LIMIT 1),
  (RANDOM() * 4 + 1)::INTEGER,
  'Loja confiável',
  'Ótimo atendimento e produtos de qualidade.',
  true
FROM stores s 
LIMIT 2
ON CONFLICT ("userId", "storeId") DO NOTHING;
*/