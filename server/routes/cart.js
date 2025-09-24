import express from "express";
import { authenticate, authenticateUser, authenticateSeller, authenticateAdmin } from "../middleware/auth.js";
import { supabase } from "../lib/supabase-client.js";
import { logger } from "../lib/logger.js";


const router = express.Router();

// GET /api/cart - Buscar carrinho do usuário
router.get("/", authenticateUser, async (req, res) => {
  try {
    logger.info("🛒 Buscando carrinho para usuário:", req.user.id);

    // Buscar itens do carrinho no Supabase
    const { data: cartItems, error } = await supabase
      .from("carts")
      .select(
        `
        id,
        productId,
        quantity,
        createdAt,
        updatedAt,
        products:Product!inner (
          id,
          name,
          price,
          comparePrice,
          category,
          isActive,
          stock,
          images:ProductImage (
            id,
            url,
            position
          )
        )
      `
      )
      .eq("userId", req.user.id)
      .eq("products.isActive", true)
      .order("createdAt", { ascending: false });

    if (error) {
      logger.error("❌ Erro ao buscar carrinho:", error);
      throw new Error(`Erro na consulta: ${error.message}`);
    }

    // Transformar dados para formato esperado pelo frontend
    const transformedCart = (cartItems || []).map((item) => {
      const product = item.products;
      const mainImage = product.images?.find((img) => img.position === 0) || product.images?.[0];

      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        addedAt: item.createdAt,
        updatedAt: item.updatedAt,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          comparePrice: product.comparePrice,
          category: product.category,
          stock: product.stock,
          storeName: "Loja Vendeu Online", // Nome genérico temporário
          storeId: "store-placeholder",
          imageUrl: mainImage?.url || "/placeholder-product.jpg",
        },
      };
    });

    // Calcular totais
    const subtotal = transformedCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const shipping = subtotal > 100 ? 0 : 15; // Frete grátis acima de R$ 100
    const total = subtotal + shipping;

    logger.info(`✅ ${transformedCart.length} itens no carrinho encontrados`);

    return res.json({
      success: true,
      data: {
        items: transformedCart,
        summary: {
          itemsCount: transformedCart.length,
          totalQuantity: transformedCart.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: subtotal,
          shipping: shipping,
          total: total,
        },
      },
    });
  } catch (error) {
    logger.error("❌ Erro ao buscar carrinho:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao carregar carrinho",
      details: error.message,
    });
  }
});

// POST /api/cart - Adicionar item ao carrinho
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: "ID do produto é obrigatório",
      });
    }

    if (quantity <= 0 || quantity > 10) {
      return res.status(400).json({
        success: false,
        error: "Quantidade deve ser entre 1 e 10",
      });
    }

    logger.info("🛒 Adicionando produto ao carrinho:", productId, "quantidade:", quantity, "usuário:", req.user.id);

    // Verificar se o produto existe e está ativo
    const { data: product, error: productError } = await supabase
      .from("Product")
      .select("id, name, price, stock, isActive")
      .eq("id", productId)
      .eq("isActive", true)
      .single();

    if (productError || !product) {
      return res.status(404).json({
        success: false,
        error: "Produto não encontrado ou não está ativo",
      });
    }

    // Verificar estoque disponível
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        error: `Estoque insuficiente. Disponível: ${product.stock}`,
      });
    }

    // Verificar se já está no carrinho
    const { data: existingItem, error: existingError } = await supabase
      .from("carts")
      .select("id, quantity")
      .eq("userId", req.user.id)
      .eq("productId", productId)
      .single();

    if (existingItem) {
      // Atualizar quantidade se já existe
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > 10) {
        return res.status(400).json({
          success: false,
          error: "Quantidade máxima de 10 unidades por produto",
        });
      }

      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          error: `Estoque insuficiente. Disponível: ${product.stock}, no carrinho: ${existingItem.quantity}`,
        });
      }

      const { data: updatedItem, error: updateError } = await supabase
        .from("carts")
        .update({
          quantity: newQuantity,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", existingItem.id)
        .select()
        .single();

      if (updateError) {
        logger.error("❌ Erro ao atualizar carrinho:", updateError);
        throw new Error(`Erro ao atualizar: ${updateError.message}`);
      }

      logger.info("✅ Quantidade atualizada no carrinho:", updatedItem.id);

      return res.json({
        success: true,
        message: `Quantidade de ${product.name} atualizada para ${newQuantity}`,
        data: updatedItem,
      });
    } else {
      // Adicionar novo item ao carrinho
      const { data: cartItem, error: insertError } = await supabase
        .from("carts")
        .insert({
          userId: req.user.id,
          productId: productId,
          quantity: quantity,
        })
        .select()
        .single();

      if (insertError) {
        logger.error("❌ Erro ao adicionar ao carrinho:", insertError);
        throw new Error(`Erro ao adicionar: ${insertError.message}`);
      }

      logger.info("✅ Produto adicionado ao carrinho:", cartItem.id);

      return res.json({
        success: true,
        message: `${product.name} foi adicionado ao carrinho`,
        data: cartItem,
      });
    }
  } catch (error) {
    logger.error("❌ Erro ao adicionar ao carrinho:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao adicionar produto ao carrinho",
      details: error.message,
    });
  }
});

