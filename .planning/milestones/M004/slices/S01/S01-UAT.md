# S01: S01: Create Production model schema and Repository layer — UAT

**Milestone:** M004
**Written:** 2026-06-21T22:48:42.326Z

## UAT: ProductionRepository

### Test Production CRUD
1. Create a production:
   - Visit API or use repository directly
   - Create production with status='planning', projectId linking to test project
   - Verify production is created with auto-generated UUID and progress=0

2. Find productions:
   - Find all productions (should exclude soft-deleted)
   - Find by project ID
   - Find by status
   - Verify results are correct

3. Update production:
   - Update status to 'active'
   - Update progress to 50
   - Verify updatedAt is updated

4. Soft-delete production:
   - Soft-delete a production
   - Verify it's excluded from findMany and findUnique
   - Verify record still exists in DB with deletedAt set

### Test ProductionStage Management
1. Create stages:
   - Create stages for a production (cutting, assembly, finishing)
   - Set order (1, 2, 3)
   - Verify stages are ordered by 'order' asc

2. Move stage status:
   - Move stage to 'in-progress'
   - Move stage to 'completed'
   - Verify completedAt is set automatically

3. Delete stage:
   - Delete a stage (hard delete)
   - Verify it's removed from DB
