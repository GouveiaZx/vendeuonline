-- Criar tabela de planos se não existir
CREATE TABLE IF NOT EXISTS "Plan" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    "billingPeriod" TEXT NOT NULL DEFAULT 'MONTHLY',
    "maxAds" INTEGER NOT NULL DEFAULT 1,
    "maxPhotosPerAd" INTEGER NOT NULL DEFAULT 5,
    "maxHighlightsPerDay" INTEGER NOT NULL DEFAULT 0,
    "supportLevel" TEXT NOT NULL DEFAULT 'EMAIL',
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Limpar dados existentes
DELETE FROM "Plan";

-- Inserir planos padrão
INSERT INTO "Plan" (name, slug, description, price, "billingPeriod", "maxAds", "maxPhotosPerAd", "maxHighlightsPerDay", "supportLevel", features, "isActive", "order") VALUES
('Gratuito', 'gratuito', 'Para usuários iniciantes', 0, 'LIFETIME', 1, 5, 0, 'EMAIL', 
 '["1 anúncio a cada 60 dias", "Duração de 30 dias", "Até 5 fotos por anúncio", "Anúncio extra por R$ 4,90", "Destaque extra por R$ 9,90 cada", "Suporte por email", "Compartilhamento em redes sociais", "Estatísticas básicas", "Verificação do perfil", "Atendimento prioritário"]'::jsonb, 
 true, 1),

('Micro-Empresa', 'micro-empresa', 'Para microempreendedores', 24.90, 'MONTHLY', 2, 6, 1, 'EMAIL', 
 '["2 anúncios simultâneos", "Duração de 30 dias", "Até 6 fotos por anúncio", "1 destaque por dia", "Anúncio extra por R$ 14,90", "Destaque extra por R$ 4,90", "Estatísticas básicas", "Suporte por email", "Verificação do perfil", "Atendimento prioritário"]'::jsonb, 
 true, 2),

('Pequena Empresa', 'pequena-empresa', 'Para pequenos negócios', 49.90, 'MONTHLY', 5, 10, 4, 'CHAT', 
 '["5 anúncios simultâneos", "Duração de 30 dias", "Até 10 fotos por anúncio", "4 destaques por dia", "Anúncio extra por R$ 14,90", "Destaque extra por R$ 4,90", "Estatísticas detalhadas", "Atendimento prioritário", "Verificação do perfil", "Logo na página de anúncios"]'::jsonb, 
 true, 3),

('Empresa Simples', 'empresa-simples', 'Para empresas em crescimento', 99.90, 'MONTHLY', 10, 15, 4, 'CHAT', 
 '["10 anúncios simultâneos", "Duração de 30 dias", "Até 15 fotos por anúncio", "4 destaques por dia", "Anúncio extra por R$ 14,90", "Destaque extra por R$ 4,90", "Estatísticas avançadas", "Atendimento prioritário", "Verificação do perfil", "Perfil de loja personalizado"]'::jsonb, 
 true, 4),

('Empresa Plus', 'empresa-plus', 'Para grandes negócios', 149.90, 'MONTHLY', 20, 20, 8, 'PRIORITY', 
 '["20 anúncios simultâneos", "Duração de 30 dias", "Até 20 fotos por anúncio", "8 destaques por dia", "Anúncio extra por R$ 14,90", "Destaque extra por R$ 4,90", "Estatísticas premium", "Suporte dedicado", "Verificação do perfil", "Perfil de loja personalizado"]'::jsonb, 
 true, 5);

-- Conceder permissões
GRANT SELECT ON "Plan" TO anon;
GRANT ALL PRIVILEGES ON "Plan" TO authenticated;