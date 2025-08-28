// 🚧 SERVIÇO TEMPORARIAMENTE DESABILITADO DURANTE MIGRAÇÃO PRISMA->SUPABASE

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define tipos localmente
export type StockMovementType = 'SALE' | 'ADJUSTMENT' | 'RETURN' | 'IN' | 'OUT'
export type AvailabilityStatus = 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK'

export interface StockOperation {
  productId: string;
  quantity: number;
  type: StockMovementType;
  reason?: string;
  userId?: string;
  orderId?: string;
}

export interface StockReservation {
  productId: string;
  quantity: number;
  orderId: string;
  userId?: string;
}

export class StockService {
  /**
   * SERVIÇO TEMPORARIAMENTE SIMPLIFICADO PARA SUPABASE
   */
  static async executeStockOperations(operations: StockOperation[]): Promise<void> {
    console.warn('StockService temporariamente usando implementação simplificada com Supabase');
    
    if (operations.length === 0) return;

    for (const operation of operations) {
      try {
        await this.executeStockOperation(operation);
      } catch (error) {
        console.error(`Erro na operação de estoque para produto ${operation.productId}:`, error);
        throw error;
      }
    }
  }

  private static async executeStockOperation(operation: StockOperation): Promise<void> {
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, stock')
      .eq('id', operation.productId)
      .single();

    if (fetchError || !product) {
      throw new Error(`Produto ${operation.productId} não encontrado`);
    }

    let newStock = product.stock;
    
    switch (operation.type) {
      case 'SALE':
      case 'OUT':
        newStock -= operation.quantity;
        break;
      case 'RETURN':
      case 'IN':
        newStock += operation.quantity;
        break;
      case 'ADJUSTMENT':
        newStock = operation.quantity; // Ajuste define valor absoluto
        break;
    }

    if (newStock < 0) {
      throw new Error(`Estoque insuficiente para produto ${operation.productId}`);
    }

    // Atualizar estoque
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', operation.productId);

    if (updateError) {
      throw new Error(`Erro ao atualizar estoque: ${updateError.message}`);
    }

    // Registrar movimentação
    await supabase
      .from('stock_movements')
      .insert({
        product_id: operation.productId,
        type: operation.type,
        quantity: operation.quantity,
        previous_stock: product.stock,
        new_stock: newStock,
        reason: operation.reason || 'Stock operation',
        created_by: operation.userId,
        order_id: operation.orderId,
        created_at: new Date().toISOString()
      });
  }

  static async checkAvailability(productId: string): Promise<{
    inStock: boolean;
    quantity: number;
    status: AvailabilityStatus;
  }> {
    const { data: product, error } = await supabase
      .from('products')
      .select('stock, min_stock')
      .eq('id', productId)
      .single();

    if (error || !product) {
      return { inStock: false, quantity: 0, status: 'OUT_OF_STOCK' };
    }

    const quantity = product.stock;
    const minStock = product.min_stock || 0;

    let status: AvailabilityStatus;
    if (quantity <= 0) {
      status = 'OUT_OF_STOCK';
    } else if (quantity <= minStock) {
      status = 'LOW_STOCK';
    } else {
      status = 'IN_STOCK';
    }

    return {
      inStock: quantity > 0,
      quantity,
      status
    };
  }

  static async reserveStock(reservation: StockReservation): Promise<void> {
    console.warn('Stock reservation temporariamente implementada com operação simples');
    
    await this.executeStockOperation({
      productId: reservation.productId,
      quantity: reservation.quantity,
      type: 'OUT',
      reason: `Reservado para pedido ${reservation.orderId}`,
      userId: reservation.userId,
      orderId: reservation.orderId
    });
  }

  static async releaseReservation(reservation: StockReservation): Promise<void> {
    console.warn('Stock release temporariamente implementada com operação simples');
    
    await this.executeStockOperation({
      productId: reservation.productId,
      quantity: reservation.quantity,
      type: 'IN',
      reason: `Liberado do pedido ${reservation.orderId}`,
      userId: reservation.userId,
      orderId: reservation.orderId
    });
  }

  static async getLowStockProducts(threshold?: number): Promise<any[]> {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, stock, min_stock')
      .lte('stock', threshold || 5);

    if (error) {
      console.error('Erro ao buscar produtos com estoque baixo:', error);
      return [];
    }

    return products || [];
  }

  // Métodos legados mantidos para compatibilidade (implementação vazia)
  static async getStockHistory(): Promise<any[]> {
    console.warn('getStockHistory não implementado na versão Supabase');
    return [];
  }

  static async bulkUpdateStock(): Promise<void> {
    console.warn('bulkUpdateStock não implementado na versão Supabase');
  }

  static async getProductAvailability(): Promise<any[]> {
    console.warn('getProductAvailability não implementado na versão Supabase');
    return [];
  }
}

export default StockService;