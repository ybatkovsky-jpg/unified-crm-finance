/**
 * ProductionRepository tests
 *
 * Uses tsx for test execution. Creates test fixtures in dev.db.
 * Tests all CRUD operations, stage transitions, soft-delete, and status workflows.
 *
 * Note: Production has 1:1 relation with Project via unique projectId.
 * Each production requires a separate project.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { productions } from './production.js';
import { prisma } from './prisma.js';

const TEST = 't03-';

// Helper to create a test project with production
async function createProjectWithProduction(suffix: string, productionStatus: string = 'planning') {
  const projectId = `${TEST}project-${suffix}`;
  const now = new Date();
  await prisma.project.create({
    data: {
      id: projectId,
      externalNumber: `${TEST}-ext-${suffix}`,
      name: `Test Project ${suffix}`,
      updatedAt: now,
    },
  });

  const production = await productions.create({
    projectId,
    status: productionStatus,
  });

  return { projectId, productionId: production.id };
}

describe('ProductionRepository', { concurrency: false }, () => {
  before(async () => {
    // Clean up leftover test data from previous runs
    await prisma.productionStage.deleteMany({ where: { productionId: { startsWith: TEST } } });
    await prisma.production.deleteMany({ where: { id: { startsWith: TEST } } });
    await prisma.project.deleteMany({ where: { id: { startsWith: TEST } } });
  });

  after(async () => {
    // Cascade delete: ProductionStage -> Production (onDelete: Cascade)
    await prisma.productionStage.deleteMany({ where: { productionId: { startsWith: TEST } } });
    await prisma.production.deleteMany({ where: { id: { startsWith: TEST } } });
    await prisma.project.deleteMany({ where: { id: { startsWith: TEST } } });
    await prisma.$disconnect();
  });

  let p1: { projectId: string; productionId: string };
  let p2: { projectId: string; productionId: string };
  let p3: { projectId: string; productionId: string };

  // ── Create ───────────────────────────────────────────────────────────────

  it('should create a production with auto-generated UUID', async () => {
    p1 = await createProjectWithProduction('01');

    assert.ok(p1.productionId, 'Production should have an ID');
    assert.strictEqual(p1.projectId, `${TEST}project-01`);

    const production = await productions.findUnique(p1.productionId);
    assert.ok(production, 'Production should be created');
    assert.strictEqual(production.status, 'planning');
    assert.strictEqual(production.progress, 0, 'Default progress should be 0');
    assert.strictEqual(production.deletedAt, null, 'New production should not be deleted');
  });

  it('should create a production with provided values overriding defaults', async () => {
    const projectId = `${TEST}project-custom`;
    const now = new Date();
    await prisma.project.create({
      data: {
        id: projectId,
        externalNumber: `${TEST}-ext-custom`,
        name: 'Custom Project',
        updatedAt: now,
      },
    });

    const plannedStart = new Date('2026-01-01');
    const plannedEnd = new Date('2026-12-31');
    const production = await productions.create({
      id: `${TEST}production-custom`,
      projectId,
      status: 'active',
      plannedStartDate: plannedStart,
      plannedEndDate: plannedEnd,
      progress: 25,
      notes: 'Custom notes',
    });

    assert.strictEqual(production.id, `${TEST}production-custom`);
    assert.strictEqual(production.status, 'active');
    assert.strictEqual(production.progress, 25);
    assert.strictEqual(production.notes, 'Custom notes');
  });

  // ── findMany ───────────────────────────────────────────────────────────

  it('should findMany returning all non-deleted productions', async () => {
    const list = await productions.findMany();
    assert.ok(Array.isArray(list));
    assert.ok(list.length >= 2, 'Should find at least the productions we created');
    for (const p of list) {
      assert.strictEqual(p.deletedAt, null, 'No soft-deleted productions in results');
    }
  });

  it('should findMany filtered by projectId', async () => {
    const list = await productions.findMany({ where: { projectId: p1.projectId } });
    assert.ok(list.length === 1);
    assert.strictEqual(list[0].projectId, p1.projectId);
  });

  it('should findMany filtered by status', async () => {
    p2 = await createProjectWithProduction('02', 'active');

    const list = await productions.findMany({ where: { status: 'active' } });
    assert.ok(list.length >= 1);
    for (const p of list) {
      assert.strictEqual(p.status, 'active');
    }
  });

  it('should exclude soft-deleted productions from findMany', async () => {
    await productions.softDelete(p1.productionId);
    const list = await productions.findMany();
    const ids = list.map(p => p.id);
    assert.ok(!ids.includes(p1.productionId), 'Soft-deleted production should be excluded from findMany');

    // Restore for further tests
    await prisma.production.update({ where: { id: p1.productionId }, data: { deletedAt: null } });
  });

  it('should support orderBy in findMany', async () => {
    const list = await productions.findMany({
      orderBy: { createdAt: 'desc' },
    });
    assert.ok(Array.isArray(list));
    // Verify ordering is descending
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1].createdAt.getTime();
      const curr = list[i].createdAt.getTime();
      assert.ok(prev >= curr, `Entry ${i - 1} should not be older than entry ${i} (descending order)`);
    }
  });

  it('should support pagination in findMany', async () => {
    const all = await productions.findMany({ orderBy: { createdAt: 'desc' } });
    const page = await productions.findMany({ take: 1, skip: 1, orderBy: { createdAt: 'desc' } });

    assert.ok(page.length <= 1, 'Should return at most 1 item with take: 1');
    if (all.length > 1) {
      assert.strictEqual(page[0].id, all[1].id, 'Should skip first item');
    }
  });

  // ── findUnique ───────────────────────────────────────────────────────────

  it('should findUnique by ID', async () => {
    const production = await productions.findUnique(p1.productionId);
    assert.ok(production, 'Should find existing production');
    assert.strictEqual(production.id, p1.productionId);
    assert.strictEqual(production.projectId, p1.projectId);
  });

  it('should return null for non-existent ID', async () => {
    const production = await productions.findUnique(`${TEST}nonexistent`);
    assert.strictEqual(production, null);
  });

  it('should return null for soft-deleted production', async () => {
    await productions.softDelete(p1.productionId);
    const production = await productions.findUnique(p1.productionId);
    assert.strictEqual(production, null, 'Soft-deleted production should return null');

    // Restore
    await prisma.production.update({ where: { id: p1.productionId }, data: { deletedAt: null } });
  });

  it('should findUnique with includes (ProductionStage, Project)', async () => {
    const production = await productions.findUnique(p1.productionId, {
      ProductionStage: true,
      Project: true,
    });
    assert.ok(production, 'Should find the production');
    assert.ok(production.Project, 'Project should be included');
    assert.strictEqual(production.Project.id, p1.projectId);
    assert.ok(Array.isArray(production.ProductionStage), 'ProductionStage should be included as array');
  });

  // ── findByProject ───────────────────────────────────────────────────────

  it('should findByProject returning productions for project ordered by createdAt desc', async () => {
    const results = await productions.findByProject(p1.projectId);
    assert.ok(results.length === 1);
    assert.strictEqual(results[0].projectId, p1.projectId);
    assert.strictEqual(results[0].deletedAt, null);
  });

  // ── findByStatus ───────────────────────────────────────────────────────

  it('should findByStatus returning productions with status ordered by createdAt desc', async () => {
    const results = await productions.findByStatus('active');
    assert.ok(results.length >= 1);
    for (const p of results) {
      assert.strictEqual(p.status, 'active');
      assert.strictEqual(p.deletedAt, null);
    }
  });

  // ── update ─────────────────────────────────────────────────────────────

  it('should update valid fields', async () => {
    const updated = await productions.update(p1.productionId, {
      status: 'in-production',
      progress: 50,
      notes: 'Updated notes',
    });
    assert.strictEqual(updated.status, 'in-production');
    assert.strictEqual(updated.progress, 50);
    assert.strictEqual(updated.notes, 'Updated notes');
  });

  it('should auto-update updatedAt on update', async () => {
    const before = await productions.findUnique(p1.productionId);
    await new Promise(r => setTimeout(r, 10)); // Small delay to ensure timestamp difference
    await productions.update(p1.productionId, { progress: 60 });
    const after = await productions.findUnique(p1.productionId);

    assert.ok(after!.updatedAt.getTime() > before!.updatedAt.getTime(), 'updatedAt should be updated');
  });

  it('should throw when updating non-existent production', async () => {
    await assert.rejects(
      () => productions.update(`${TEST}nonexistent`, { progress: 10 }),
      /Production with id .+ not found/,
      'Should throw descriptive error for non-existent production',
    );
  });

  it('should throw when updating soft-deleted production', async () => {
    const { projectId, productionId } = await createProjectWithProduction('update-soft-delete');
    await productions.softDelete(productionId);

    await assert.rejects(
      () => productions.update(productionId, { progress: 20 }),
      /Production with id .+ not found/,
    );
  });

  // ── softDelete ─────────────────────────────────────────────────────────

  it('should soft delete a production (sets deletedAt, excludes from queries)', async () => {
    const { projectId, productionId } = await createProjectWithProduction('soft-delete');

    const deleted = await productions.softDelete(productionId);
    assert.ok(deleted.deletedAt, 'deletedAt should be set');

    // Excluded from findUnique
    const notFound = await productions.findUnique(productionId);
    assert.strictEqual(notFound, null, 'Soft-deleted should not be found via findUnique');

    // Excluded from findMany
    const list = await productions.findMany();
    assert.ok(!list.find(p => p.id === productionId), 'Soft-deleted should not appear in findMany');

    // Still exists in DB
    const raw = await prisma.production.findUnique({ where: { id: productionId } });
    assert.ok(raw, 'Record should still exist in database');
    assert.ok(raw.deletedAt, 'Record should have deletedAt set');
  });

  it('should throw when soft-deleting already deleted production', async () => {
    const { projectId, productionId } = await createProjectWithProduction('double-delete');
    await productions.softDelete(productionId);

    await assert.rejects(
      () => productions.softDelete(productionId),
      /Production with id .+ not found/,
    );
  });

  // ── count ─────────────────────────────────────────────────────────────

  it('should count productions excluding soft-deleted', async () => {
    const before = await productions.count();

    const { projectId, productionId } = await createProjectWithProduction('count');
    assert.strictEqual(await productions.count(), before + 1, 'Count should increment after create');

    await productions.softDelete(productionId);
    assert.strictEqual(await productions.count(), before, 'Count should return to previous after soft-delete');
  });

  it('should count with where filter', async () => {
    const count = await productions.count({ projectId: p1.projectId });
    assert.strictEqual(count, 1, 'Should count productions for project');
    assert.strictEqual(typeof count, 'number');
  });

  // ── updateProgress ─────────────────────────────────────────────────────

  it('should update progress within valid range', async () => {
    const updated = await productions.updateProgress(p1.productionId, 75);
    assert.strictEqual(updated.progress, 75);
  });

  it('should throw when progress is below 0', async () => {
    await assert.rejects(
      () => productions.updateProgress(p1.productionId, -1),
      /Progress must be between 0 and 100/,
    );
  });

  it('should throw when progress is above 100', async () => {
    await assert.rejects(
      () => productions.updateProgress(p1.productionId, 101),
      /Progress must be between 0 and 100/,
    );
  });

  // ── start ───────────────────────────────────────────────────────────────

  it('should start production setting status to active and actualStartDate', async () => {
    const { projectId, productionId } = await createProjectWithProduction('start', 'planning');
    const before = new Date();

    const started = await productions.start(productionId);
    assert.strictEqual(started.status, 'active');
    assert.ok(started.actualStartDate, 'actualStartDate should be set');
    assert.ok(started.actualStartDate! >= before, 'actualStartDate should be current or later');
  });

  // ── complete ────────────────────────────────────────────────────────────

  it('should complete production setting status, progress to 100, and actualEndDate', async () => {
    const { projectId, productionId } = await createProjectWithProduction('complete', 'active');
    // Set initial progress to something other than 100
    await productions.update(productionId, { progress: 50 });
    const before = new Date();

    const completed = await productions.complete(productionId);
    assert.strictEqual(completed.status, 'completed');
    assert.strictEqual(completed.progress, 100, 'Progress should be set to 100');
    assert.ok(completed.actualEndDate, 'actualEndDate should be set');
    assert.ok(completed.actualEndDate! >= before, 'actualEndDate should be current or later');
  });

  // ── moveStatus ──────────────────────────────────────────────────────────

  it('should move production to a different status', async () => {
    const { projectId, productionId } = await createProjectWithProduction('move-status', 'planning');
    const moved = await productions.moveStatus(productionId, 'paused');
    assert.strictEqual(moved.status, 'paused');
  });

  // ────────────────────────────────────────────────────────────────────────
  // ProductionStage methods
  // ────────────────────────────────────────────────────────────────────────

  let stage1Id: string;
  let stage2Id: string;

  // ── createStage ───────────────────────────────────────────────────────

  it('should create a production stage with auto-generated UUID', async () => {
    p3 = await createProjectWithProduction('03');

    const stage = await productions.createStage({
      productionId: p3.productionId,
      code: 'cutting',
      name: 'Cutting',
      order: 1,
      status: 'pending',
    });

    assert.ok(stage, 'Stage should be created');
    assert.ok(stage.id, 'Stage should have an ID');
    assert.strictEqual(stage.productionId, p3.productionId);
    assert.strictEqual(stage.code, 'cutting');
    assert.strictEqual(stage.name, 'Cutting');
    assert.strictEqual(stage.order, 1);
    assert.strictEqual(stage.status, 'pending');
    stage1Id = stage.id;
  });

  it('should create stage with provided values', async () => {
    const stage = await productions.createStage({
      id: `${TEST}stage-custom`,
      productionId: p3.productionId,
      code: 'assembly',
      name: 'Assembly',
      order: 2,
      status: 'in-progress',
      notes: 'Custom stage notes',
    });

    assert.strictEqual(stage.id, `${TEST}stage-custom`);
    assert.strictEqual(stage.status, 'in-progress');
    assert.strictEqual(stage.notes, 'Custom stage notes');
    stage2Id = stage.id;
  });

  // ── findStages ─────────────────────────────────────────────────────────

  it('should findStages for production ordered by order asc', async () => {
    // Create stages in reverse order to test sorting
    await productions.createStage({
      productionId: p3.productionId,
      code: 'finishing',
      name: 'Finishing',
      order: 3,
      status: 'pending',
    });

    const stages = await productions.findStages(p3.productionId);
    assert.ok(Array.isArray(stages));
    assert.ok(stages.length >= 3, 'Should find at least the stages we created');

    // Verify ascending order by 'order' field
    for (let i = 1; i < stages.length; i++) {
      const prev = stages[i - 1].order;
      const curr = stages[i].order;
      assert.ok(prev <= curr, `Stage ${i - 1} order should not be greater than stage ${i}`);
    }
  });

  // ── findStage ───────────────────────────────────────────────────────────

  it('should findStage by ID', async () => {
    const stage = await productions.findStage(stage1Id);
    assert.ok(stage, 'Should find existing stage');
    assert.strictEqual(stage.id, stage1Id);
    assert.strictEqual(stage.code, 'cutting');
  });

  it('should return null for non-existent stage ID', async () => {
    const stage = await productions.findStage(`${TEST}nonexistent-stage`);
    assert.strictEqual(stage, null);
  });

  // ── findStagesByStatus ──────────────────────────────────────────────────

  it('should findStagesByStatus returning stages with status ordered by order asc', async () => {
    const stages = await productions.findStagesByStatus(p3.productionId, 'pending');
    assert.ok(Array.isArray(stages));
    for (const s of stages) {
      assert.strictEqual(s.productionId, p3.productionId);
      assert.strictEqual(s.status, 'pending');
    }
  });

  it('should return empty array for status with no stages', async () => {
    const stages = await productions.findStagesByStatus(p3.productionId, 'completed');
    assert.deepStrictEqual(stages, []);
  });

  // ── updateStage ────────────────────────────────────────────────────────

  it('should update stage fields', async () => {
    const updated = await productions.updateStage(stage1Id, {
      status: 'in-progress',
      notes: 'Updated notes',
    });
    assert.strictEqual(updated.status, 'in-progress');
    assert.strictEqual(updated.notes, 'Updated notes');
  });

  it('should auto-update updatedAt on stage update', async () => {
    const before = await productions.findStage(stage1Id);
    await new Promise(r => setTimeout(r, 10));
    await productions.updateStage(stage1Id, { status: 'completed' });
    const after = await productions.findStage(stage1Id);

    assert.ok(after!.updatedAt.getTime() > before!.updatedAt.getTime(), 'updatedAt should be updated');
  });

  it('should throw when updating non-existent stage', async () => {
    await assert.rejects(
      () => productions.updateStage(`${TEST}nonexistent-stage`, { status: 'completed' }),
      /ProductionStage with id .+ not found/,
    );
  });

  // ── moveStage ───────────────────────────────────────────────────────────

  it('should move stage to different status', async () => {
    const moved = await productions.moveStage(stage1Id, 'completed');
    assert.strictEqual(moved.status, 'completed');
    assert.ok(moved.completedAt, 'completedAt should be set when status is completed');
  });

  it('should set completedAt when provided', async () => {
    const stage = await productions.createStage({
      productionId: p3.productionId,
      code: 'test-completed-at',
      name: 'Test CompletedAt',
      order: 99,
      status: 'pending',
    });
    const completedAt = new Date('2026-06-01T00:00:00Z');

    const moved = await productions.moveStage(stage.id, 'completed', completedAt);
    assert.strictEqual(moved.status, 'completed');
    assert.ok(moved.completedAt);
    assert.strictEqual(moved.completedAt!.toISOString(), completedAt.toISOString());
  });

  it('should throw when moving non-existent stage', async () => {
    await assert.rejects(
      () => productions.moveStage(`${TEST}nonexistent-stage`, 'completed'),
      /ProductionStage with id .+ not found/,
    );
  });

  // ── deleteStage ────────────────────────────────────────────────────────

  it('should hard delete a stage', async () => {
    const stage = await productions.createStage({
      productionId: p3.productionId,
      code: 'to-delete',
      name: 'To Delete',
      order: 98,
      status: 'pending',
    });

    const deleted = await productions.deleteStage(stage.id);
    assert.strictEqual(deleted.id, stage.id);

    // Should be completely removed from DB
    const notFound = await productions.findStage(stage.id);
    assert.strictEqual(notFound, null, 'Deleted stage should not be found');
  });

  it('should throw when deleting non-existent stage', async () => {
    await assert.rejects(
      () => productions.deleteStage(`${TEST}nonexistent-stage`),
      /ProductionStage with id .+ not found/,
    );
  });

  // ── countStages ────────────────────────────────────────────────────────

  it('should count stages for a production', async () => {
    const count = await productions.countStages(p3.productionId);
    assert.ok(count >= 3, 'Should count at least the stages we created');
    assert.strictEqual(typeof count, 'number');
  });

  it('should return 0 for production with no stages', async () => {
    const { projectId, productionId } = await createProjectWithProduction('no-stages');
    const count = await productions.countStages(productionId);
    assert.strictEqual(count, 0);
  });
});
