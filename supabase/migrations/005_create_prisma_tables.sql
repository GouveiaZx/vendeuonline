-- Migração simplificada para criar apenas as tabelas que faltam
-- Usando os enums e estruturas já existentes no Supabase

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar se precisamos criar novos enums
DO $$ BEGIN
    CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BANK_SLIP', 'PAYPAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('ORDER', 'PAYMENT', 'PROMOTION', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela Address (endereços dos usuários)
CREATE TABLE IF NOT EXISTS "Address" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "street" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "complement" TEXT,
  "neighborhood" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "zipCode" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Tabela Product (produtos)
CREATE TABLE IF NOT EXISTS "Product" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sellerId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "price" DECIMAL(10,2) NOT NULL,
  "comparePrice" DECIMAL(10,2),
  "stock" INTEGER NOT NULL DEFAULT 0,
  "sku" TEXT,
  "weight" DECIMAL(8,3),
  "dimensions" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "rating" DECIMAL(3,2) DEFAULT 0,
  "reviewCount" INTEGER NOT NULL DEFAULT 0,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "salesCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE CASCADE,
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE,
  FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT
);

-- Tabela ProductImage (imagens dos produtos)
CREATE TABLE IF NOT EXISTS "ProductImage" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "productId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "alt" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
);

-- Tabela ProductSpecification (especificações dos produtos)
CREATE TABLE IF NOT EXISTS "ProductSpecification" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
);

-- Tabela Order (pedidos)
CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "buyerId" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "total" DECIMAL(10,2) NOT NULL,
  "subtotal" DECIMAL(10,2) NOT NULL,
  "shipping" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "paymentMethod" "PaymentMethod",
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "shippingAddress" JSONB NOT NULL,
  "billingAddress" JSONB,
  "notes" TEXT,
  "trackingCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE RESTRICT,
  FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE RESTRICT,
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT
);

-- Tabela OrderItem (itens dos pedidos)
CREATE TABLE IF NOT EXISTS "OrderItem" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "total" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE,
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT
);

-- Tabela Review (avaliações) - Esta é a principal para o sistema de reviews
CREATE TABLE IF NOT EXISTS "Review" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "productId" TEXT,
  "storeId" TEXT,
  "orderId" TEXT,
  "rating" INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
  "title" TEXT,
  "comment" TEXT,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "helpfulCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE,
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE,
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL,
  CONSTRAINT "review_target_check" CHECK (
    ("productId" IS NOT NULL AND "storeId" IS NULL) OR
    ("productId" IS NULL AND "storeId" IS NOT NULL)
  )
);

-- Tabela Wishlist (lista de desejos)
CREATE TABLE IF NOT EXISTS "Wishlist" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE,
  UNIQUE("userId", "productId")
);

-- Tabela Notification (notificações)
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "data" JSONB,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Tabela Subscription (assinaturas)
CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sellerId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endDate" TIMESTAMP(3),
  "autoRenew" BOOLEAN NOT NULL DEFAULT true,
  "paymentMethod" "PaymentMethod",
  "lastPayment" TIMESTAMP(3),
  "nextPayment" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE CASCADE,
  FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS "Product_sellerId_idx" ON "Product"("sellerId");
CREATE INDEX IF NOT EXISTS "Product_storeId_idx" ON "Product"("storeId");
CREATE INDEX IF NOT EXISTS "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX IF NOT EXISTS "Product_isActive_idx" ON "Product"("isActive");
CREATE INDEX IF NOT EXISTS "Product_isFeatured_idx" ON "Product"("isFeatured");
CREATE INDEX IF NOT EXISTS "Order_buyerId_idx" ON "Order"("buyerId");
CREATE INDEX IF NOT EXISTS "Order_sellerId_idx" ON "Order"("sellerId");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "Review_productId_idx" ON "Review"("productId");
CREATE INDEX IF NOT EXISTS "Review_storeId_idx" ON "Review"("storeId");
CREATE INDEX IF NOT EXISTS "Review_userId_idx" ON "Review"("userId");

-- Função para atualizar updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updatedAt
CREATE TRIGGER update_product_updated_at BEFORE UPDATE ON "Product" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_updated_at BEFORE UPDATE ON "Order" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_review_updated_at BEFORE UPDATE ON "Review" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_updated_at BEFORE UPDATE ON "Subscription" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_address_updated_at BEFORE UPDATE ON "Address" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS nas tabelas principais
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Wishlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de RLS
CREATE POLICY "Public can view active products" ON "Product" FOR SELECT USING ("isActive" = true);
CREATE POLICY "Sellers can manage their products" ON "Product" FOR ALL USING (auth.uid()::text IN (SELECT "userId" FROM "sellers" WHERE id = "sellerId"));

CREATE POLICY "Users can view public reviews" ON "Review" FOR SELECT USING ("isVisible" = true);
CREATE POLICY "Users can manage their reviews" ON "Review" FOR ALL USING (auth.uid()::text = "userId");

CREATE POLICY "Users can manage their wishlist" ON "Wishlist" FOR ALL USING (auth.uid()::text = "userId");
CREATE POLICY "Users can view their notifications" ON "Notification" FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "Users can manage their addresses" ON "Address" FOR ALL USING (auth.uid()::text = "userId");

-- Conceder permissões básicas
GRANT SELECT ON "Product" TO anon, authenticated;
GRANT SELECT ON "ProductImage" TO anon, authenticated;
GRANT SELECT ON "ProductSpecification" TO anon, authenticated;
GRANT SELECT ON "Review" TO anon, authenticated;

GRANT ALL ON "Product" TO authenticated;
GRANT ALL ON "ProductImage" TO authenticated;
GRANT ALL ON "ProductSpecification" TO authenticated;
GRANT ALL ON "Order" TO authenticated;
GRANT ALL ON "OrderItem" TO authenticated;
GRANT ALL ON "Review" TO authenticated;
GRANT ALL ON "Wishlist" TO authenticated;
GRANT ALL ON "Notification" TO authenticated;
GRANT ALL ON "Address" TO authenticated;
GRANT ALL ON "Subscription" TO authenticated;