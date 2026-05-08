.PHONY: help install run test clean lint format

help:
	@echo "Backend Commands"
	@echo "================"
	@echo ""
	@echo "  make install   - Create venv and install dependencies"
	@echo "  make run       - Run development server"
	@echo "  make test      - Run tests with pytest"
	@echo "  make lint      - Run linting (flake8, mypy)"
	@echo "  make format    - Format code (black, isort)"
	@echo "  make clean     - Remove venv and cache files"

install:
	@echo "Creating virtual environment..."
	python -m venv venv
	@echo "Installing dependencies..."
	. venv/bin/activate && pip install -r requirements.txt
	@echo "Installation complete!"

run:
	@echo "Starting backend server..."
	. venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 2385

test:
	@echo "Running tests..."
	. venv/bin/activate && pytest

lint:
	@echo "Running linters..."
	. venv/bin/activate && flake8 app/ || echo "Install flake8 for linting"
	. venv/bin/activate && mypy app/ || echo "Install mypy for type checking"

format:
	@echo "Formatting code..."
	. venv/bin/activate && black app/ || echo "Install black for formatting"
	. venv/bin/activate && isort app/ || echo "Install isort for import sorting"

clean:
	@echo "Cleaning up..."
	rm -rf venv __pycache__ .pytest_cache .mypy_cache
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	@echo "Cleanup complete!"
