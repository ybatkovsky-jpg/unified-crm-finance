# M001: Инфраструктура и модель данных

**Vision:** Создать работающий каркас приложения монорепозиторий Docker Compose Prisma схема NextAuth login базовый UI CI CD

## Success Criteria

- docker compose up поднимает все сервисы без ошибок
- api health на web и worker отвечает 200 с status UP
- Prisma миграции применены, npx prisma studio работает
- Login flow работает login submit redirect
- CI/CD проходит GitHub Actions зелёный на main ветке
- ADR-01 и ADR-02 записаны

## Slices

- [x] **S01: S01** `risk:medium` `depends:[]`
  > After this: docker compose up поднимает все сервисы, health на web и worker отвечает 200

- [x] **S02: S02** `risk:high` `depends:[]`
  > After this: npx prisma migrate dev проходит, npx prisma studio показывает схему

- [x] **S03: S03** `risk:medium` `depends:[]`
  > After this: Страница login рендерится, login flow работает

- [x] **S04: S04** `risk:low` `depends:[]`
  > After this: Layout с sidebar header рендерится после логина

- [x] **S05: S05** `risk:high` `depends:[]`
  > After this: health отвечает 200, RabbitMQ consumer подключён

- [x] **S06: S06** `risk:low` `depends:[]`
  > After this: GitHub Actions passes на push

## Boundary Map

### S01 → S02, S03, S04, S05, S06

Produces:
- Docker Compose с db, rabbitmq, minio, web, worker сервисами
- npm workspaces структура (apps/web, apps/worker, packages/*)
- Dockerfile для web и worker
- ADR-01 (гибридная архитектура)

Consumes:
- nothing (first slice)

### S02 → All subsequent

Produces:
- Prisma schema.prisma с 42 сущностями
- Prisma client с TypeScript типами
- Миграции в migrations/
- ADR-02 (модель данных)

Consumes:
- S01 docker compose с db

### S03 → S04

Produces:
- login page и form
- NextAuth configuration
- JWT helpers (api auth endpoints)
- Auth middleware для protected routes

Consumes:
- S01 docker compose, S02 Prisma User model

### S04 → All UI slices

Produces:
- Layout component (sidebar header footer)
- shadcn/ui setup
- Theme provider
- Error boundaries

Consumes:
- S03 auth middleware

### S05 → All background processing

Produces:
- FastAPI application structure
- health endpoints
- RabbitMQ consumer skeleton
- SQLAlchemy setup

Consumes:
- S01 docker compose с db и rabbitmq, S02 Prisma schema

### S06 → Ongoing

Produces:
- GitHub Actions workflow
- Lint, typecheck, test configs
- Coolify autodeploy setup

Consumes:
- All slices (checks quality on every push)
