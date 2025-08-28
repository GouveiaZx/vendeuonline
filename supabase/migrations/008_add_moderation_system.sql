-- Migração para sistema de moderação de reviews
-- Adiciona campos e funcionalidades para moderação básica

-- Adicionar campos de moderação à tabela reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS "moderatedBy" TEXT REFERENCES users(id);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS "moderatedAt" TIMESTAMP(3);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS "moderationReason" TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS "reportCount" INTEGER DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS "isSpam" BOOLEAN DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS "isInappropriate" BOOLEAN DEFAULT FALSE;

-- Atualizar constraint de status para incluir novos estados
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_status_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_status_check 
  CHECK (status IN ('active', 'hidden', 'pending_moderation', 'rejected', 'approved'));

-- Tabela para reports de reviews
CREATE TABLE IF NOT EXISTS review_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "reviewId" TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  "reportedBy" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "reportType" VARCHAR(50) NOT NULL CHECK ("reportType" IN (
    'spam', 'inappropriate', 'fake', 'offensive', 'irrelevant', 'other'
  )),
  "reportReason" TEXT,
  "reportDetails" TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  "reviewedBy" TEXT REFERENCES users(id),
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_user_review_report UNIQUE ("reportedBy", "reviewId")
);

-- Tabela para palavras banidas/filtros de conteúdo
CREATE TABLE IF NOT EXISTS moderation_filters (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "filterType" VARCHAR(20) NOT NULL CHECK ("filterType" IN ('banned_word', 'spam_pattern', 'inappropriate_pattern')),
  pattern TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdBy" TEXT REFERENCES users(id),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_reviews_moderated_by ON reviews("moderatedBy");
CREATE INDEX IF NOT EXISTS idx_reviews_report_count ON reviews("reportCount");
CREATE INDEX IF NOT EXISTS idx_reviews_is_spam ON reviews("isSpam");
CREATE INDEX IF NOT EXISTS idx_reviews_is_inappropriate ON reviews("isInappropriate");

CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON review_reports("reviewId");
CREATE INDEX IF NOT EXISTS idx_review_reports_reported_by ON review_reports("reportedBy");
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status);
CREATE INDEX IF NOT EXISTS idx_review_reports_type ON review_reports("reportType");

CREATE INDEX IF NOT EXISTS idx_moderation_filters_type ON moderation_filters("filterType");
CREATE INDEX IF NOT EXISTS idx_moderation_filters_active ON moderation_filters("isActive");

-- Trigger para atualizar updatedAt em moderation_filters
CREATE TRIGGER update_moderation_filters_updated_at
  BEFORE UPDATE ON moderation_filters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para auto-moderação básica
CREATE OR REPLACE FUNCTION auto_moderate_review()
RETURNS TRIGGER AS $$
DECLARE
  banned_word_count INTEGER := 0;
  spam_pattern_count INTEGER := 0;
BEGIN
  -- Verificar palavras banidas no título e comentário
  SELECT COUNT(*) INTO banned_word_count
  FROM moderation_filters
  WHERE "filterType" = 'banned_word' 
    AND "isActive" = TRUE
    AND (LOWER(NEW.title) LIKE '%' || LOWER(pattern) || '%' 
         OR LOWER(NEW.comment) LIKE '%' || LOWER(pattern) || '%');
  
  -- Verificar padrões de spam
  SELECT COUNT(*) INTO spam_pattern_count
  FROM moderation_filters
  WHERE "filterType" = 'spam_pattern' 
    AND "isActive" = TRUE
    AND (NEW.title ~* pattern OR NEW.comment ~* pattern);
  
  -- Marcar como spam se encontrar palavras banidas ou padrões suspeitos
  IF banned_word_count > 0 OR spam_pattern_count > 0 THEN
    NEW."isSpam" := TRUE;
    NEW.status := 'pending_moderation';
  END IF;
  
  -- Verificar se é um review muito curto (possível spam)
  IF LENGTH(NEW.comment) < 10 THEN
    NEW.status := 'pending_moderation';
  END IF;
  
  -- Verificar se o usuário já fez muitos reviews hoje (possível spam)
  IF (SELECT COUNT(*) FROM reviews 
      WHERE "userId" = NEW."userId" 
        AND DATE("createdAt") = CURRENT_DATE) > 10 THEN
    NEW."isSpam" := TRUE;
    NEW.status := 'pending_moderation';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-moderação
