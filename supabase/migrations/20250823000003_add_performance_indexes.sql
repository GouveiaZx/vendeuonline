-- Índices para melhorar performance das consultas

-- Produtos
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating DESC);
CREATE INDEX IF NOT EXISTS idx_products_sales_count ON products(sales_count DESC);

-- Índice composto para busca de produtos ativos por vendedor/loja
CREATE INDEX IF NOT EXISTS idx_products_seller_active ON products(seller_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_store_active ON products(store_id, is_active) WHERE is_active = true;

-- Índice para busca de texto (se não existir)
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('portuguese', name || ' ' || description));

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_confirmed_at ON orders(payment_confirmed_at DESC);

-- Índice composto para busca de pedidos por comprador e status
CREATE INDEX IF NOT EXISTS idx_orders_buyer_status ON orders(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_created ON orders(buyer_id, created_at DESC);

-- Order Items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_visible ON reviews(is_visible);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Índice composto para reviews visíveis por produto
CREATE INDEX IF NOT EXISTS idx_reviews_product_visible ON reviews(product_id, is_visible) WHERE is_visible = true;

-- Stores
CREATE INDEX IF NOT EXISTS idx_stores_seller_id ON stores(seller_id);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON stores(is_active);
CREATE INDEX IF NOT EXISTS idx_stores_created_at ON stores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stores_rating ON stores(rating DESC);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_buyer_id ON payments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_id);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Otimizar consultas com FTS (Full Text Search)
-- Atualizar produtos com search_vector se a coluna existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'products' AND column_name = 'search_vector') THEN
    
    -- Atualizar search_vector existente
    UPDATE products 
    SET search_vector = to_tsvector('portuguese', name || ' ' || description || ' ' || COALESCE(tags::text, ''))
    WHERE search_vector IS NULL;
    
  ELSE
    -- Adicionar search_vector se não existir
    ALTER TABLE products ADD COLUMN search_vector tsvector;
    
    -- Preencher search_vector
    UPDATE products 
    SET search_vector = to_tsvector('portuguese', name || ' ' || description || ' ' || COALESCE(tags::text, ''));
    
    -- Criar índice GIN para search_vector
    CREATE INDEX idx_products_search_vector ON products USING gin(search_vector);
    
    -- Trigger para manter search_vector atualizado
    CREATE OR REPLACE FUNCTION products_search_vector_trigger() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector := to_tsvector('portuguese', NEW.name || ' ' || NEW.description || ' ' || COALESCE(NEW.tags::text, ''));
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    DROP TRIGGER IF EXISTS products_search_vector_update ON products;
    CREATE TRIGGER products_search_vector_update
      BEFORE INSERT OR UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION products_search_vector_trigger();
  END IF;
END $$;

-- Análise de estatísticas para otimizar query planner
ANALYZE products;
ANALYZE orders;
ANALYZE order_items;
ANALYZE reviews;
ANALYZE stores;
ANALYZE payments;
ANALYZE users;
ANALYZE categories;