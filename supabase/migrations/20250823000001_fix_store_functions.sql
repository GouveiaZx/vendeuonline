-- Função para incrementar contador de produtos na loja
CREATE OR REPLACE FUNCTION increment_store_product_count(store_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE stores 
  SET product_count = COALESCE(product_count, 0) + 1,
      updated_at = NOW()
  WHERE id = store_id;
END;
$$ LANGUAGE plpgsql;

-- Função para decrementar contador de produtos na loja
CREATE OR REPLACE FUNCTION decrement_store_product_count(store_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE stores 
  SET product_count = GREATEST(COALESCE(product_count, 0) - 1, 0),
      updated_at = NOW()
  WHERE id = store_id;
END;
$$ LANGUAGE plpgsql;

-- Função para decrementar estoque do produto
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET stock = GREATEST(stock - quantity, 0),
      updated_at = NOW()
  WHERE id = product_id;
  
  -- Verificar se o produto ficou sem estoque
  IF EXISTS (
    SELECT 1 FROM products 
    WHERE id = product_id AND stock = 0
  ) THEN
    -- Log de produto sem estoque (poderia ser usado para notificações)
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata
    )
    SELECT 
      s.seller_id,
      'low_stock',
      'Produto sem estoque',
      'O produto "' || p.name || '" ficou sem estoque.',
      jsonb_build_object(
        'product_id', product_id,
        'product_name', p.name,
        'store_id', p.store_id
      )
    FROM products p
    JOIN stores s ON p.store_id = s.id
    WHERE p.id = product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para incrementar estoque do produto (para devoluções)
CREATE OR REPLACE FUNCTION increment_stock(product_id UUID, quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET stock = stock + quantity,
      updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular avaliação média da loja
CREATE OR REPLACE FUNCTION update_store_rating(store_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE stores 
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    WHERE p.store_id = store_id 
    AND r.is_visible = true
  ),
  review_count = (
    SELECT COUNT(*)
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    WHERE p.store_id = store_id 
    AND r.is_visible = true
  ),
  updated_at = NOW()
  WHERE id = store_id;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular avaliação média do produto
CREATE OR REPLACE FUNCTION update_product_rating(product_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE product_id = product_id 
    AND is_visible = true
  ),
  review_count = (
    SELECT COUNT(*)
    FROM reviews
    WHERE product_id = product_id 
    AND is_visible = true
  ),
  updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Função para processar webhook de pagamento
CREATE OR REPLACE FUNCTION process_payment_webhook(
  payment_id UUID,
  new_status TEXT,
  webhook_data JSONB
)
RETURNS void AS $$
BEGIN
  -- Atualizar status do pagamento
  UPDATE payments 
  SET status = new_status,
      webhook_data = webhook_data,
      updated_at = NOW()
  WHERE id = payment_id;
  
  -- Se pagamento foi aprovado, atualizar pedido
  IF new_status = 'PAID' THEN
    UPDATE orders 
    SET status = 'CONFIRMED',
        payment_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE payment_id = payment_id;
    
    -- Criar notificação para o vendedor
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata
    )
    SELECT 
      s.seller_id,
      'order_confirmed',
      'Novo pedido confirmado',
      'Pagamento do pedido #' || o.id || ' foi confirmado.',
      jsonb_build_object(
        'order_id', o.id,
        'payment_id', payment_id,
        'total_amount', o.total_amount
      )
    FROM orders o
    JOIN stores s ON o.store_id = s.id
    WHERE o.payment_id = payment_id;
  END IF;
END;
$$ LANGUAGE plpgsql;