CREATE TRIGGER auto_moderate_review_trigger
  BEFORE INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION auto_moderate_review();

-- Função para atualizar contador de reports
CREATE OR REPLACE FUNCTION update_review_report_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reviews 
    SET "reportCount" = "reportCount" + 1
    WHERE id = NEW."reviewId";
    
    -- Auto-moderar se receber muitos reports
    UPDATE reviews 
    SET status = 'pending_moderation'
    WHERE id = NEW."reviewId" AND "reportCount" >= 3;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reviews 
    SET "reportCount" = GREATEST("reportCount" - 1, 0)
    WHERE id = OLD."reviewId";
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador de reports
CREATE TRIGGER update_review_report_count_trigger
  AFTER INSERT OR DELETE ON review_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_review_report_count();

-- Habilitar RLS nas novas tabelas
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_filters ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para review_reports
CREATE POLICY "Users can create review reports" ON review_reports
  FOR INSERT WITH CHECK (auth.uid()::text = "reportedBy");

CREATE POLICY "Users can view their own reports" ON review_reports
  FOR SELECT USING (auth.uid()::text = "reportedBy");

-- Políticas de segurança para moderation_filters (apenas usuários autenticados)
CREATE POLICY "Authenticated users can view moderation filters" ON moderation_filters
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only specific users can manage moderation filters" ON moderation_filters
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only creators can update moderation filters" ON moderation_filters
  FOR UPDATE USING (auth.uid()::text = "createdBy");

CREATE POLICY "Only creators can delete moderation filters" ON moderation_filters
  FOR DELETE USING (auth.uid()::text = "createdBy");

-- Inserir alguns filtros básicos de moderação
INSERT INTO moderation_filters ("filterType", pattern) VALUES
  ('banned_word', 'spam'),
  ('banned_word', 'fake'),
  ('banned_word', 'scam'),
  ('spam_pattern', '(.)\\1{4,}'), -- Caracteres repetidos
  ('spam_pattern', '\\b(compre|comprar|clique|click)\\b.*\\b(aqui|here|agora|now)\\b')
ON CONFLICT DO NOTHING;

-- View para estatísticas de moderação
CREATE OR REPLACE VIEW moderation_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'pending_moderation') as pending_reviews,
  COUNT(*) FILTER (WHERE "isSpam" = TRUE) as spam_reviews,
  COUNT(*) FILTER (WHERE "isInappropriate" = TRUE) as inappropriate_reviews,
  COUNT(*) FILTER (WHERE "reportCount" > 0) as reported_reviews,
  COUNT(*) FILTER (WHERE "reportCount" >= 3) as heavily_reported_reviews,
  AVG("reportCount") as avg_report_count
FROM reviews;

-- Comentários para documentação
COMMENT ON TABLE review_reports IS 'Tabela para armazenar reports de reviews feitos pelos usuários';
COMMENT ON TABLE moderation_filters IS 'Tabela para armazenar filtros de moderação automática';
COMMENT ON COLUMN reviews."moderatedBy" IS 'ID do moderador que revisou o review';
COMMENT ON COLUMN reviews."moderatedAt" IS 'Data e hora da moderação';
COMMENT ON COLUMN reviews."moderationReason" IS 'Razão da ação de moderação';
COMMENT ON COLUMN reviews."reportCount" IS 'Número de reports recebidos pelo review';
COMMENT ON COLUMN reviews."isSpam" IS 'Indica se o review foi identificado como spam';
COMMENT ON COLUMN reviews."isInappropriate" IS 'Indica se o review foi identificado como inapropriado';