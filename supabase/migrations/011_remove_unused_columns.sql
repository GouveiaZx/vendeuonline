-- Remove colunas não utilizadas da tabela Product
ALTER TABLE "Product" DROP COLUMN IF EXISTS "minStock";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "tags";

-- Remove coluna isMain da tabela ProductImage se existir
ALTER TABLE "ProductImage" DROP COLUMN IF EXISTS "isMain";