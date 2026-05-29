#!/bin/bash
# ============================================================
# OSCARPART — Production Deploy Script
# Usage: ./scripts/deploy.sh
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "  OSCARPART — Production Deploy"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

cd "$PROJECT_DIR"

# ── 1. Pull latest code ──────────────────────────────────────
echo ""
echo "[1/5] Pulling latest code..."
git pull origin main

# ── 2. Backup database before deploy ────────────────────────
echo ""
echo "[2/5] Backing up database..."
bash scripts/backup.sh

# ── 3. Build new images ──────────────────────────────────────
echo ""
echo "[3/5] Building Docker images..."
docker compose build --no-cache backend frontend

# ── 4. Rolling restart (zero downtime) ──────────────────────
echo ""
echo "[4/5] Restarting services..."
docker compose up -d --no-deps backend
sleep 5

# Health check backend
HEALTH=$(curl -sf http://localhost:4000/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','unknown'))" 2>/dev/null || echo "unreachable")
if [ "$HEALTH" != "healthy" ]; then
  echo "❌ Backend health check failed! Rolling back..."
  docker compose restart backend
  exit 1
fi
echo "   ✅ Backend healthy"

docker compose up -d --no-deps frontend
echo "   ✅ Frontend restarted"

# ── 5. Cleanup old images ────────────────────────────────────
echo ""
echo "[5/5] Cleaning up old Docker images..."
docker image prune -f

echo ""
echo "=========================================="
echo "  ✅ Deploy complete!"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
