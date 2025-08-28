#!/bin/bash

# Script para configurar backup automatizado via cron
# Uso: ./scripts/cron-backup.sh

# Configurações
BACKUP_SCRIPT_PATH="/path/to/your/project/scripts/backup-database.ts"
LOG_PATH="/var/log/database-backup.log"
CRON_TIME="0 2 * * *"  # Todo dia às 02:00

echo "🔧 Configurando backup automatizado do banco de dados..."

# Verificar se o tsx está instalado globalmente
if ! command -v tsx &> /dev/null; then
    echo "📦 Instalando tsx globalmente..."
    npm install -g tsx
fi

# Criar o comando para o cron
CRON_COMMAND="cd $(pwd) && tsx $BACKUP_SCRIPT_PATH >> $LOG_PATH 2>&1"

# Adicionar ao cron
echo "⏰ Adicionando ao crontab..."
(crontab -l 2>/dev/null; echo "$CRON_TIME $CRON_COMMAND") | crontab -

echo "✅ Backup automatizado configurado!"
echo "📅 Agendamento: $CRON_TIME (todo dia às 02:00)"
echo "📝 Logs: $LOG_PATH"
echo ""
echo "Para verificar o cron:"
echo "  crontab -l"
echo ""
echo "Para testar manualmente:"
echo "  npm run backup"