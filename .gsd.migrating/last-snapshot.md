# GSD context snapshot (2026-06-21T03:40:01.857Z)

## Active context
Active: M001 / S06 / T02 - Create GitHub Actions CI workflow for quality gates

## Top project memories
- [MEM009] (architecture) Prisma schema.prisma is single source of truth; SQLAlchemy uses automap_base() reflection, not declarative models. Python worker re-reflects schema on restart after Prisma migrations.
- [MEM014] (gotcha) S01 summary describes files (apps/web, docker-compose.yml, package.json) that don't actually exist in the repo. Current state has only apps/worker with FastAPI. Plan S06 CI/CD for actual code, not S01 summary claims. Web app CI/CD jobs will be added when apps/web is created later.
- [MEM001] (architecture) Организация монорепозитория Chose: Feature-sliced структура внутри apps/web. Rationale: Модули пересекаются по данным — нужна гибкость между автономией и совместным использованием кода.
- [MEM002] (architecture) Docker Compose стратегия Chose: Всё в Docker с volume mounting. Rationale: Environment parity как в проде HMR работает через volumes одна команда запуска для всех окружений.
- [MEM003] (architecture) Deploy стратегия Chose: Coolify для autodeploy на VPS. Rationale: Автодеплой из Git UI для мониторинга SSL из коробки сэкономит время при разработке от 0 до продакшена.
- [MEM004] (architecture) Tech stack Chose: Next.js 16 React 19 Python 3.12 FastAPI PostgreSQL 16 Prisma 6 RabbitMQ. Rationale: По спецификации docs tech stack md промышленные стеки с хорошей экосистемой.
