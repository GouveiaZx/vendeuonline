-- Chat tables for WhatsApp integration
-- Requires pg crypto extension for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- chat_sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- waiting | active | closed
  priority TEXT NOT NULL DEFAULT 'medium', -- low | medium | high
  category TEXT,
  tags JSONB NOT NULL DEFAULT '[]',
  assigned_agent_id TEXT,
  store_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_customer_phone ON chat_sessions (customer_phone);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions (status);

-- chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer','agent','system')),
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent', -- sent | delivered | read | failed
  metadata JSONB,
  whatsapp_message_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages (session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages (timestamp);