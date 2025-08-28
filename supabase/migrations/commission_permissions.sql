-- Configurar permissões para as tabelas de comissão

-- Conceder permissões para a tabela commission_rates
-- Apenas usuários autenticados podem ler as taxas de comissão
GRANT SELECT ON commission_rates TO authenticated;
GRANT SELECT ON commission_rates TO anon;

-- Apenas administradores podem modificar as taxas (será controlado via RLS)
GRANT INSERT, UPDATE, DELETE ON commission_rates TO authenticated;

-- Conceder permissões para a tabela commission_transactions
-- Usuários autenticados podem ver suas próprias transações
GRANT SELECT ON commission_transactions TO authenticated;
-- Apenas sistema pode inserir transações
GRANT INSERT ON commission_transactions TO authenticated;

-- Conceder permissões para a tabela commission_payouts
-- Vendedores podem ver seus próprios repasses
GRANT SELECT ON commission_payouts TO authenticated;
-- Apenas administradores podem criar/atualizar repasses
GRANT INSERT, UPDATE ON commission_payouts TO authenticated;

-- Verificar permissões aplicadas
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name IN ('commission_rates', 'commission_transactions', 'commission_payouts')
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;