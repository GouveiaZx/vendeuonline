-- Criar tabela para eventos de analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_timestamp ON analytics_events(type, timestamp);

-- Índice composto para consultas de analytics por usuário e período
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_period ON analytics_events(user_id, timestamp) WHERE user_id IS NOT NULL;

-- Índice para dados JSONB (para consultas específicas nos dados do evento)
CREATE INDEX IF NOT EXISTS idx_analytics_events_data_gin ON analytics_events USING GIN(data);

-- Política RLS para analytics_events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de eventos (qualquer usuário pode registrar eventos)
CREATE POLICY "Permitir inserção de eventos de analytics" ON analytics_events
  FOR INSERT
  WITH CHECK (true);

-- Política para admins podem ler todos os eventos
CREATE POLICY "Admins podem ler todos os eventos" ON analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text 
      AND users.type = 'ADMIN'
    )
  );

-- Política para usuários lerem apenas seus próprios eventos
CREATE POLICY "Usuários podem ler seus próprios eventos" ON analytics_events
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Conceder permissões básicas
GRANT SELECT, INSERT ON analytics_events TO anon;
GRANT ALL PRIVILEGES ON analytics_events TO authenticated;

-- Criar função para limpeza automática de eventos antigos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_events()
RETURNS void AS $$
BEGIN
  -- Deletar eventos com mais de 2 anos
  DELETE FROM analytics_events 
  WHERE timestamp < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE analytics_events IS 'Tabela para armazenar eventos de analytics e tracking de usuários';
COMMENT ON COLUMN analytics_events.type IS 'Tipo do evento (page_view, view_item, add_to_cart, etc.)';
COMMENT ON COLUMN analytics_events.data IS 'Dados específicos do evento em formato JSON';
COMMENT ON COLUMN analytics_events.user_id IS 'ID do usuário (opcional, pode ser null para usuários anônimos)';
COMMENT ON COLUMN analytics_events.session_id IS 'ID da sessão do usuário';
COMMENT ON COLUMN analytics_events.user_agent IS 'User agent do navegador';
COMMENT ON COLUMN analytics_events.ip IS 'Endereço IP do usuário';