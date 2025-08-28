-- Verificar permissões aplicadas nas tabelas de comissão
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name IN ('commission_rates', 'commission_transactions', 'commission_payouts')
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee, privilege_type;