-- Migration para sistema de autenticação baseado em roles
-- Criada em: 2024-01-XX
-- Descrição: Estrutura completa para autenticação com ADMIN, SELLER, BUYER

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum para tipos de usuário
DO $$ BEGIN
    CREATE TYPE user_type AS ENUM ('ADMIN', 'SELLER', 'BUYER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para tipos de eventos de segurança
DO $$ BEGIN
    CREATE TYPE security_event_type AS ENUM (
        'ADMIN_LOGIN', 
        'ADMIN_REGISTER', 
        'PASSWORD_RESET_REQUEST', 
        'PASSWORD_RESET_SUCCESS',
        'PROFILE_UPDATE',
        'FAILED_LOGIN_ATTEMPT',
        'ACCOUNT_LOCKED',
        'SUSPICIOUS_ACTIVITY'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela principal de usuários (atualizada)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    type user_type NOT NULL DEFAULT 'BUYER',
    city VARCHAR(100),
    state VARCHAR(50),
    avatar TEXT,
    is_verified BOOLEAN DEFAULT false,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela específica para administradores
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    security_question TEXT,
    security_answer TEXT,
    permissions TEXT[] DEFAULT ARRAY['MANAGE_USERS', 'MANAGE_PRODUCTS', 'VIEW_ANALYTICS'],
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela específica para vendedores (atualizada)
CREATE TABLE IF NOT EXISTS sellers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_name VARCHAR(255) NOT NULL,
    store_description TEXT,
    store_slug VARCHAR(255) UNIQUE NOT NULL,
    address TEXT,
    zip_code VARCHAR(20),
    category VARCHAR(100) DEFAULT 'Geral',
    plan VARCHAR(50) DEFAULT 'GRATUITO',
    is_active BOOLEAN DEFAULT true,
    rating DECIMAL(3,2) DEFAULT 5.0,
    total_sales INTEGER DEFAULT 0,
    commission DECIMAL(5,2) DEFAULT 10.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela específica para compradores (atualizada)
CREATE TABLE IF NOT EXISTS buyers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferences JSONB DEFAULT '{"notifications": true, "emailUpdates": false, "theme": "light"}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para eventos de segurança
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type security_event_type NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para tokens de reset de senha
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id) -- Um usuário só pode ter um token ativo por vez
);

-- Tabela para sessões de usuário (opcional, para controle de sessões)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);

CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_sellers_store_slug ON sellers(store_slug);
CREATE INDEX IF NOT EXISTS idx_sellers_is_active ON sellers(is_active);

CREATE INDEX IF NOT EXISTS idx_buyers_user_id ON buyers(user_id);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas relevantes
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON admins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sellers_updated_at ON sellers;
CREATE TRIGGER update_sellers_updated_at 
    BEFORE UPDATE ON sellers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_buyers_updated_at ON buyers;
CREATE TRIGGER update_buyers_updated_at 
    BEFORE UPDATE ON buyers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar tokens expirados (executar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- Remover tokens de reset expirados
    DELETE FROM password_reset_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Desativar sessões expiradas
    UPDATE user_sessions 
    SET is_active = false, ended_at = CURRENT_TIMESTAMP 
    WHERE expires_at < CURRENT_TIMESTAMP AND is_active = true;
    
    -- Remover eventos de segurança antigos (mais de 1 ano)
    DELETE FROM security_events 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policies para users
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Policies para admins (apenas admins podem ver)
CREATE POLICY "Only admins can view admin data" ON admins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.type = 'ADMIN'
        )
    );

-- Policies para sellers
CREATE POLICY "Sellers can view their own data" ON sellers
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Sellers can update their own data" ON sellers
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Policies para buyers
CREATE POLICY "Buyers can view their own data" ON buyers
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Buyers can update their own data" ON buyers
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Policies para security_events (apenas admins)
CREATE POLICY "Only admins can view security events" ON security_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.type = 'ADMIN'
        )
    );

-- Policies para password_reset_tokens (uso interno apenas)
CREATE POLICY "No direct access to reset tokens" ON password_reset_tokens
    FOR ALL USING (false);

-- Policies para user_sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Comentários nas tabelas
COMMENT ON TABLE users IS 'Tabela principal de usuários com diferentes tipos (roles)';
COMMENT ON TABLE admins IS 'Dados específicos de administradores com permissões e segurança';
COMMENT ON TABLE sellers IS 'Dados específicos de vendedores e suas lojas';
COMMENT ON TABLE buyers IS 'Dados específicos de compradores e preferências';
COMMENT ON TABLE security_events IS 'Log de eventos de segurança do sistema';
COMMENT ON TABLE password_reset_tokens IS 'Tokens para recuperação de senha com expiração';
COMMENT ON TABLE user_sessions IS 'Controle de sessões ativas de usuários';

-- Inserir dados de exemplo (apenas para desenvolvimento)
-- ATENÇÃO: Remover em produção
INSERT INTO users (id, name, email, password, type, phone, city, state, is_verified) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Admin Sistema', 'admin@vendeuonline.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8.V6lm.4SjlEYr7Zw4m', 'ADMIN', '11999999999', 'São Paulo', 'SP', true),
('550e8400-e29b-41d4-a716-446655440001', 'João Vendedor', 'joao@vendedor.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8.V6lm.4SjlEYr7Zw4m', 'SELLER', '11888888888', 'Rio de Janeiro', 'RJ', true),
('550e8400-e29b-41d4-a716-446655440002', 'Maria Compradora', 'maria@comprador.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8.V6lm.4SjlEYr7Zw4m', 'BUYER', '11777777777', 'Belo Horizonte', 'MG', true)
ON CONFLICT (email) DO NOTHING;

-- Inserir perfis específicos
INSERT INTO admins (user_id, permissions, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440000', ARRAY['MANAGE_USERS', 'MANAGE_PRODUCTS', 'MANAGE_STORES', 'VIEW_ANALYTICS', 'MANAGE_SYSTEM', 'MANAGE_SECURITY'], true)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO sellers (user_id, store_name, store_description, store_slug, category) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Loja do João', 'A melhor loja de eletrônicos', 'loja-do-joao', 'Eletrônicos')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO buyers (user_id) VALUES
('550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (user_id) DO NOTHING;