// 🚧 ARQUIVO TEMPORARIAMENTE DESABILITADO DURANTE MIGRAÇÃO PRISMA->SUPABASE

export interface RollbackOperation {
  id: string
  paymentId: string
  subscriptionId?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  reason: string
  compensationActions: CompensationAction[]
  createdAt: Date
  completedAt?: Date
  error?: string
}

export interface CompensationAction {
  type: 'CANCEL_SUBSCRIPTION' | 'RESTORE_STOCK' | 'CANCEL_PAYMENT' | 'PROCESS_REFUND' | 'REVERT_PLAN' | 'CANCEL_ORDER'
  entityId: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  error?: string
  retryCount: number
  maxRetries: number
}

class PaymentRollbackService {
  /**
   * Inicia processo de rollback para um pagamento que falhou
   */
  static async initiatePaymentRollback(
    paymentId: string, 
    subscriptionId?: string, 
    reason: string = 'Payment processing failed'
  ): Promise<string> {
    // 🚧 SERVIÇO TEMPORARIAMENTE DESABILITADO DURANTE MIGRAÇÃO PRISMA->SUPABASE
    const rollbackId = `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.warn('PaymentRollbackService temporariamente desabilitado durante migração');
    return rollbackId;
  }

  static async executeRollback(rollbackId: string): Promise<boolean> {
    console.warn('PaymentRollbackService temporariamente desabilitado durante migração');
    return true;
  }

  static getRollbackStatus(rollbackId: string): RollbackOperation | null {
    console.warn('PaymentRollbackService temporariamente desabilitado durante migração');
    return null;
  }

  static getAllRollbacks(): RollbackOperation[] {
    console.warn('PaymentRollbackService temporariamente desabilitado durante migração');
    return [];
  }

  static cleanupCompletedRollbacks(olderThanHours: number = 24): void {
    console.warn('PaymentRollbackService temporariamente desabilitado durante migração');
  }
}

export default PaymentRollbackService;