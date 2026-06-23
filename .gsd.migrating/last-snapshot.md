# GSD context snapshot (2026-06-23T05:55:01.160Z)

## Top project memories
- [MEM019] (gotcha) Prisma 7.x breaks Prisma 6.x schema format: datasource `url` property moved to prisma.config.ts. Task specified Prisma 6.x, so locked apps/web to Prisma 6.6.0 to avoid breaking changes.
- [MEM069] (gotcha) Project.id requires manual UUID generation via randomUUID() - no @default in schema. Project.updatedAt must be manually set on update - no @updatedAt attribute. Same pattern as Deal, Contact, and other existing models.
- [MEM071] (pattern) Next.js API routes use App Router: route.ts files export async GET, POST, PATCH, DELETE functions. Collection endpoints at /api/resource/, single resource at /api/resource/[id]/route.ts. Returns NextResponse.json({ data: result }) for success, { error, message } for errors.
- [MEM009] (architecture) Prisma schema.prisma is single source of truth; SQLAlchemy uses automap_base() reflection, not declarative models. Python worker re-reflects schema on restart after Prisma migrations.
- [MEM014] (gotcha) S01 summary describes files (apps/web, docker-compose.yml, package.json) that don't actually exist in the repo. Current state has only apps/worker with FastAPI. Plan S06 CI/CD for actual code, not S01 summary claims. Web app CI/CD jobs will be added when apps/web is created later.
- [MEM018] (architecture) Using SQLite for development instead of PostgreSQL due to Docker Desktop unavailable. Schema datasource is sqlite (not postgresql). This is a temporary dev-only setup; production will use PostgreSQL.

## Recent gsd_exec runs
- [7e164858-d62a-428f-8329-b5d4ef1172a9] bash exit:1 — Verify FileEntityData exists in types.ts
