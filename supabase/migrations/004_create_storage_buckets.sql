-- Criar buckets de storage para o sistema de upload de imagens
-- Nota: As políticas RLS serão configuradas manualmente no painel do Supabase

-- Bucket para imagens de produtos
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket para imagens de lojas (logos e banners)
INSERT INTO storage.buckets (id, name, public)
VALUES ('stores', 'stores', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket para avatars de usuários
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket para banners administrativos
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;