// PUT /api/cart/:id - Atualizar quantidade de item no carrinho
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0 || quantity > 10) {
      return res.status(400).json({
        success: false,
        error: "Quantidade deve ser entre 1 e 10",
      });
    }

    logger.info("🔄 Atualizando quantidade no carrinho:", id, "nova quantidade:", quantity);

    // Verificar se o item existe e pertence ao usuário
    const { data: cartItem, error: cartError } = await supabase
      .from("carts")
      .select(
        `
        id,
        productId,
        quantity,
        products:Product!inner (
          id,
          name,
          price,
          stock,
          isActive
        )
      `
      )
      .eq("id", id)
      .eq("userId", req.user.id)
      .single();

    if (cartError || !cartItem) {
      return res.status(404).json({
        success: false,
        error: "Item não encontrado no carrinho",
      });
    }

    const product = cartItem.products;

    // Verificar se produto ainda está ativo
    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        error: "Produto não está mais disponível",
      });
    }

    // Verificar estoque disponível
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        error: `Estoque insuficiente. Disponível: ${product.stock}`,
      });
    }

    // Atualizar quantidade
    const { data: updatedItem, error: updateError } = await supabase
      .from("carts")
      .update({
        quantity: quantity,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      logger.error("❌ Erro ao atualizar quantidade:", updateError);
      throw new Error(`Erro ao atualizar: ${updateError.message}`);
    }

    logger.info("✅ Quantidade atualizada:", updatedItem.id);

    return res.json({
      success: true,
      message: `Quantidade de ${product.name} atualizada para ${quantity}`,
      data: updatedItem,
    });
  } catch (error) {
    logger.error("❌ Erro ao atualizar quantidade:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar quantidade no carrinho",
      details: error.message,
    });
  }
});

// DELETE /api/cart/:id - Remover item do carrinho
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    logger.info("🗑️ Removendo item do carrinho:", id, "usuário:", req.user.id);

    // Verificar se o item existe e pertence ao usuário
    const { data: cartItem, error: checkError } = await supabase
      .from("carts")
      .select(
        `
        id,
        products:Product!inner (name)
      `
      )
      .eq("id", id)
      .eq("userId", req.user.id)
      .single();

    if (checkError || !cartItem) {
      return res.status(404).json({
        success: false,
        error: "Item não encontrado no carrinho",
      });
    }

    // Remover do carrinho
    const { error: deleteError } = await supabase.from("carts").delete().eq("id", id).eq("userId", req.user.id);

    if (deleteError) {
      logger.error("❌ Erro ao remover do carrinho:", deleteError);
      throw new Error(`Erro ao remover: ${deleteError.message}`);
    }

    logger.info("✅ Item removido do carrinho:", id);

    return res.json({
      success: true,
      message: `${cartItem.products.name} removido do carrinho`,
    });
  } catch (error) {
    logger.error("❌ Erro ao remover do carrinho:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao remover produto do carrinho",
      details: error.message,
    });
  }
});

// DELETE /api/cart - Limpar carrinho completo
router.delete("/", authenticateUser, async (req, res) => {
  try {
    logger.info("🧹 Limpando carrinho para usuário:", req.user.id);

    // Remover todos os itens do carrinho do usuário
    const { error } = await supabase.from("carts").delete().eq("userId", req.user.id);

    if (error) {
      logger.error("❌ Erro ao limpar carrinho:", error);
      throw new Error(`Erro ao limpar: ${error.message}`);
    }

    logger.info("✅ Carrinho limpo com sucesso");

    return res.json({
      success: true,
      message: "Carrinho limpo com sucesso",
    });
  } catch (error) {
    logger.error("❌ Erro ao limpar carrinho:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao limpar carrinho",
      details: error.message,
    });
  }
});

export default router;
