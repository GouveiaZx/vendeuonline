-- Migração para sistema de comissões
-- Cria tabelas para configuração de taxas e controle de comissões

-- Tabela para configuração de taxas de comissão por categoria
CREATE TABLE IF NOT EXISTS commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "categoryId" TEXT NOT NULL,
  "commissionType" TEXT NOT NULL CHECK ("commissionType" IN ('percentage', 'fixed')),
  "commissionValue" DECIMAL(10,4) NOT NULL CHECK ("commissionValue" >= 0),
  "minAmount" DECIMAL(10,2) DEFAULT 0,
  "maxAmount" DECIMAL(10,2),
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_category_commission UNIQUE ("categoryId")
);

-- Tabela para transações de comissão
CREATE TABLE IF NOT EXISTS commission_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" TEXT NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  "storeId" TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  "categoryId" TEXT NOT NULL,
  "orderAmount" DECIMAL(10,2) NOT NULL,
  "commissionRate" DECIMAL(10,4) NOT NULL,
  "commissionAmount" DECIMAL(10,2) NOT NULL,
  "commissionType" TEXT NOT NULL CHECK ("commissionType" IN ('percentage', 'fixed')),
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'calculated', 'paid', 'cancelled')),
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_order_commission UNIQUE ("orderId")
);

-- Tabela para histórico de repasses
CREATE TABLE IF NOT EXISTS commission_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "storeId" TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  "period" TEXT NOT NULL, -- formato: YYYY-MM
  "totalCommission" DECIMAL(10,2) NOT NULL,
  "totalPayout" DECIMAL(10,2) NOT NULL,
  "transactionCount" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'processing', 'completed', 'failed')),
  "processedAt" TIMESTAMP(3),
  "processedBy" TEXT,
  "paymentMethod" TEXT,
  "paymentReference" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_store_period UNIQUE ("storeId", "period")
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_commission_rates_category ON commission_rates("categoryId");
CREATE INDEX IF NOT EXISTS idx_commission_rates_active ON commission_rates("isActive");
CREATE INDEX IF NOT EXISTS idx_commission_transactions_order ON commission_transactions("orderId");
CREATE INDEX IF NOT EXISTS idx_commission_transactions_store ON commission_transactions("storeId");
CREATE INDEX IF NOT EXISTS idx_commission_transactions_status ON commission_transactions("status");
CREATE INDEX IF NOT EXISTS idx_commission_transactions_created ON commission_transactions("createdAt");
CREATE INDEX IF NOT EXISTS idx_commission_payouts_store ON commission_payouts("storeId");
CREATE INDEX IF NOT EXISTS idx_commission_payouts_period ON commission_payouts("period");
CREATE INDEX IF NOT EXISTS idx_commission_payouts_status ON commission_payouts("status");

-- Trigger para atualizar updatedAt
CREATE TRIGGER update_commission_rates_updated_at
  BEFORE UPDATE ON commission_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commission_transactions_updated_at
  BEFORE UPDATE ON commission_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commission_payouts_updated_at
  BEFORE UPDATE ON commission_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular comissão
CREATE OR REPLACE FUNCTION calculate_commission(
  p_category_id TEXT,
  p_order_amount DECIMAL(10,2)
) RETURNS TABLE(
  commission_type TEXT,
  commission_rate DECIMAL(10,4),
  commission_amount DECIMAL(10,2)
) AS $$
DECLARE
  v_rate RECORD;
BEGIN
  -- Buscar taxa de comissão para a categoria
  SELECT 
    "commissionType",
    "commissionValue",
    "minAmount",
    "maxAmount"
  INTO v_rate
  FROM commission_rates
  WHERE "categoryId" = p_category_id
    AND "isActive" = TRUE;
  
  -- Se não encontrar taxa específica, usar taxa padrão (categoria 'default')
  IF NOT FOUND THEN
    SELECT 
      "commissionType",
      "commissionValue",
      "minAmount",
      "maxAmount"
    INTO v_rate
    FROM commission_rates
    WHERE "categoryId" = 'default'
      AND "isActive" = TRUE;
  END IF;
  
  -- Se ainda não encontrar, retornar 0
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'percentage'::TEXT, 0::DECIMAL(10,4), 0::DECIMAL(10,2);
    RETURN;
  END IF;
  
  -- Verificar limites mínimo e máximo
  IF v_rate."minAmount" IS NOT NULL AND p_order_amount < v_rate."minAmount" THEN
    RETURN QUERY SELECT v_rate."commissionType", 0::DECIMAL(10,4), 0::DECIMAL(10,2);
    RETURN;
  END IF;
  
  IF v_rate."maxAmount" IS NOT NULL AND p_order_amount > v_rate."maxAmount" THEN
    -- Aplicar comissão apenas no valor máximo
    IF v_rate."commissionType" = 'percentage' THEN
      RETURN QUERY SELECT 
        v_rate."commissionType",
        v_rate."commissionValue",
        ROUND((v_rate."maxAmount" * v_rate."commissionValue" / 100), 2);
    ELSE
      RETURN QUERY SELECT 
        v_rate."commissionType",
        v_rate."commissionValue",
        v_rate."commissionValue";
    END IF;
    RETURN;
  END IF;
  
  -- Calcular comissão normal
  IF v_rate."commissionType" = 'percentage' THEN
    RETURN QUERY SELECT 
      v_rate."commissionType",
      v_rate."commissionValue",
      ROUND((p_order_amount * v_rate."commissionValue" / 100), 2);
  ELSE
    RETURN QUERY SELECT 
      v_rate."commissionType",
      v_rate."commissionValue",
      v_rate."commissionValue";
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para criar transação de comissão automaticamente
CREATE OR REPLACE FUNCTION create_commission_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_commission RECORD;
  v_product RECORD;
