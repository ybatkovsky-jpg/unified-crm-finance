# GSD context snapshot (2026-06-21T08:41:40.209Z)

## Active context
Active: M002 / S03 / T03 - Interaction API client + types

## Top project memories
- [MEM019] (gotcha) Prisma 7.x breaks Prisma 6.x schema format: datasource `url` property moved to prisma.config.ts. Task specified Prisma 6.x, so locked apps/web to Prisma 6.6.0 to avoid breaking changes.
- [MEM009] (architecture) Prisma schema.prisma is single source of truth; SQLAlchemy uses automap_base() reflection, not declarative models. Python worker re-reflects schema on restart after Prisma migrations.
- [MEM014] (gotcha) S01 summary describes files (apps/web, docker-compose.yml, package.json) that don't actually exist in the repo. Current state has only apps/worker with FastAPI. Plan S06 CI/CD for actual code, not S01 summary claims. Web app CI/CD jobs will be added when apps/web is created later.
- [MEM018] (architecture) Using SQLite for development instead of PostgreSQL due to Docker Desktop unavailable. Schema datasource is sqlite (not postgresql). This is a temporary dev-only setup; production will use PostgreSQL.
- [MEM020] (architecture) Contact model is unified (type=person|company) per spec docs, not separate Company/Contact models. SQLite doesn't support String[] arrays — use Json with @default("[]") for tags field.
- [MEM022] (gotcha) Prisma schema for Contact requires manual id (no @default) and updatedAt (no @updatedAt auto-update). The ContactRepository must generate UUID via randomUUID() and set updatedAt on create. Other models like User have same pattern - check schema before assuming auto-generated fields.

## Recent gsd_exec runs
- [ace8de23-bcf4-433c-85ad-890b861bf169] bash exit:1 — Verify next build succeeds for interaction API routes
