#!/usr/bin/env tsx

/**
 * Script para backup automatizado do banco de dados
 * Uso: npm run backup ou node scripts/backup-database.js
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { format } from 'date-fns';

interface BackupConfig {
  databaseUrl: string;
  backupDir: string;
  retentionDays: number;
  compress: boolean;
  s3Upload?: {
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
}

const config: BackupConfig = {
  databaseUrl: process.env.DATABASE_URL || '',
  backupDir: process.env.BACKUP_DIR || './backups',
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '7'),
  compress: true,
  s3Upload: process.env.AWS_S3_BUCKET ? {
    bucket: process.env.AWS_S3_BUCKET,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1'
  } : undefined
};

async function createBackup(): Promise<string> {
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
  const filename = `backup-${timestamp}.sql`;
  const filepath = join(config.backupDir, filename);

  console.log(`📦 Iniciando backup do banco de dados...`);

  // Garantir que o diretório existe
  await fs.mkdir(config.backupDir, { recursive: true });

  // Executar pg_dump
  return new Promise((resolve, reject) => {
    const command = `pg_dump "${config.databaseUrl}" > "${filepath}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erro no backup:', error);
        reject(error);
        return;
      }

      if (stderr) {
        console.warn('⚠️ Avisos do backup:', stderr);
      }

      console.log(`✅ Backup criado: ${filepath}`);
      resolve(filepath);
    });
  });
}

async function compressBackup(filepath: string): Promise<string> {
  if (!config.compress) return filepath;

  const compressedPath = `${filepath}.gz`;
  
  return new Promise((resolve, reject) => {
    exec(`gzip "${filepath}"`, (error) => {
      if (error) {
        console.error('❌ Erro na compressão:', error);
        reject(error);
        return;
      }

      console.log(`🗜️ Backup comprimido: ${compressedPath}`);
      resolve(compressedPath);
    });
  });
}

async function uploadToS3(filepath: string): Promise<void> {
  if (!config.s3Upload) return;

  const { bucket, accessKeyId, secretAccessKey, region } = config.s3Upload;
  const filename = filepath.split('/').pop();
  
  console.log(`☁️ Enviando backup para S3...`);

  return new Promise((resolve, reject) => {
    const command = `aws s3 cp "${filepath}" "s3://${bucket}/backups/${filename}" --region ${region}`;
    
    // Configurar credenciais AWS
    process.env.AWS_ACCESS_KEY_ID = accessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = secretAccessKey;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erro no upload S3:', error);
        reject(error);
        return;
      }

      console.log(`✅ Backup enviado para S3: s3://${bucket}/backups/${filename}`);
      resolve();
    });
  });
}

async function cleanupOldBackups(): Promise<void> {
  console.log(`🧹 Limpando backups antigos (>${config.retentionDays} dias)...`);

  try {
    const files = await fs.readdir(config.backupDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);

    for (const file of files) {
      if (!file.startsWith('backup-')) continue;

      const filepath = join(config.backupDir, file);
      const stats = await fs.stat(filepath);

      if (stats.mtime < cutoffDate) {
        await fs.unlink(filepath);
        console.log(`🗑️ Backup removido: ${file}`);
      }
    }
  } catch (error) {
    console.error('❌ Erro na limpeza de backups:', error);
  }
}

async function sendNotification(success: boolean, filepath?: string, error?: Error): Promise<void> {
  const webhookUrl = process.env.BACKUP_WEBHOOK_URL;
  if (!webhookUrl) return;

  const payload = {
    text: success 
      ? `✅ Backup realizado com sucesso: ${filepath}`
      : `❌ Falha no backup: ${error?.message}`,
    timestamp: new Date().toISOString()
  };

  try {
    const fetch = (await import('node-fetch')).default;
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('❌ Erro ao enviar notificação:', err);
  }
}

async function main(): Promise<void> {
  console.log('🚀 Iniciando processo de backup automatizado...');
  
  try {
    // Validar configuração
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL não configurada');
    }

    // Criar backup
    let backupPath = await createBackup();

    // Comprimir se configurado
    if (config.compress) {
      backupPath = await compressBackup(backupPath);
    }

    // Upload para S3 se configurado
    if (config.s3Upload) {
      await uploadToS3(backupPath);
    }

    // Limpeza de backups antigos
    await cleanupOldBackups();

    // Notificação de sucesso
    await sendNotification(true, backupPath);

    console.log('🎉 Backup concluído com sucesso!');
    
    // Mostrar resumo
    const stats = await fs.stat(backupPath);
    console.log(`📊 Tamanho do backup: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error('💥 Falha no backup:', error);
    await sendNotification(false, undefined, error as Error);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export { main as runBackup, config as backupConfig };