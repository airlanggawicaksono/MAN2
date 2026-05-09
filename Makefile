.PHONY: help setup \
        dev-up dev-down dev-reset-seed dev-nuke-seed dev-backend dev-frontend \
        prod-up prod-down clean-prod \
        lint lint-be lint-fe \
        db-up db-down db-shell db-reset db-reset-hard \
        seed-admins import-students \
        logs status clean

-include .env.dev
-include .env.prod
export

DEV  = docker compose --env-file .env.dev
PROD = docker compose --env-file .env.prod -f docker-compose.yml

# ── Help ─────────────────────────────────────────────────────────────────────

help:
	@echo "Simandaya Web"
	@echo "============="
	@echo ""
	@echo "Dev  (.env.dev):"
	@echo "  make dev-up         Start all services in background"
	@echo "  make dev-down       Stop all services"
	@echo "  make dev-reset-seed Reset PostgreSQL volume only, restart services, and seed admins"
	@echo "  make dev-nuke-seed  Down + prune Docker cache + remove volumes + seed admins"
	@echo "  make dev-backend    Start backend only (background)"
	@echo "  make dev-frontend   Start frontend only (background)"
	@echo ""
	@echo "Prod  (.env.prod):"
	@echo "  make prod-up        Build frontend + start all services in background"
	@echo "  make prod-down      Stop all services"
	@echo "  make clean-prod     Down + remove all prod volumes"
	@echo ""
	@echo "Database:"
	@echo "  make db-up          Start only the database"
	@echo "  make db-down        Stop only the database"
	@echo "  make db-shell       Open PostgreSQL shell"
	@echo "  make db-reset       Reset database (deletes all data)"
	@echo "  make db-reset-hard  Reset database without prompt (FORCE)"
	@echo ""
	@echo "Scripts:"
	@echo "  make seed-admins              Seed admin accounts"
	@echo "  make seed-demo                Seed demo students + desktop settings"
	@echo "  make seed-all                 Seed admins + demo students"
	@echo "  make import-students FILE=x   Import students from xlsx"
	@echo ""
	@echo "Lint:"
	@echo "  make lint           Run backend ruff + frontend tsc --noEmit"
	@echo "  make lint-be        Backend ruff check (auto-installs ruff if missing)"
	@echo "  make lint-fe        Frontend tsc --noEmit"
	@echo ""
	@echo "Other:"
	@echo "  make logs           Stream logs for all running services"
	@echo "  make status         Show container status"
	@echo "  make clean          Remove containers and volumes"
	@echo "  make setup          Create .env files from examples"
	@echo ""
	@echo "Ports:"
	@echo "  Frontend:  http://localhost:${FRONTEND_EXTERNAL_PORT}  (or port 80 via nginx in prod)"
	@echo "  Backend:   http://localhost:${BACKEND_EXTERNAL_PORT}"
	@echo "  Database:  localhost:${POSTGRES_EXTERNAL_PORT}"

# ── Setup ────────────────────────────────────────────────────────────────────

setup:
	@if [ ! -f .env.dev ]; then cp .env.dev.example .env.dev && echo "Created .env.dev"; else echo ".env.dev already exists"; fi
	@if [ ! -f .env.prod ]; then cp .env.prod.example .env.prod && echo "Created .env.prod"; else echo ".env.prod already exists"; fi

# ── Dev ───────────────────────────────────────────────────────────────────────

dev-up:
	$(DEV) up -d

dev-down:
	$(DEV) stop

dev-reset-seed:
	@echo "Resetting database volumes, restarting services and seeding demo data..."
	$(DEV) down -v
	$(DEV) up -d
	@timeout /t 10 /nobreak >nul
	$(DEV) exec backend python scripts/seed_admins.py
	$(DEV) exec backend python scripts/seed_demo.py
	@echo "Reset and seed complete"

dev-nuke-seed:
	@echo "Nuking dev Docker state and seeding admins..."
	$(DEV) down -v --remove-orphans
	docker builder prune -af
	docker system prune -af --volumes
	$(DEV) up -d
	@timeout /t 12 /nobreak >nul
	$(DEV) exec backend python scripts/seed_admins.py
	$(DEV) exec backend python scripts/seed_demo.py
	@echo "Nuke + seed complete"

dev-backend:
	$(DEV) up -d backend

dev-frontend:
	$(DEV) up -d frontend

# ── Prod ──────────────────────────────────────────────────────────────────────

prod-up:
	$(PROD) up -d --build

prod-down:
	$(PROD) stop

clean-prod:
	@echo "Nuking prod containers + volumes..."
	$(PROD) down -v --remove-orphans
	@echo "Prod cleaned"

# ── Lint ─────────────────────────────────────────────────────────────────────

lint: lint-be lint-fe

lint-be:
	@echo "Backend ruff check..."
	$(DEV) exec backend sh -c "command -v ruff >/dev/null 2>&1 || pip install --quiet ruff; ruff check ."

lint-fe:
	@echo "Frontend tsc --noEmit..."
	$(DEV) exec frontend sh -c "pnpm tsc --noEmit"

# ── Database ─────────────────────────────────────────────────────────────────

db-up:
	$(DEV) up -d postgres-db
	@timeout /t 3 /nobreak >nul
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

seed-demo:
	$(DEV) exec backend python scripts/seed_demo.py

seed-academic-demo:
	@echo "No academic demo seed script yet."

seed-all: seed-admins seed-demo

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
