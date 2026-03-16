# Simandaya Web - Windows Make equivalent
# Usage: .\make.ps1 <command> [args]
# Example: .\make.ps1 dev-up

param(
    [Parameter(Position=0)]
    [string]$Command = "help",

    [Parameter(Position=1)]
    [string]$FILE = ""
)

# Load .env file if it exists
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $val, "Process")
        }
    }
}

$DEV = "docker compose --env-file .env"
$PROD = "docker compose --env-file .env.prod"

function Invoke-Dev { param([string]$cmd) Invoke-Expression "$DEV $cmd" }
function Invoke-Prod { param([string]$cmd) Invoke-Expression "$PROD $cmd" }

switch ($Command) {

    # ── Help ──────────────────────────────────────────────────────────────
    "help" {
        $fe = $env:FRONTEND_EXTERNAL_PORT; if (!$fe) { $fe = "4923" }
        $be = $env:BACKEND_EXTERNAL_PORT;  if (!$be) { $be = "2385" }
        $db = $env:POSTGRES_EXTERNAL_PORT; if (!$db) { $db = "4623" }

        Write-Host @"
Simandaya Web (Windows)
=======================

Dev  (.env):
  .\make.ps1 dev-up         Start all services in background
  .\make.ps1 dev-down       Stop all services
  .\make.ps1 dev-reset-seed Reset volumes, restart dev, and run all seeds
  .\make.ps1 dev-backend    Start backend only (background)
  .\make.ps1 dev-frontend   Start frontend only (background)

Prod  (.env.prod):
  .\make.ps1 prod-build     Build frontend (lint + type check + compile)
  .\make.ps1 prod-up        Start all services in background
  .\make.ps1 prod-down      Stop all services

Database:
  .\make.ps1 db-up          Start only the database
  .\make.ps1 db-down        Stop only the database
  .\make.ps1 db-shell       Open PostgreSQL shell
  .\make.ps1 db-reset       Reset database (deletes all data)
  .\make.ps1 db-reset-hard  Reset database without prompt (FORCE)

Scripts:
  .\make.ps1 seed-admins              Seed admin accounts (admin1-3)
  .\make.ps1 seed-absensi             Seed attendance + izin keluar data
  .\make.ps1 import-students FILE=x   Import students from xlsx

Other:
  .\make.ps1 logs           Stream logs for all running services
  .\make.ps1 status         Show container status
  .\make.ps1 clean          Remove containers and volumes
  .\make.ps1 setup          Create .env files from examples

Ports:
  Frontend:  http://localhost:$fe
  Backend:   http://localhost:${be}/docs
  Database:  localhost:$db
"@
    }

    # ── Setup ─────────────────────────────────────────────────────────────
    "setup" {
        $envPath = Join-Path $PSScriptRoot ".env"
        $envProdPath = Join-Path $PSScriptRoot ".env.prod"
        if (!(Test-Path $envPath)) {
            Copy-Item (Join-Path $PSScriptRoot ".env.example") $envPath
            Write-Host "Created .env"
        } else { Write-Host ".env already exists" }
        if (!(Test-Path $envProdPath)) {
            Copy-Item (Join-Path $PSScriptRoot ".env.prod.example") $envProdPath
            Write-Host "Created .env.prod"
        } else { Write-Host ".env.prod already exists" }
    }

    # ── Dev ───────────────────────────────────────────────────────────────
    "dev-up"       { Invoke-Dev "up -d" }
    "dev-down"     { Invoke-Dev "stop" }
    "dev-reset-seed" {
        Write-Host "Resetting dev environment and seeding..."
        Invoke-Dev "down -v"
        Invoke-Dev "up -d"
        Write-Host "Waiting for services to initialize (10s)..."
        Start-Sleep -Seconds 10
        Write-Host "Seeding admins..."
        Invoke-Dev "exec backend python scripts/seed_admins.py"
        Write-Host "Seeding absensi..."
        Invoke-Dev "exec backend python scripts/seed_absensi.py"
        Write-Host "Reset and Seed complete!"
    }
    "dev-backend"  { Invoke-Dev "up -d backend" }
    "dev-frontend" { Invoke-Dev "up -d frontend" }

    # ── Prod ──────────────────────────────────────────────────────────────
    "prod-build" {
        Write-Host "Building frontend (runs lint + type check)..."
        Invoke-Prod 'run --rm frontend sh -c "pnpm install && pnpm build"'
    }
    "prod-up"   { Invoke-Prod "up -d" }
    "prod-down" { Invoke-Prod "stop" }

    # ── Database ──────────────────────────────────────────────────────────
    "db-up" {
        Invoke-Dev "up -d postgres-db"
        Start-Sleep -Seconds 3
        $user = $env:DB_USER; if (!$user) { $user = "simandaya" }
        Invoke-Dev "exec postgres-db pg_isready -U $user"
    }
    "db-down"  { Invoke-Dev "stop postgres-db" }
    "db-shell" {
        $user = $env:DB_USER; if (!$user) { $user = "simandaya" }
        $name = $env:DB_NAME; if (!$name) { $name = "simandaya_db" }
        Invoke-Dev "exec postgres-db psql -U $user -d $name"
    }
    "db-reset" {
        Write-Host "WARNING: This will delete all data!"
        $reply = Read-Host "Are you sure? [y/N]"
        if ($reply -match '^[Yy]$') {
            Invoke-Dev "down -v"
            Invoke-Dev "up -d postgres-db"
            Write-Host "Database reset complete"
        }
    }
    "db-reset-hard" {
        Write-Host "Hard resetting database (no prompt)..."
        Invoke-Dev "down -v"
        Invoke-Dev "up -d postgres-db"
        Write-Host "Database reset complete"
    }

    # ── Scripts ───────────────────────────────────────────────────────────
    "seed-admins"  { Invoke-Dev "exec backend python scripts/seed_admins.py" }
    "seed-absensi" { Invoke-Dev "exec backend python scripts/seed_absensi.py" }
    "import-students" {
        if (!$FILE) {
            Write-Host 'Usage: .\make.ps1 import-students "path/to/file.xlsx"'
            exit 1
        }
        Invoke-Dev "exec backend python scripts/import_students.py `"$FILE`""
    }

    # ── Other ─────────────────────────────────────────────────────────────
    "logs"   { Invoke-Dev "logs -f" }
    "status" { Invoke-Dev "ps" }
    "clean"  { Invoke-Dev "down -v" }

    default {
        Write-Host "Unknown command: $Command"
        Write-Host "Run '.\make.ps1 help' to see available commands."
    }
}
