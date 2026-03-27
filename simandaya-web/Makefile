.PHONY: help setup \
        dev-up dev-down dev-reset-seed dev-nuke-seed dev-backend dev-frontend \
        prod-build prod-up prod-down \
        db-up db-down db-shell db-reset \
        seed-admins seed-academic-demo seed-all import-students \
        logs status clean

include .env
export

DEV  = docker compose --env-file .env
PROD = docker compose --env-file .env.prod

# ── Help ─────────────────────────────────────────────────────────────────────

help:
	@echo "Simandaya Web"
	@echo "============="
	@echo ""
	@echo "Dev  (.env):"
	@echo "  make dev-up         Start all services in background"
	@echo "  make dev-down       Stop all services"
	@echo "  make dev-reset-seed Reset volumes, restart dev, and seed admins"
	@echo "  make dev-nuke-seed  Down + prune Docker cache + remove volumes + seed admins"
	@echo "  make dev-backend    Start backend only (background)"
	@echo "  make dev-frontend   Start frontend only (background)"
	@echo ""
	@echo "Prod  (.env.prod):"
	@echo "  make prod-build     Build frontend (lint + type check + compile)"
	@echo "  make prod-up        Start all services in background"
	@echo "  make prod-down      Stop all services"
	@echo ""
	@echo "Database:"
	@echo "  make db-up          Start only the database"
	@echo "  make db-down        Stop only the database"
	@echo "  make db-shell       Open PostgreSQL shell"
	@echo "  make db-reset       Reset database (deletes all data)"
	@echo "  make db-reset-hard  Reset database without prompt (FORCE)"
	@echo ""
	@echo "Scripts:"
	@echo "  make seed-admins              Seed admin accounts (admin1-3)"
	@echo "  make seed-academic-demo       Seed structural+akademik+jadwal+siswa_kelas demo data"
	@echo "  make seed-all                 Seed admins then seed academic demo data"
	@echo "  make import-students FILE=x   Import students from xlsx"
	@echo ""
	@echo "Other:"
	@echo "  make logs           Stream logs for all running services"
	@echo "  make status         Show container status"
	@echo "  make clean          Remove containers and volumes"
	@echo "  make setup          Create .env files from examples"
	@echo ""
	@echo "Ports:"
	@echo "  Frontend:  http://localhost:${FRONTEND_EXTERNAL_PORT}"
	@echo "  Backend:   http://localhost:${BACKEND_EXTERNAL_PORT}/docs"
	@echo "  Database:  localhost:${POSTGRES_EXTERNAL_PORT}"

# ── Setup ────────────────────────────────────────────────────────────────────

setup:
	@if [ ! -f .env ]; then cp .env.example .env && echo "Created .env"; else echo ".env already exists"; fi
	@if [ ! -f .env.prod ]; then cp .env.prod.example .env.prod && echo "Created .env.prod"; else echo ".env.prod already exists"; fi

# ── Dev ───────────────────────────────────────────────────────────────────────

dev-up:
	$(DEV) up -d

dev-down:
	$(DEV) stop

dev-reset-seed:
	@echo "Resetting dev environment and seeding demo data..."
	$(DEV) down -v
	$(DEV) up -d
	@sleep 10
	$(DEV) exec backend python scripts/seed_admins.py
	$(DEV) exec backend python scripts/seed_academic_demo.py
	@echo "Reset and demo seed complete"

dev-nuke-seed:
	@echo "Nuking dev Docker state and seeding demo data..."
	$(DEV) down -v --remove-orphans
	docker builder prune -af
	docker system prune -af --volumes
	$(DEV) up -d
	@sleep 12
	$(DEV) exec backend python scripts/seed_admins.py
	$(DEV) exec backend python scripts/seed_academic_demo.py
	@echo "Nuke + demo seed complete"

dev-backend:
	$(DEV) up -d backend

dev-frontend:
	$(DEV) up -d frontend

# ── Prod ──────────────────────────────────────────────────────────────────────

prod-build:
	@echo "Building frontend (runs lint + type check)..."
	$(PROD) run --rm frontend sh -c "pnpm install && pnpm build"

prod-up:
	$(PROD) up -d

prod-down:
	$(PROD) stop

# ── Database ─────────────────────────────────────────────────────────────────

db-up:
	$(DEV) up -d postgres-db
	@sleep 3
	@$(DEV) exec postgres-db pg_isready -U ${DB_USER}

db-down:
	$(DEV) stop postgres-db

db-shell:
	$(DEV) exec postgres-db psql -U ${DB_USER} -d ${DB_NAME}

db-reset:
	@echo "WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(DEV) down -v; \
		$(DEV) up -d postgres-db; \
		echo "Database reset complete"; \
	fi

db-reset-hard:
	@echo "Hard resetting database (no prompt)..."
	$(DEV) down -v
	$(DEV) up -d postgres-db
	@echo "Database reset complete"

# ── Scripts ──────────────────────────────────────────────────────────────────

seed-admins:
	$(DEV) exec backend python scripts/seed_admins.py

seed-academic-demo:
	$(DEV) exec backend python scripts/seed_academic_demo.py

seed-all:
	$(DEV) exec backend python scripts/seed_admins.py
	$(DEV) exec backend python scripts/seed_academic_demo.py

import-students:
	@if [ -z "$(FILE)" ]; then echo "Usage: make import-students FILE=\"/path/to/file.xlsx\""; exit 1; fi
	$(DEV) exec backend python scripts/import_students.py "$(FILE)"

# ── Other ────────────────────────────────────────────────────────────────────

logs:
	$(DEV) logs -f

status:
	$(DEV) ps

clean:
	$(DEV) down -v
