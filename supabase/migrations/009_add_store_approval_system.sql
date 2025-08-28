-- Migração para Sistema de Aprovação de Lojas
-- Adiciona campos de status, documentos e histórico de aprovação

-- Adicionar campos de aprovação à tabela stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended'));
ALTER TABLE stores ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}'::jsonb;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS last_status_change TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE stores ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Criar tabela para histórico de aprovações
CREATE TABLE IF NOT EXISTS store_approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  previous_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela para documentos obrigatórios
CREATE TABLE IF NOT EXISTS required_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  file_types TEXT[] DEFAULT ARRAY['pdf', 'jpg', 'jpeg', 'png'],
  max_file_size INTEGER DEFAULT 5242880, -- 5MB em bytes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir documentos obrigatórios padrão
INSERT INTO required_documents (document_type, display_name, description) VALUES
('cnpj', 'CNPJ da Empresa', 'Comprovante de inscrição no CNPJ'),
('contract', 'Contrato Social', 'Contrato social da empresa ou MEI'),
('address_proof', 'Comprovante de Endereço', 'Comprovante de endereço da empresa'),
('id_document', 'Documento de Identidade', 'RG ou CNH do responsável legal'),
('bank_account', 'Dados Bancários', 'Comprovante de conta bancária da empresa')
ON CONFLICT (document_type) DO NOTHING;

-- Criar tabela para notificações de status
CREATE TABLE IF NOT EXISTS store_status_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para registrar mudanças de status
CREATE OR REPLACE FUNCTION log_store_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar no histórico se o status mudou
  IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
    INSERT INTO store_approval_history (
      store_id,
      previous_status,
      new_status,
      changed_by,
      reason,
      notes
    ) VALUES (
      NEW.id,
      OLD.approval_status,
      NEW.approval_status,
      NEW.approved_by,
      NEW.rejection_reason,
      NEW.verification_notes
    );
    
    -- Atualizar timestamp da última mudança
    NEW.last_status_change = NOW();
    
    -- Criar notificação para o dono da loja
    INSERT INTO store_status_notifications (
      store_id,
      user_id,
      notification_type,
      title,
      message
    ) VALUES (
      NEW.id,
      NEW.owner_id,
      CASE NEW.approval_status
        WHEN 'approved' THEN 'store_approved'
        WHEN 'rejected' THEN 'store_rejected'
        WHEN 'suspended' THEN 'store_suspended'
        ELSE 'store_status_changed'
      END,
      CASE NEW.approval_status
        WHEN 'approved' THEN 'Loja Aprovada!'
        WHEN 'rejected' THEN 'Loja Rejeitada'
        WHEN 'suspended' THEN 'Loja Suspensa'
        ELSE 'Status da Loja Alterado'
      END,
      CASE NEW.approval_status
        WHEN 'approved' THEN 'Parabéns! Sua loja foi aprovada e já está disponível na plataforma.'
        WHEN 'rejected' THEN COALESCE('Sua loja foi rejeitada. Motivo: ' || NEW.rejection_reason, 'Sua loja foi rejeitada. Entre em contato para mais informações.')
        WHEN 'suspended' THEN COALESCE('Sua loja foi suspensa. Motivo: ' || NEW.rejection_reason, 'Sua loja foi suspensa. Entre em contato para mais informações.')
        ELSE 'O status da sua loja foi alterado.'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para mudanças de status
DROP TRIGGER IF EXISTS trigger_store_status_change ON stores;
CREATE TRIGGER trigger_store_status_change
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION log_store_status_change();

-- Função para verificar documentos obrigatórios
CREATE OR REPLACE FUNCTION check_required_documents(store_documents JSONB)
RETURNS TABLE(
  document_type VARCHAR(50),
  display_name VARCHAR(100),
  is_provided BOOLEAN,
  is_required BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rd.document_type,
    rd.display_name,
    (store_documents ? rd.document_type) as is_provided,
    rd.is_required
  FROM required_documents rd
  WHERE rd.is_required = true
  ORDER BY rd.display_name;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular score de completude dos documentos
CREATE OR REPLACE FUNCTION calculate_document_completeness(store_documents JSONB)
RETURNS NUMERIC AS $$
DECLARE
  total_required INTEGER;
  provided_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_required
  FROM required_documents
  WHERE is_required = true;
  
  SELECT COUNT(*) INTO provided_count
  FROM required_documents rd
  WHERE rd.is_required = true
    AND store_documents ? rd.document_type;
  
  IF total_required = 0 THEN
    RETURN 100;
  END IF;
  
  RETURN ROUND((provided_count::NUMERIC / total_required::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Atualizar lojas existentes para status 'approved' se não tiverem status
UPDATE stores 
SET approval_status = 'approved', 
    approved_at = "createdAt",
    last_status_change = "createdAt"
WHERE approval_status IS NULL;

-- Políticas de segurança para store_approval_history
ALTER TABLE store_approval_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all approval history" ON store_approval_history
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Store owners can view their approval history" ON store_approval_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores s 
      WHERE s.id = store_approval_history.store_id 
        AND s.owner_id = auth.uid()
    )
  );

-- Políticas de segurança para required_documents
ALTER TABLE required_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view required documents" ON required_documents
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify required documents" ON required_documents
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas de segurança para store_status_notifications
ALTER TABLE store_status_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON store_status_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON store_status_notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON store_status_notifications
  FOR INSERT WITH CHECK (true);

-- Conceder permissões
GRANT SELECT ON store_approval_history TO anon, authenticated;
GRANT SELECT ON required_documents TO anon, authenticated;
GRANT SELECT, UPDATE ON store_status_notifications TO authenticated;
GRANT ALL PRIVILEGES ON store_approval_history TO authenticated;
GRANT ALL PRIVILEGES ON required_documents TO authenticated;
GRANT ALL PRIVILEGES ON store_status_notifications TO authenticated;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_stores_approval_status ON stores(approval_status);
CREATE INDEX IF NOT EXISTS idx_stores_last_status_change ON stores(last_status_change);
CREATE INDEX IF NOT EXISTS idx_store_approval_history_store_id ON store_approval_history(store_id);
CREATE INDEX IF NOT EXISTS idx_store_approval_history_created_at ON store_approval_history(created_at);
CREATE INDEX IF NOT EXISTS idx_store_status_notifications_user_id ON store_status_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_store_status_notifications_is_read ON store_status_notifications(is_read);