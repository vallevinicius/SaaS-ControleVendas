#!/usr/bin/env bash
# Backup do banco do Total Control (MySQL) com rotação.
#
# Uso:    ./scripts/backup-mysql.sh [pasta-de-destino] [dias-de-retenção]
# Padrão: ./backups  e  14 dias.
# Agende no cron do servidor (ex: todo dia às 03:00):
#   0 3 * * * cd /caminho/server && ./scripts/backup-mysql.sh /var/backups/totalcontrol 30
#
# Lê DATABASE_URL do ambiente ou de server/.env. Precisa do `mysqldump` instalado.
# IMPORTANTE: um backup só vale depois de restaurado com sucesso ao menos uma vez
# (veja "Restaurar" no README). Guarde uma cópia FORA do servidor (outro provedor/bucket).
set -euo pipefail

DESTINO="${1:-./backups}"
RETENCAO_DIAS="${2:-14}"

DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -z "${DATABASE_URL:-}" && -f "$DIR/.env" ]]; then
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$DIR/.env" | head -1 | cut -d= -f2- | tr -d '"')"
fi
[[ -n "${DATABASE_URL:-}" ]] || { echo "DATABASE_URL não encontrada." >&2; exit 1; }
command -v mysqldump >/dev/null || { echo "mysqldump não está instalado." >&2; exit 1; }

# mysql://usuario:senha@host:porta/banco
REGEX='^mysql://([^:]+):([^@]*)@([^:/]+):?([0-9]*)/([^?]+)'
[[ "$DATABASE_URL" =~ $REGEX ]] || { echo "DATABASE_URL em formato inesperado." >&2; exit 1; }
USUARIO="${BASH_REMATCH[1]}"; SENHA="${BASH_REMATCH[2]}"; HOST="${BASH_REMATCH[3]}"; PORTA="${BASH_REMATCH[4]:-3306}"; BANCO="${BASH_REMATCH[5]}"
# A senha da URL pode vir codificada (%40 etc.).
SENHA="$(printf '%b' "${SENHA//%/\\x}")"

mkdir -p "$DESTINO"
ARQUIVO="$DESTINO/${BANCO}_$(date +%Y%m%d_%H%M%S).sql.gz"

# Senha por variável de ambiente (não aparece na lista de processos).
MYSQL_PWD="$SENHA" mysqldump --host="$HOST" --port="$PORTA" --user="$USUARIO" \
  --single-transaction --routines --triggers --no-tablespaces "$BANCO" | gzip > "$ARQUIVO"

# Confere que o arquivo não saiu vazio.
[[ "$(gzip -dc "$ARQUIVO" | head -c 200 | wc -c)" -gt 100 ]] || { rm -f "$ARQUIVO"; echo "Backup vazio, descartado." >&2; exit 1; }

find "$DESTINO" -name "${BANCO}_*.sql.gz" -mtime +"$RETENCAO_DIAS" -delete
echo "Backup salvo em $ARQUIVO ($(du -h "$ARQUIVO" | cut -f1))"
