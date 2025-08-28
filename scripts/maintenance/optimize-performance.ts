/**
 * Script de Otimização de Performance
 * Executa tarefas de otimização do banco de dados e aplicação
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

interface OptimizationResult {
  task: string;
  success: boolean;
  duration: number;
  details?: string;
  error?: string;
}

class PerformanceOptimizer {
  private results: OptimizationResult[] = [];

  async runOptimizations(): Promise<OptimizationResult[]> {
    console.log('🚀 Iniciando otimizações de performance...\n');

    await this.executeIndexes();
    await this.refreshMaterializedViews();
    await this.analyzeDatabase();
    await this.cleanupOldData();
    await this.optimizeImages();
    await this.updateStatistics();
    
    this.printResults();
    return this.results;
  }

  private async executeTask<T>(
    taskName: string,
    fn: () => Promise<T>
  ): Promise<T | null> {
    const start = Date.now();
    console.log(`⏳ ${taskName}...`);

    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      this.results.push({
        task: taskName,
        success: true,
        duration,
        details: typeof result === 'string' ? result : undefined
      });

      console.log(`✅ ${taskName} concluído em ${duration}ms\n`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      this.results.push({
        task: taskName,
        success: false,
        duration,
        error: (error as Error).message
      });

      console.error(`❌ ${taskName} falhou: ${(error as Error).message}\n`);
      return null;
    }
  }

  private async executeIndexes(): Promise<void> {
    await this.executeTask('Aplicando índices otimizados', async () => {
      const indexesPath = path.join(process.cwd(), 'prisma', 'indexes.sql');
      
      try {
        const indexesSQL = await fs.readFile(indexesPath, 'utf-8');
        
        // Executar SQL em blocos (PostgreSQL pode ter limites)
        const statements = indexesSQL
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        let successCount = 0;
        for (const statement of statements) {
          try {
            await prisma.$executeRawUnsafe(statement);
            successCount++;
          } catch (error) {
            // Log do erro, mas continua (alguns índices podem já existir)
            console.warn(`  ⚠️  Índice ignorado: ${(error as Error).message.substring(0, 80)}...`);
          }
        }

        return `${successCount}/${statements.length} índices aplicados`;
      } catch (error) {
        throw new Error(`Erro ao ler arquivo de índices: ${(error as Error).message}`);
      }
    });
  }

  private async refreshMaterializedViews(): Promise<void> {
    await this.executeTask('Atualizando views materializadas', async () => {
      const views = ['seller_dashboard_stats', 'best_selling_products'];
      
      for (const view of views) {
        try {
          await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${view}`);
        } catch (error) {
          // Fallback sem CONCURRENTLY se não existir índice único
          await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW ${view}`);
        }
      }

      return `${views.length} views materializadas atualizadas`;
    });
  }

  private async analyzeDatabase(): Promise<void> {
    await this.executeTask('Analisando tabelas para otimizar queries', async () => {
      const tables = [
        'Product', 'Order', 'OrderItem', 'User', 'Seller', 'Buyer',
        'Review', 'Category', 'StockMovement', 'Payment', 'Address'
      ];

      for (const table of tables) {
        await prisma.$executeRawUnsafe(`ANALYZE "${table}"`);
      }

      return `${tables.length} tabelas analisadas`;
    });
  }

  private async cleanupOldData(): Promise<void> {
    await this.executeTask('Limpando dados antigos', async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // Limpar carrinho abandonado (mais de 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Limpar sessões expiradas
      await prisma.$executeRawUnsafe(`
        DELETE FROM "Session" 
        WHERE "expiresAt" < NOW() OR "createdAt" < $1
      `, ninetyDaysAgo);

      // Limpar logs antigos (se houver tabela de logs)
      try {
        await prisma.$executeRawUnsafe(`
          DELETE FROM "Log" 
          WHERE "createdAt" < $1 AND level NOT IN ('ERROR', 'CRITICAL')
        `, thirtyDaysAgo);
      } catch {
        // Tabela de logs pode não existir
      }

      // Limpar notificações antigas lidas
      try {
        await prisma.$executeRawUnsafe(`
          DELETE FROM "Notification" 
          WHERE "createdAt" < $1 AND read = true
        `, thirtyDaysAgo);
      } catch {
        // Tabela de notificações pode não existir
      }

      return 'Dados antigos removidos';
    });
  }

  private async optimizeImages(): Promise<void> {
    await this.executeTask('Otimizando referências de imagens', async () => {
      // Verificar imagens órfãs (não referenciadas)
      const orphanedImages = await prisma.$queryRaw`
        SELECT pi.id, pi.url
        FROM "ProductImage" pi
        LEFT JOIN "Product" p ON pi."productId" = p.id
        WHERE p.id IS NULL
      ` as any[];

      if (orphanedImages.length > 0) {
        // Log das imagens órfãs (não deletamos automaticamente por segurança)
        console.log(`  📷 Encontradas ${orphanedImages.length} imagens órfãs para revisão manual`);
        
        // Salvar lista para revisão manual
        await fs.writeFile(
          'orphaned-images.json',
          JSON.stringify(orphanedImages, null, 2)
        );
      }

      // Atualizar contadores de uso de imagens
      await prisma.$executeRawUnsafe(`
        UPDATE "ProductImage" 
        SET "order" = subq.row_num - 1
        FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY "productId" ORDER BY "order", "createdAt") as row_num
          FROM "ProductImage"
        ) subq
        WHERE "ProductImage".id = subq.id
      `);

      return orphanedImages.length > 0 
        ? `${orphanedImages.length} imagens órfãs identificadas`
        : 'Nenhuma imagem órfã encontrada';
    });
  }

  private async updateStatistics(): Promise<void> {
    await this.executeTask('Atualizando estatísticas do PostgreSQL', async () => {
      // Força coleta de estatísticas mais detalhadas
      await prisma.$executeRawUnsafe('ANALYZE (BUFFERS, VERBOSE)');

      // Atualizar estatísticas estendidas se existirem
      try {
        await prisma.$executeRawUnsafe(`
          SELECT pg_stat_reset();
          SELECT pg_stat_reset_shared('bgwriter');
        `);
      } catch {
        // Comando pode não estar disponível em todas as versões
      }

      return 'Estatísticas do banco atualizadas';
    });
  }

  private printResults(): void {
    console.log('\n📊 RESUMO DAS OTIMIZAÇÕES\n');
    console.log('═'.repeat(60));
    
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`✅ Sucessos: ${successful.length}/${this.results.length}`);
    console.log(`❌ Falhas: ${failed.length}/${this.results.length}`);
    console.log(`⏱️  Tempo total: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.log('═'.repeat(60));

    if (successful.length > 0) {
      console.log('\n✅ TAREFAS CONCLUÍDAS:');
      successful.forEach(result => {
        console.log(`  • ${result.task} (${result.duration}ms)`);
        if (result.details) {
          console.log(`    └─ ${result.details}`);
        }
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ TAREFAS COM FALHA:');
      failed.forEach(result => {
        console.log(`  • ${result.task}`);
        console.log(`    └─ Erro: ${result.error}`);
      });
    }

    console.log('\n🎯 RECOMENDAÇÕES:');
    console.log('  • Execute este script semanalmente ou após deploy');
    console.log('  • Monitore logs de query lenta no PostgreSQL');
    console.log('  • Considere cache Redis para queries frequentes');
    console.log('  • Acompanhe métricas de performance no Sentry');
    
    if (failed.length > 0) {
      console.log('  • Revisar erros acima e corrigir antes do próximo deploy');
    }
  }
}

// Executar se chamado diretamente
async function main() {
  try {
    const optimizer = new PerformanceOptimizer();
    await optimizer.runOptimizations();
  } catch (error) {
    console.error('💥 Erro crítico na otimização:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Permitir uso como módulo ou script standalone
if (require.main === module) {
  main().catch(console.error);
}

export { PerformanceOptimizer, type OptimizationResult };