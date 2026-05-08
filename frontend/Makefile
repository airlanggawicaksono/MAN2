.PHONY: help install dev build start test lint format clean

help:
	@echo "Frontend Commands"
	@echo "================="
	@echo ""
	@echo "  make install   - Install dependencies with pnpm"
	@echo "  make dev-frontend-up - Run development server with env vars"
	@echo "  make build           - Build for production"
	@echo "  make start           - Start production server"
	@echo "  make test            - Run tests"
	@echo "  make lint            - Run ESLint"
	@echo "  make format          - Format code with Prettier"
	@echo "  make clean           - Remove node_modules and build artifacts"

install:
	@echo "Installing dependencies..."
	pnpm install
	@echo "Installation complete!"

dev-frontend-up:
	@echo "Starting development server..."
	export $$(grep -v '^#' ../.env | xargs) && PORT=$$FRONTEND_EXTERNAL_PORT pnpm dev

build:
	@echo "Building for production..."
	pnpm build

start:
	@echo "Starting production server..."
	pnpm start

test:
	@echo "Running tests..."
	pnpm test

lint:
	@echo "Running ESLint..."
	pnpm lint || echo "Configure ESLint in package.json"

format:
	@echo "Formatting code..."
	pnpm exec prettier --write . || echo "Install prettier for formatting"

clean:
	@echo "Cleaning up..."
	rm -rf node_modules .next out
	@echo "Cleanup complete!"
