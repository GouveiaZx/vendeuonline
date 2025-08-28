-- Adicionar campos de rating médio nas tabelas Product e Store
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "averageRating" DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS "totalReviews" INTEGER DEFAULT 0;

ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Função para calcular e atualizar rating médio de produtos
CREATE OR REPLACE FUNCTION update_product_rating(product_id TEXT)
RETURNS VOID AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    review_count INTEGER;
BEGIN
    -- Calcular média e contagem de reviews para o produto
    SELECT 
        COALESCE(AVG(rating), 0.0),
        COUNT(*)
    INTO avg_rating, review_count
    FROM reviews 
    WHERE "productId" = product_id 
    AND status = 'active';
    
    -- Atualizar tabela Product
    UPDATE "Product" 
    SET 
        "averageRating" = avg_rating,
        "totalReviews" = review_count,
        "updatedAt" = NOW()
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular e atualizar rating médio de lojas
CREATE OR REPLACE FUNCTION update_store_rating(store_id TEXT)
RETURNS VOID AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    review_count INTEGER;
BEGIN
    -- Calcular média e contagem de reviews para a loja
    SELECT 
        COALESCE(AVG(rating), 0.0),
        COUNT(*)
    INTO avg_rating, review_count
    FROM reviews 
    WHERE "storeId" = store_id 
    AND status = 'active';
    
    -- Atualizar tabela stores
    UPDATE stores 
    SET 
        average_rating = avg_rating,
        total_reviews = review_count,
        "updatedAt" = NOW()
    WHERE id = store_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar rating quando review é inserido
CREATE OR REPLACE FUNCTION trigger_update_ratings()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar rating do produto se productId existe
    IF NEW."productId" IS NOT NULL THEN
        PERFORM update_product_rating(NEW."productId");
    END IF;
    
    -- Atualizar rating da loja se storeId existe
    IF NEW."storeId" IS NOT NULL THEN
        PERFORM update_store_rating(NEW."storeId");
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar rating quando review é atualizado
CREATE OR REPLACE FUNCTION trigger_update_ratings_on_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o rating ou visibilidade mudou, atualizar
    IF OLD.rating != NEW.rating OR OLD."isVisible" != NEW."isVisible" THEN
        -- Atualizar rating do produto se productId existe
        IF NEW."productId" IS NOT NULL THEN
            PERFORM update_product_rating(NEW."productId");
        END IF;
        
        -- Atualizar rating da loja se storeId existe
        IF NEW."storeId" IS NOT NULL THEN
            PERFORM update_store_rating(NEW."storeId");
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar rating quando review é deletado
CREATE OR REPLACE FUNCTION trigger_update_ratings_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar rating do produto se productId existe
    IF OLD."productId" IS NOT NULL THEN
        PERFORM update_product_rating(OLD."productId");
    END IF;
    
    -- Atualizar rating da loja se storeId existe
    IF OLD."storeId" IS NOT NULL THEN
        PERFORM update_store_rating(OLD."storeId");
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers
DROP TRIGGER IF EXISTS reviews_insert_trigger ON reviews;
CREATE TRIGGER reviews_insert_trigger
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_ratings();

DROP TRIGGER IF EXISTS reviews_update_trigger ON reviews;
CREATE TRIGGER reviews_update_trigger
    AFTER UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_ratings_on_update();

DROP TRIGGER IF EXISTS reviews_delete_trigger ON reviews;
CREATE TRIGGER reviews_delete_trigger
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_ratings_on_delete();

-- Calcular ratings iniciais para produtos existentes
DO $$
DECLARE
    product_record RECORD;
BEGIN
    FOR product_record IN SELECT id FROM "Product" LOOP
        PERFORM update_product_rating(product_record.id);
    END LOOP;
END;
$$;

-- Calcular ratings iniciais para lojas existentes
DO $$
DECLARE
    store_record RECORD;
BEGIN
    FOR store_record IN SELECT id FROM stores LOOP
        PERFORM update_store_rating(store_record.id);
    END LOOP;
END;
$$;

-- Comentários para documentação
COMMENT ON COLUMN "Product"."averageRating" IS 'Média das avaliações do produto (0.0 a 5.0)';
COMMENT ON COLUMN "Product"."totalReviews" IS 'Número total de reviews visíveis do produto';
COMMENT ON COLUMN stores.average_rating IS 'Média das avaliações da loja (0.0 a 5.0)';
COMMENT ON COLUMN stores.total_reviews IS 'Número total de reviews visíveis da loja';

COMMENT ON FUNCTION update_product_rating(TEXT) IS 'Recalcula e atualiza o rating médio de um produto';
COMMENT ON FUNCTION update_store_rating(TEXT) IS 'Recalcula e atualiza o rating médio de uma loja';