BEGIN
  -- Só processar se o pedido foi confirmado/pago
  IF NEW.status IN ('confirmed', 'paid', 'processing') AND 
     (OLD.status IS NULL OR OLD.status NOT IN ('confirmed', 'paid', 'processing')) THEN
    
    -- Buscar informações do produto para obter categoria
    SELECT p."categoryId", NEW."storeId" as store_id
    INTO v_product
    FROM "OrderItem" oi
    JOIN "Product" p ON p.id = oi."productId"
    WHERE oi."orderId" = NEW.id
    LIMIT 1;
    
    IF FOUND THEN
      -- Calcular comissão
      SELECT * INTO v_commission
      FROM calculate_commission(v_product."categoryId", NEW.total);
      
      -- Criar transação de comissão
      INSERT INTO commission_transactions (
        "orderId",
        "storeId",
        "categoryId",
        "orderAmount",
        "commissionRate",
        "commissionAmount",
        "commissionType",
        "status"
      ) VALUES (
        NEW.id,
        v_product.store_id,
        v_product."categoryId",
        NEW.total,
        v_commission.commission_rate,
        v_commission.commission_amount,
        v_commission.commission_type,
        'calculated'
      ) ON CONFLICT ("orderId") DO UPDATE SET
        "commissionAmount" = EXCLUDED."commissionAmount",
        "commissionRate" = EXCLUDED."commissionRate",
        "commissionType" = EXCLUDED."commissionType",
        "status" = 'calculated',
        "updatedAt" = CURRENT_TIMESTAMP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar comissão automaticamente
CREATE TRIGGER create_commission_on_order_update
  AFTER UPDATE ON "Order"
  FOR EACH ROW
  EXECUTE FUNCTION create_commission_transaction();

-- View para estatísticas de comissão por loja
CREATE OR REPLACE VIEW store_commission_stats AS
SELECT 
  s.id as store_id,
  s.name as store_name,
  COUNT(ct.id) as total_transactions,
  SUM(ct."orderAmount") as total_order_amount,
  SUM(ct."commissionAmount") as total_commission,
  AVG(ct."commissionRate") as avg_commission_rate,
  SUM(CASE WHEN ct.status = 'paid' THEN ct."commissionAmount" ELSE 0 END) as paid_commission,
  SUM(CASE WHEN ct.status = 'pending' THEN ct."commissionAmount" ELSE 0 END) as pending_commission,
  MAX(ct."createdAt") as last_transaction_date
FROM stores s
LEFT JOIN commission_transactions ct ON ct."storeId" = s.id
GROUP BY s.id, s.name;

-- View para estatísticas de comissão por categoria
CREATE OR REPLACE VIEW category_commission_stats AS
SELECT 
  cr."categoryId" as category_id,
  cr."categoryId" as category_name,
  cr."commissionType",
  cr."commissionValue",
  COUNT(ct.id) as total_transactions,
  SUM(ct."orderAmount") as total_order_amount,
  SUM(ct."commissionAmount") as total_commission,
  AVG(ct."commissionAmount") as avg_commission_per_order
FROM commission_rates cr
LEFT JOIN commission_transactions ct ON ct."categoryId" = cr."categoryId"
WHERE cr."isActive" = TRUE
GROUP BY cr."categoryId", cr."commissionType", cr."commissionValue";

-- Políticas de segurança (RLS)
ALTER TABLE commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payouts ENABLE ROW LEVEL SECURITY;

-- Políticas para commission_rates (apenas admins)
CREATE POLICY "Only admins can manage commission rates" ON commission_rates
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para commission_transactions
CREATE POLICY "Users can view their store commission transactions" ON commission_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores s 
      WHERE s.id = commission_transactions."storeId" 
        AND s."sellerId" = auth.uid()::text
    )
  );

CREATE POLICY "System can manage commission transactions" ON commission_transactions
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para commission_payouts
CREATE POLICY "Users can view their store payouts" ON commission_payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores s 
      WHERE s.id = commission_payouts."storeId" 
        AND s."sellerId" = auth.uid()::text
    )
  );

CREATE POLICY "System can manage payouts" ON commission_payouts
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Inserir taxas padrão
INSERT INTO commission_rates ("categoryId", "commissionType", "commissionValue", "createdBy")
VALUES 
  ('default', 'percentage', 5.0, 'system')
ON CONFLICT ("categoryId") DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE commission_rates IS 'Configuração de taxas de comissão por categoria';
COMMENT ON TABLE commission_transactions IS 'Transações de comissão geradas automaticamente';
COMMENT ON TABLE commission_payouts IS 'Histórico de repasses de comissão para vendedores';
COMMENT ON FUNCTION calculate_commission IS 'Calcula comissão baseada na categoria e valor do pedido';
COMMENT ON VIEW store_commission_stats IS 'Estatísticas de comissão por loja';
COMMENT ON VIEW category_commission_stats IS 'Estatísticas de comissão por categoria';