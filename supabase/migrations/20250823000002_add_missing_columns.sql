-- Adicionar colunas que podem estar faltando nas tabelas

-- Adicionar product_count nas stores se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stores' AND column_name = 'product_count') THEN
    ALTER TABLE stores ADD COLUMN product_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Adicionar rating e review_count nas stores se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stores' AND column_name = 'rating') THEN
    ALTER TABLE stores ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stores' AND column_name = 'review_count') THEN
    ALTER TABLE stores ADD COLUMN review_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Adicionar rating e review_count nos products se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'rating') THEN
    ALTER TABLE products ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'review_count') THEN
    ALTER TABLE products ADD COLUMN review_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Adicionar webhook_data nos payments se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'payments' AND column_name = 'webhook_data') THEN
    ALTER TABLE payments ADD COLUMN webhook_data JSONB;
  END IF;
END $$;

-- Adicionar payment_confirmed_at nos orders se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'payment_confirmed_at') THEN
    ALTER TABLE orders ADD COLUMN payment_confirmed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Criar tabela de notifications se não existir
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Atualizar contadores existentes
UPDATE stores SET 
  product_count = (
    SELECT COUNT(*) 
    FROM products 
    WHERE store_id = stores.id
  ),
  rating = (
    SELECT COALESCE(AVG(r.rating), 0)
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    WHERE p.store_id = stores.id 
    AND r.is_visible = true
  ),
  review_count = (
    SELECT COUNT(*)
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    WHERE p.store_id = stores.id 
    AND r.is_visible = true
  )
WHERE product_count IS NULL OR rating IS NULL OR review_count IS NULL;

UPDATE products SET 
  rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE product_id = products.id 
    AND is_visible = true
  ),
  review_count = (
    SELECT COUNT(*)
    FROM reviews
    WHERE product_id = products.id 
    AND is_visible = true
  )
WHERE rating IS NULL OR review_count IS NULL;