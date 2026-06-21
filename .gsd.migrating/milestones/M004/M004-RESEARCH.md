# Research: Milestone M004 - Projects Module

## Summary

The Projects module (Milestone M004) requires implementing a project management system with Gantt timelines, stage-based workflow tracking, and production monitoring. The database schema for `Project`, `ProjectStage`, and `ProjectMember` already exists in `prisma/schema.prisma`. However, the `Production` model does not exist and must be created. The frontend needs to implement CRUD operations, a Gantt timeline using vis-timeline, file upload capabilities for project attachments, and integration with existing Deals/Contracts modules.

## Recommendation

Reuse the established Repository and API client patterns from the Deals module (`DealRepository`, `DealApiClient`) for consistency. Install `vis-timeline` for Gantt chart rendering rather than building a custom timeline. Create the missing `Production` schema model with proper stage dependencies and cascade closure logic. Implement file upload using AWS SDK for MinIO (S3-compatible storage already referenced in `.env.example`). Build the UI following existing patterns: KanbanBoard for drag-drop stages, modal dialogs for create/edit, and timeline components for history.

## Implementation Landscape

### Key Files

| File | Purpose | Pattern to Reuse |
|------|---------|------------------|
| `apps/web/src/lib/db/deals.ts` | Repository pattern reference | DealRepository → ProjectRepository |
| `apps/web/src/lib/api/deals.ts` | API client pattern reference | DealApiClient → ProjectApiClient |
| `apps/web/src/components/deals/kanban-board.tsx` | Drag-drop UI pattern | @dnd-kit/core for stage management |
| `apps/web/src/components/deals/create-deal-modal.tsx` | Modal form pattern | CreateProjectModal |
| `apps/web/src/components/deals/deal-history-timeline.tsx` | Timeline component pattern | ProjectStage timeline |
| `apps/web/prisma/schema.prisma` | Database schema | Add Production model |
| `apps/web/package.json` | Dependencies | Add vis-timeline, @aws-sdk/client-s3 |

### Build Order

1. **Schema**: Add `Production` model to `schema.prisma`, run migration
2. **Backend Repository**: Create `ProjectRepository` in `src/lib/db/projects.ts`
3. **Backend API**: Create `ProjectApiClient` in `src/lib/api/projects.ts`
4. **API Routes**: Add project CRUD endpoints in `src/app/api/projects/`
5. **Frontend Types**: Add `ProjectData`, `ProjectStageData` to `src/lib/api/types.ts`
6. **List Page**: Create `src/app/projects/page.tsx` with stage Kanban board
7. **Detail Page**: Create `src/app/projects/[id]/page.tsx` with Gantt timeline
8. **Create Modal**: Create `src/components/projects/create-project-modal.tsx`
9. **Gantt Component**: Create `src/components/projects/project-gantt.tsx` with vis-timeline
10. **File Upload**: Create file upload component, integrate with MinIO

### Verification Approach

- Unit tests for `ProjectRepository` methods (CRUD, softDelete, count)
- API integration tests for project endpoints
- E2E test: create project → move through stages → add production record → close project
- Visual test: Gantt timeline renders stages with correct dates
- File upload test: attach document to project, verify MinIO storage

## Don't Hand-Roll

| Feature | Use Existing |
|---------|--------------|
| Gantt timeline | vis-timeline library |
| Drag-drop stages | @dnd-kit/core (already in deals) |
| File storage | AWS SDK for MinIO |
| Date formatting | Intl.DateTimeFormat |
| UUID generation | crypto.randomUUID() |
| Modal dialogs | shadcn/ui Dialog component |

## Constraints

- Prisma 6.6.0 locked (check package.json)
- SQLite for development, PostgreSQL for production
- Next.js 16, React 19
- TypeScript strict mode
- Soft-delete pattern (deletedAt field)
- Russian language UI (existing Deals UI uses Russian labels)

## Common Pitfalls

1. **Production stage dependencies**: Production records must reference valid ProjectStage IDs. Verify stage exists before creating production.
2. **Gantt date conflicts**: Stage `endDate` must be after `startDate`. Validate in UI and API.
3. **Cascade close race conditions**: Closing a project should auto-close all open Production records. Use transaction with proper ordering.
4. **Member unique constraint**: ProjectMember has `@@unique([projectId, userId])`. Handle duplicate member additions gracefully.
5. **File upload size limits**: Configure Next.js API body size limit for large files.

## Open Risks

- **File upload complexity**: MinIO integration may require additional configuration (credentials, bucket policies)
- **Gantt interactivity**: vis-timeline drag-drop for date editing needs thorough testing
- **Stage synchronization**: Kanban board must sync with Gantt timeline when stages change
- **Production deletion cascade**: Verify soft-delete behavior for Production when Project is deleted

## Skills Discovered

- No vis-timeline skill found in system
- No specialized skills for Projects module
- Will implement from scratch using library documentation

## Sources

- Existing codebase patterns: DealRepository, DealApiClient, KanbanBoard, CreateDealModal
- Prisma schema: Project, ProjectStage, ProjectMember models
- Package dependencies: @dnd-kit/core, @prisma/client 6.6.0, next 16, react 19
- Environment configuration: MinIO/S3 references in .env.example
