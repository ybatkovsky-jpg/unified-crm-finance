# Unified CRM Finance — Dev / CI commands
#
# Usage: `make <target>`

.PHONY: help install dev build lint typecheck test docker-up docker-down db-migrate db-seed worker-dev clean

help: ## Показать список доступных команд
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Установить зависимости (npm + pip)
	npm install
	cd apps/worker && pip install -r requirements.txt

dev: ## Запустить Next.js в dev-режиме
	npm run dev

build: ## Production-сборка Next.js
	npm run build

lint: ## Запустить ESLint
	npm run lint

typecheck: ## Проверка типов TypeScript
	npm run typecheck

test: ## Запустить все unit + integration тесты
	npm run test:unit
	npm run test:integration

test:unit: ## Только unit-тесты
	npm run test:unit

test:e2e: ## End-to-end тесты (нужно поднять docker compose)
	npm run test:e2e

docker-up: ## Поднять всё окружение через docker compose
	docker compose up -d

docker-down: ## Остановить окружение
	docker compose down

docker-logs: ## Логи всех сервисов (Ctrl+C для выхода)
	docker compose logs -f

docker-rebuild: ## Пересобрать и поднять
	docker compose up -d --build

db-migrate: ## Применить миграции Prisma
	npm run db:migrate

db-generate: ## Регенерировать Prisma client
	npm run db:generate

db-seed: ## Заполнить БД тестовыми данными
	npm run db:seed

db-studio: ## Открыть Prisma Studio (GUI для БД)
	cd apps/web && npx prisma studio

worker-dev: ## Запустить Python FastAPI в dev-режиме
	cd apps/worker && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

worker-worker: ## Запустить Celery worker
	cd apps/worker && celery -A app.celery_app worker -l info

worker-beat: ## Запустить Celery beat (расписания)
	cd apps/worker && celery -A app.celery_app beat -l info

clean: ## Удалить node_modules, .next, __pycache__
	rm -rf node_modules apps/web/node_modules apps/web/.next
	rm -rf apps/worker/__pycache__ apps/worker/app/__pycache__
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
