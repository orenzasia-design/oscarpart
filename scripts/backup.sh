#!/bin/bash
# ============================================================
# OSCARPART — Daily Backup Script
# Add to crontab: 0 3 * * * /path/to/oscarpart/scripts/backup.sh
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backup"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

# Load env
if [ -f "$PROJECT_DIR/backend/.env" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/backend/.env" | xargs) 2>/dev/null || true
fi

mkdir -p "$BACKUP_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backup..."

# ── PostgreSQL backup ────────────────────────────────────────
BACKUP_FILE="$BACKUP_DIR/oscarpart_${DATE}.sql.gz"

docker exec oscarpart_postgres \
  pg_dump -U oscarpart_user oscarpart \
  | gzip > "$BACKUP_FILE"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Database backup: $BACKUP_FILE ($SIZE)"

# ── Clean old backups ────────────────────────────────────────
find "$BACKUP_DIR" -name "*.sql.gz" -mtime "+$KEEP_DAYS" -delete
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Cleaned backups older than $KEEP_DAYS days"

# ── Redis backup (optional) ──────────────────────────────────
REDIS_BACKUP="$BACKUP_DIR/redis_${DATE}.rdb"
docker exec oscarpart_redis redis-cli \
  --pass "${REDIS_PASSWORD:-}" \
  BGSAVE > /dev/null 2>&1 || true

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Backup complete"
echo ""

# List recent backups
echo "Recent backups:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5 || echo "  (none)"
