# GSD context snapshot (2026-06-21T04:14:07.202Z)

## Active context
Active: M001 / S02 / T03 - Verified schema contains all 13 models (Identity + Shared + CRM) with proper relations and indexes; implementation uses unified Contact model per specification

## Top project memories
- [MEM019] (gotcha) Prisma 7.x breaks Prisma 6.x schema format: datasource `url` property moved to prisma.config.ts. Task specified Prisma 6.x, so locked apps/web to Prisma 6.6.0 to avoid breaking changes.
- [MEM009] (architecture) Prisma schema.prisma is single source of truth; SQLAlchemy uses automap_base() reflection, not declarative models. Python worker re-reflects schema on restart after Prisma migrations.
- [MEM014] (gotcha) S01 summary describes files (apps/web, docker-compose.yml, package.json) that don't actually exist in the repo. Current state has only apps/worker with FastAPI. Plan S06 CI/CD for actual code, not S01 summary claims. Web app CI/CD jobs will be added when apps/web is created later.
- [MEM018] (architecture) Using SQLite for development instead of PostgreSQL due to Docker Desktop unavailable. Schema datasource is sqlite (not postgresql). This is a temporary dev-only setup; production will use PostgreSQL.
- [MEM001] (architecture) Организация монорепозитория Chose: Feature-sliced структура внутри apps/web. Rationale: Модули пересекаются по данным — нужна гибкость между автономией и совместным использованием кода.
- [MEM002] (architecture) Docker Compose стратегия Chose: Всё в Docker с volume mounting. Rationale: Environment parity как в проде HMR работает через volumes одна команда запуска для всех окружений.
