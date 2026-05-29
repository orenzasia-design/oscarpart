# ============================================================
# OSCARPART — Makefile
# Usage: make <target>
# ============================================================

.PHONY: help dev prod stop logs setup-admin db-backup db-restore \
        build clean install lint typecheck

# ── Default: show help ───────────────────────────────────────
help:
	@echo ""
	@echo "OSCARPART Platform — Available Commands"
	@echo "======================================="
	@echo ""
	@echo "  Development:"
	@echo "    make dev           Start all services (hot reload)"
	@echo "    make dev-db        Start only database + redis"
	@echo "    make stop          Stop all running containers"
	@echo "    make logs          Tail backend logs"
	@echo ""
	@echo "  Setup:"
	@echo "    make setup         First-time setup (copy .env, install deps)"
	@echo "    make setup-admin   Create superadmin account"
	@echo "    make db-seed       Run all database seeds"
	@echo "    make install       Install all npm dependencies"
	@echo ""
	@echo "  Production:"
	@echo "    make prod          Build and start production containers"
	@echo "    make prod-build    Build production Docker images"
	@echo "    make db-backup     Backup PostgreSQL to ./backup/"
	@echo ""
	@echo "  Quality:"
	@echo "    make typecheck     Run TypeScript type checking"
	@echo "    make lint          Run ESLint"
	@echo ""

# ── Development ──────────────────────────────────────────────
dev:
	docker compose -f docker-compose.dev.yml up

dev-db:
	docker compose -f docker-compose.dev.yml up postgres redis -d
	@echo "✅ Database running on localhost:5432"
	@echo "   Redis running on localhost:6379"
	@echo ""
	@echo "Start backend: cd backend && npm run dev"
	@echo "Start frontend: cd frontend && npm run dev"

stop:
	docker compose -f docker-compose.dev.yml down
	docker compose down

logs:
	docker compose -f docker-compose.dev.yml logs -f backend

logs-all:
	docker compose -f docker-compose.dev.yml logs -f

# ── Setup ────────────────────────────────────────────────────
setup:
	@test -f backend/.env || (cp backend/.env.example backend/.env && echo "✅ Created backend/.env — edit it with your values")
	@$(MAKE) install
	@echo ""
	@echo "Next steps:"
	@echo "  1. Edit backend/.env with your DB_PASSWORD, JWT secrets, etc."
	@echo "  2. make dev-db"
	@echo "  3. make setup-admin"
	@echo "  4. cd backend && npm run dev"

install:
	cd backend  && npm install
	cd frontend && npm install

setup-admin:
	cd backend && npm run setup-admin

db-seed:
	cd backend && npm run db:seed

# ── Production ───────────────────────────────────────────────
prod:
	docker compose up -d --build

prod-build:
	docker compose build

db-backup:
	@mkdir -p backup
	docker exec oscarpart_postgres pg_dump -U oscarpart_user oscarpart \
	  | gzip > backup/oscarpart_$$(date +%Y%m%d_%H%M%S).sql.gz
	@echo "✅ Backup saved to backup/"

db-restore:
	@test -n "$(FILE)" || (echo "Usage: make db-restore FILE=backup/oscarpart_YYYYMMDD.sql.gz" && exit 1)
	gunzip -c $(FILE) | docker exec -i oscarpart_postgres psql -U oscarpart_user oscarpart

# ── Quality ──────────────────────────────────────────────────
typecheck:
	cd backend && npx tsc --noEmit
	@echo "✅ Backend TypeScript: OK"

lint:
	cd backend  && npx eslint src --ext .ts || true
	cd frontend && npx next lint || true

clean:
	cd backend  && rm -rf dist node_modules
	cd frontend && rm -rf .next node_modules
	docker compose down -v
