-- Configurar permissões para as tabelas do sistema de comissões

-- Conceder permissões básicas (ignorar se já existirem)
DO $$ 
BEGIN
  -- Permissões para commission_rates
  GRANT SELECT ON commission_rates TO authenticated;
  GRANT ALL PRIVILEGES ON commission_rates TO service_role;
  
  -- Permissões para commission_transactions
  GRANT SELECT ON commission_transactions TO authenticated;
  GRANT ALL PRIVILEGES ON commission_transactions TO service_role;
  
  -- Permissões para commission_payouts
  GRANT SELECT ON commission_payouts TO authenticated;
  GRANT ALL PRIVILEGES ON commission_payouts TO service_role;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignorar erros de permissões já existentes
    NULL;
END $$;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Admin can manage commission rates" ON commission_rates;
DROP POLICY IF EXISTS "Admin can view all commission transactions" ON commission_transactions;
DROP POLICY IF EXISTS "Sellers can view own commission transactions" ON commission_transactions;
DROP POLICY IF EXISTS "System can manage commission transactions" ON commission_transactions;
DROP POLICY IF EXISTS "Admin can manage all commission payouts" ON commission_payouts;
DROP POLICY IF EXISTS "Sellers can view own commission payouts" ON commission_payouts;

-- Políticas RLS para commission_rates
-- Apenas administradores podem ver e gerenciar taxas de comissão
CREATE POLICY "Admin can manage commission rates" ON commission_rates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Políticas RLS para commission_transactions
-- Administradores podem ver todas as transações
CREATE POLICY "Admin can view all commission transactions" ON commission_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Vendedores podem ver apenas suas próprias transações
CREATE POLICY "Sellers can view own commission transactions" ON commission_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = commission_transactions."storeId" 
      AND stores."sellerId"::uuid = auth.uid()
    )
  );

-- Sistema pode inserir/atualizar transações automaticamente
CREATE POLICY "System can manage commission transactions" ON commission_transactions
  FOR ALL USING (
    auth.role() = 'service_role'
  );

-- Políticas RLS para commission_payouts
-- Administradores podem ver e gerenciar todos os repasses
CREATE POLICY "Admin can manage all commission payouts" ON commission_payouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Vendedores podem ver apenas seus próprios repasses
CREATE POLICY "Sellers can view own commission payouts" ON commission_payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = commission_payouts."storeId" 
      AND stores."sellerId"::uuid = auth.uid()
    )
  );

-- Criar índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_commission_transactions_store_id ON commission_transactions("storeId");
CREATE INDEX IF NOT EXISTS idx_commission_transactions_order_id ON commission_transactions("orderId");
CREATE INDEX IF NOT EXISTS idx_commission_transactions_status ON commission_transactions(status);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_created_at ON commission_transactions("createdAt");

CREATE INDEX IF NOT EXISTS idx_commission_payouts_store_id ON commission_payouts("storeId");
CREATE INDEX IF NOT EXISTS idx_commission_payouts_status ON commission_payouts(status);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_period ON commission_payouts(period);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_created_at ON commission_payouts("createdAt");

CREATE INDEX IF NOT EXISTS idx_commission_rates_category_id ON commission_rates("categoryId");
CREATE INDEX IF NOT EXISTS idx_commission_rates_active ON commission_rates("isActive");

-- Comentários para documentação
COMMENT ON POLICY "Admin can manage commission rates" ON commission_rates IS 'Permite que administradores gerenciem taxas de comissão';
COMMENT ON POLICY "Admin can view all commission transactions" ON commission_transactions IS 'Permite que administradores vejam todas as transações de comissão';
COMMENT ON POLICY "Sellers can view own commission transactions" ON commission_transactions IS 'Permite que vendedores vejam apenas suas próprias transações de comissão';
COMMENT ON POLICY "System can manage commission transactions" ON commission_transactions IS 'Permite que o sistema gerencie transações automaticamente';
COMMENT ON POLICY "Admin can manage all commission payouts" ON commission_payouts IS 'Permite que administradores gerenciem todos os repasses';
COMMENT ON POLICY "Sellers can view own commission payouts" ON commission_payouts IS 'Permite que vendedores vejam apenas seus próprios repasses';