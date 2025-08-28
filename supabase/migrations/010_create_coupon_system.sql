-- Migração para sistema de cupons de desconto

-- Tabela principal de cupons
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed_amount')),
    value DECIMAL(10,2) NOT NULL CHECK (value > 0),
    minimum_order_value DECIMAL(10,2) DEFAULT 0,
    maximum_discount_amount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_limit_per_customer INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_auto_apply BOOLEAN DEFAULT false,
    auto_apply_category VARCHAR(100),
    auto_apply_first_purchase BOOLEAN DEFAULT false,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de uso de cupons
CREATE TABLE IF NOT EXISTS coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    order_id UUID,
    discount_amount DECIMAL(10,2) NOT NULL,
    order_total DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    store_id UUID REFERENCES stores(id)
);

-- Tabela de cupons aplicáveis por categoria
CREATE TABLE IF NOT EXISTS coupon_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de cupons aplicáveis por produto específico
CREATE TABLE IF NOT EXISTS coupon_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de cupons aplicáveis por loja
CREATE TABLE IF NOT EXISTS coupon_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização de performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_store_id ON coupons(store_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_dates ON coupons(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_store_id ON coupon_usage(store_id);
CREATE INDEX IF NOT EXISTS idx_coupon_categories_coupon_id ON coupon_categories(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_products_coupon_id ON coupon_products(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_stores_coupon_id ON coupon_stores(coupon_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_coupon_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_coupon_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_coupon_updated_at();

-- Trigger para incrementar usage_count quando um cupom é usado
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE coupons 
    SET used_count = used_count + 1 
    WHERE id = NEW.coupon_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_coupon_usage
    AFTER INSERT ON coupon_usage
    FOR EACH ROW
    EXECUTE FUNCTION increment_coupon_usage();

-- Função para validar se um cupom pode ser usado
CREATE OR REPLACE FUNCTION validate_coupon(
    p_code VARCHAR(50),
    p_user_id UUID,
    p_order_total DECIMAL(10,2),
    p_store_id UUID DEFAULT NULL,
    p_category VARCHAR(100) DEFAULT NULL,
    p_product_ids UUID[] DEFAULT NULL
)
RETURNS TABLE(
    is_valid BOOLEAN,
    coupon_id UUID,
    discount_amount DECIMAL(10,2),
    error_message TEXT
) AS $$
DECLARE
    v_coupon RECORD;
    v_usage_count INTEGER;
    v_discount DECIMAL(10,2);
    v_is_first_purchase BOOLEAN;
BEGIN
    -- Buscar o cupom
    SELECT * INTO v_coupon
    FROM coupons
    WHERE code = p_code AND is_active = true;
    
    -- Verificar se o cupom existe
    IF v_coupon.id IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL(10,2), 'Cupom não encontrado ou inativo';
        RETURN;
    END IF;
    
    -- Verificar datas de validade
    IF NOW() < v_coupon.start_date THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL(10,2), 'Cupom ainda não está válido';
        RETURN;
    END IF;
    
    IF v_coupon.end_date IS NOT NULL AND NOW() > v_coupon.end_date THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL(10,2), 'Cupom expirado';
        RETURN;
    END IF;
    
    -- Verificar valor mínimo do pedido
    IF p_order_total < v_coupon.minimum_order_value THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL(10,2), 
            'Valor mínimo do pedido não atingido: R$ ' || v_coupon.minimum_order_value;
        RETURN;
    END IF;
    
    -- Verificar limite de uso geral
    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL(10,2), 'Limite de uso do cupom atingido';
        RETURN;
    END IF;
    
    -- Verificar limite de uso por cliente
    SELECT COUNT(*) INTO v_usage_count
    FROM coupon_usage
    WHERE coupon_id = v_coupon.id AND user_id = p_user_id;
    
    IF v_coupon.usage_limit_per_customer IS NOT NULL AND v_usage_count >= v_coupon.usage_limit_per_customer THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL(10,2), 'Limite de uso por cliente atingido';
        RETURN;
    END IF;
    
    -- Verificar se é cupom de primeira compra
    IF v_coupon.auto_apply_first_purchase = true THEN
        SELECT COUNT(*) = 0 INTO v_is_first_purchase
        FROM coupon_usage cu
        WHERE cu.user_id = p_user_id;
        
        IF NOT v_is_first_purchase THEN
            RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL(10,2), 'Cupom válido apenas para primeira compra';
            RETURN;
        END IF;
    END IF;
    
    -- Verificar restrições de loja
    IF v_coupon.store_id IS NOT NULL AND v_coupon.store_id != p_store_id THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL(10,2), 'Cupom não válido para esta loja';
        RETURN;
    END IF;
    
    -- Verificar restrições de categoria
    IF v_coupon.auto_apply_category IS NOT NULL AND (p_category IS NULL OR v_coupon.auto_apply_category != p_category) THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL(10,2), 'Cupom não válido para esta categoria';
        RETURN;
    END IF;
    
    -- Calcular desconto
    IF v_coupon.type = 'percentage' THEN
        v_discount := p_order_total * (v_coupon.value / 100);
        IF v_coupon.maximum_discount_amount IS NOT NULL AND v_discount > v_coupon.maximum_discount_amount THEN
            v_discount := v_coupon.maximum_discount_amount;
        END IF;
    ELSE
        v_discount := v_coupon.value;
        IF v_discount > p_order_total THEN
            v_discount := p_order_total;
        END IF;
    END IF;
    
    -- Retornar resultado válido
    RETURN QUERY SELECT true, v_coupon.id, v_discount, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Função para aplicar cupom e registrar uso
CREATE OR REPLACE FUNCTION apply_coupon(
    p_code VARCHAR(50),
    p_user_id UUID,
    p_order_total DECIMAL(10,2),
    p_order_id UUID DEFAULT NULL,
    p_store_id UUID DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    discount_amount DECIMAL(10,2),
    usage_id UUID,
    error_message TEXT
) AS $$
DECLARE
    v_validation RECORD;
    v_usage_id UUID;
BEGIN
    -- Validar cupom
    SELECT * INTO v_validation
    FROM validate_coupon(p_code, p_user_id, p_order_total, p_store_id);
    
    IF NOT v_validation.is_valid THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10,2), NULL::UUID, v_validation.error_message;
        RETURN;
    END IF;
    
    -- Registrar uso do cupom
    INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount, order_total, store_id)
    VALUES (v_validation.coupon_id, p_user_id, p_order_id, v_validation.discount_amount, p_order_total, p_store_id)
    RETURNING id INTO v_usage_id;
    
    RETURN QUERY SELECT true, v_validation.discount_amount, v_usage_id, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Inserir alguns cupons de exemplo
INSERT INTO coupons (code, name, description, type, value, minimum_order_value, usage_limit, start_date, end_date, is_active)
VALUES 
    ('WELCOME10', 'Desconto de Boas-vindas', 'Desconto de 10% para novos clientes', 'percentage', 10.00, 50.00, 1000, NOW(), NOW() + INTERVAL '30 days', true),
    ('SAVE20', 'Desconto Fixo R$ 20', 'Desconto fixo de R$ 20 em compras acima de R$ 100', 'fixed_amount', 20.00, 100.00, 500, NOW(), NOW() + INTERVAL '15 days', true),
    ('FIRST15', 'Primeira Compra', 'Desconto de 15% na primeira compra', 'percentage', 15.00, 30.00, NULL, NOW(), NOW() + INTERVAL '60 days', true),
    ('MEGA50', 'Mega Desconto', 'Desconto de 50% até R$ 100', 'percentage', 50.00, 200.00, 100, NOW(), NOW() + INTERVAL '7 days', true);

-- Configurar cupom de primeira compra
UPDATE coupons SET auto_apply_first_purchase = true WHERE code = 'FIRST15';

-- Configurar desconto máximo para o cupom MEGA50
UPDATE coupons SET maximum_discount_amount = 100.00 WHERE code = 'MEGA50';

COMMIT;