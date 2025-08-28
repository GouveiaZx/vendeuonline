-- Conceder permissões para as tabelas criadas

-- Permissões para anon (usuários não autenticados)
GRANT SELECT ON users TO anon;
GRANT SELECT ON buyers TO anon;
GRANT SELECT ON sellers TO anon;
GRANT SELECT ON admins TO anon;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON stores TO anon;
GRANT SELECT ON "Plan" TO anon;

-- Permissões para authenticated (usuários autenticados)
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON buyers TO authenticated;
GRANT ALL PRIVILEGES ON sellers TO authenticated;
GRANT ALL PRIVILEGES ON admins TO authenticated;
GRANT ALL PRIVILEGES ON categories TO authenticated;
GRANT ALL PRIVILEGES ON stores TO authenticated;
GRANT ALL PRIVILEGES ON "Plan" TO authenticated;-- Permissões para sequences (se houver)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;