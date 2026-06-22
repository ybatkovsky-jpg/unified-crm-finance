/**
 * ProjectRepository tests
 *
 * Uses tsx for test execution. Creates test fixtures in dev.db.
 * Tests all CRUD operations, stage management, member management, and soft-delete.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { projects } from './projects.js';
import { prisma } from './prisma.js';

const TEST = 't01-pj-';

describe('ProjectRepository', { concurrency: false }, () => {
  let userId: string;
  let managerId: string;
  let memberUserId: string;
  let contactId: string;
  let dealId: string;

  before(async () => {
    // Clean up leftover test data from previous runs
    // Delete in reverse dependency order to respect foreign key constraints
    // Use try-catch for cleanup to handle cases where data doesn't exist
    try { await prisma.projectMember.deleteMany({ where: { projectId: { startsWith: TEST } } }); } catch {}
    try { await prisma.projectStage.deleteMany({ where: { projectId: { startsWith: TEST } } }); } catch {}
    try { await prisma.project.deleteMany({ where: { id: { startsWith: TEST } } }); } catch {}
    try { await prisma.deal.deleteMany({ where: { id: { startsWith: TEST } } }); } catch {}
    try { await prisma.dealStage.deleteMany({ where: { id: { startsWith: TEST } } }); } catch {}
    try { await prisma.pipeline.deleteMany({ where: { id: { startsWith: TEST } } }); } catch {}
    try { await prisma.contact.deleteMany({ where: { id: { startsWith: TEST } } }); } catch {}
    // Users may be referenced by other entities, just try to delete
    try { await prisma.user.deleteMany({ where: { id: { startsWith: TEST } } }); } catch {}

    // Create test pipeline and stages for deals
    const pipelineId = `${TEST}pipeline`;
    await prisma.pipeline.create({
      data: { id: pipelineId, code: `${TEST}default`, name: 'Test Pipeline', createdAt: new Date() },
    });

    const newStageId = `${TEST}new-stage`;
    await prisma.dealStage.create({
      data: { id: newStageId, code: `${TEST}new`, name: 'New', order: 1, probability: 10, pipelineId, color: '#888888' },
    });

    // Create test users
    const now = new Date();
    userId = `${TEST}user-a`;
    managerId = `${TEST}user-b`;
    memberUserId = `${TEST}user-c`;
    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, email: `${TEST}a@test.com`, name: 'Test User A', passwordHash: 'hash-a', updatedAt: now },
      update: {},
    });
    await prisma.user.upsert({
      where: { id: managerId },
      create: { id: managerId, email: `${TEST}b@test.com`, name: 'Test User B', passwordHash: 'hash-b', updatedAt: now },
      update: {},
    });
    await prisma.user.upsert({
      where: { id: memberUserId },
      create: { id: memberUserId, email: `${TEST}c@test.com`, name: 'Test User C', passwordHash: 'hash-c', updatedAt: now },
      update: {},
    });

    // Create test contact
    contactId = `${TEST}contact`;
    await prisma.contact.upsert({
      where: { id: contactId },
      create: { id: contactId, type: 'company', companyName: 'Test Corp', updatedAt: now },
      update: {},
    });

    // Create test deal
    dealId = `${TEST}deal`;
    await prisma.deal.upsert({
      where: { id: dealId },
      create: {
        id: dealId,
        number: `${TEST}deal-num`,
        title: 'Test Deal',
        pipelineId,
        stageId: newStageId,
        createdAt: now,
        updatedAt: now,
      },
      update: {},
    });
  });

  after(async () => {
    // Delete in reverse order of creation to respect foreign key constraints
    // Use try-catch for cleanup to handle cases where data doesn't exist
    try { await prisma.projectMember.deleteMany({ where: { projectId: { startsWith: TEST } } }); } catch {}
    try { await prisma.projectStage.deleteMany({ where: { projectId: { startsWith: TEST } } }); } catch {}
    try { await prisma.project.deleteMany({ where: { id: { startsWith: TEST } } }); } catch {}
    try { await prisma.deal.deleteMany({ where: { id: { startsWith: TEST } } }); } catch {}
    try { await prisma.dealStage.deleteMany({ where: { id: { startsWith: TEST } } }); } catch {}
    try { await prisma.pipeline.deleteMany({ where: { id: { startsWith: TEST } } }); } catch {}
    try { await prisma.contact.deleteMany({ where: { id: { startsWith: TEST } } }); } catch {}
    // Users may be referenced by other entities, just try to delete
    try { await prisma.user.deleteMany({ where: { id: { startsWith: TEST } } }); } catch {}
    await prisma.$disconnect();
  });

  let createdProjectId: string;
  let createdProjectNumber: string;

  // ── Create ──────────────────────────────────────────────────────────

  it('should create a project with auto-generated UUID and PRJ-YYYY-NNNNN number', async () => {
    const project = await projects.create({
      name: 'Test Project Auto',
    });

    assert.ok(project, 'Project should be created');
    assert.ok(project.id, 'Project should have an ID');
    assert.ok(project.externalNumber, 'Project should have auto-generated number');
    assert.match(project.externalNumber, /^PRJ-\d{4}-\d{5}$/, 'Number format: PRJ-YYYY-NNNNN');
    assert.strictEqual(project.name, 'Test Project Auto');
    assert.strictEqual(project.status, 'lead', 'Default status should be lead');
    assert.strictEqual(project.currency, 'RUB', 'Default currency should be RUB');
    assert.strictEqual(project.deletedAt, null, 'New project should not be deleted');
    createdProjectId = project.id;
    createdProjectNumber = project.externalNumber;
  });

  it('should create a project with provided values overriding defaults', async () => {
    const project = await projects.create({
      name: 'Test Project Custom',
      description: 'Custom description',
      status: 'active',
      contractAmount: 500_000,
      currency: 'USD',
      contactId,
      managerId,
      // Note: dealId is unique, so we don't set it here to avoid conflicts
    });

    assert.strictEqual(project.name, 'Test Project Custom');
    assert.strictEqual(project.description, 'Custom description');
    assert.strictEqual(project.status, 'active');
    assert.strictEqual(project.contractAmount, 500_000);
    assert.strictEqual(project.currency, 'USD');
    assert.strictEqual(project.contactId, contactId);
    assert.strictEqual(project.managerId, managerId);
    assert.strictEqual(project.dealId, null);
  });

  it('should generate unique numbers for each project', async () => {
    const a = await projects.create({ name: 'Project A' });
    const b = await projects.create({ name: 'Project B' });
    assert.notStrictEqual(a.externalNumber, b.externalNumber, 'Each project must have a unique number');
  });

  // ── findMany ────────────────────────────────────────────────────────

  it('should findMany returning all non-deleted projects', async () => {
    const list = await projects.findMany();
    assert.ok(Array.isArray(list));
    assert.ok(list.length >= 3, 'Should find at least the projects we created');
    for (const p of list) {
      assert.strictEqual(p.deletedAt, null, 'No soft-deleted projects in results');
    }
  });

  it('should findMany filtered by status', async () => {
    const list = await projects.findMany({ where: { status: 'lead' } });
    assert.ok(list.length >= 1);
    for (const p of list) {
      assert.strictEqual(p.status, 'lead');
    }
  });

  it('should findMany filtered by managerId', async () => {
    const list = await projects.findMany({ where: { managerId } });
    assert.ok(list.length >= 1);
    for (const p of list) {
      assert.strictEqual(p.managerId, managerId);
    }
  });

  it('should findMany filtered by contactId', async () => {
    const list = await projects.findMany({ where: { contactId } });
    assert.ok(list.length >= 1);
    for (const p of list) {
      assert.strictEqual(p.contactId, contactId);
    }
  });

  it('should findMany filtered by dealId', async () => {
    const list = await projects.findMany({ where: { dealId } });
    assert.ok(list.length >= 1);
    for (const p of list) {
      assert.strictEqual(p.dealId, dealId);
    }
  });

  it('should exclude soft-deleted projects from findMany', async () => {
    await projects.softDelete(createdProjectId);
    const list = await projects.findMany();
    const ids = list.map(p => p.id);
    assert.ok(!ids.includes(createdProjectId), 'Soft-deleted project should be excluded from findMany');

    // Restore for further tests
    await prisma.project.update({ where: { id: createdProjectId }, data: { deletedAt: null } });
  });

  // ── findUnique ──────────────────────────────────────────────────────

  it('should findUnique by ID', async () => {
    const project = await projects.findUnique(createdProjectId);
    assert.ok(project, 'Should find existing project');
    assert.strictEqual(project.id, createdProjectId);
    assert.strictEqual(project.externalNumber, createdProjectNumber);
  });

  it('should return null for non-existent ID', async () => {
    const project = await projects.findUnique(`${TEST}nonexistent`);
    assert.strictEqual(project, null);
  });

  it('should return null for soft-deleted project', async () => {
    await projects.softDelete(createdProjectId);
    const project = await projects.findUnique(createdProjectId);
    assert.strictEqual(project, null, 'Soft-deleted project should return null');

    // Restore
    await prisma.project.update({ where: { id: createdProjectId }, data: { deletedAt: null } });
  });

  it('should findUnique with includes (User, Contact)', async () => {
    const project = await projects.findUnique(createdProjectId, {
      User: true,
      Contact: true,
    });
    assert.ok(project, 'Should find the project');
    // These relations are optional, so we just verify the query works
  });

  // ── update ──────────────────────────────────────────────────────────

  it('should update valid fields', async () => {
    const updated = await projects.update(createdProjectId, {
      name: 'Updated Project Name',
      contractAmount: 750_000,
      status: 'in_progress',
    });
    assert.strictEqual(updated.name, 'Updated Project Name');
    assert.strictEqual(updated.contractAmount, 750_000);
    assert.strictEqual(updated.status, 'in_progress');
  });

  it('should throw when updating non-existent project', async () => {
    await assert.rejects(
      () => projects.update(`${TEST}nonexistent`, { name: 'Nope' }),
      /Project with id .+ not found/,
      'Should throw descriptive error for non-existent project',
    );
  });

  it('should throw when updating soft-deleted project', async () => {
    const tmp = await projects.create({ name: 'To Delete Soon' });
    await projects.softDelete(tmp.id);

    await assert.rejects(
      () => projects.update(tmp.id, { name: 'Nope' }),
      /Project with id .+ not found/,
    );
  });

  // ── softDelete ──────────────────────────────────────────────────────

  it('should soft delete a project (sets deletedAt, excludes from queries)', async () => {
    const target = await projects.create({ name: 'Target For Deletion' });

    const deleted = await projects.softDelete(target.id);
    assert.ok(deleted.deletedAt, 'deletedAt should be set');

    // Excluded from findUnique
    const notFound = await projects.findUnique(target.id);
    assert.strictEqual(notFound, null, 'Soft-deleted should not be found via findUnique');

    // Excluded from findMany
    const list = await projects.findMany();
    assert.ok(!list.find(p => p.id === target.id), 'Soft-deleted should not appear in findMany');

    // Still exists in DB
    const raw = await prisma.project.findUnique({ where: { id: target.id } });
    assert.ok(raw, 'Record should still exist in database');
    assert.ok(raw.deletedAt, 'Record should have deletedAt set');
  });

  it('should throw when soft-deleting already deleted project', async () => {
    const target = await projects.create({ name: 'Double Delete' });
    await projects.softDelete(target.id);

    await assert.rejects(
      () => projects.softDelete(target.id),
      /Project with id .+ not found/,
    );
  });

  // ── count ───────────────────────────────────────────────────────────

  it('should count projects excluding soft-deleted', async () => {
    const before = await projects.count();

    const tmp = await projects.create({ name: 'Count Test' });
    assert.strictEqual(await projects.count(), before + 1, 'Count should increment after create');

    await projects.softDelete(tmp.id);
    assert.strictEqual(await projects.count(), before, 'Count should return to previous after soft-delete');
  });

  it('should count with where filter', async () => {
    const count = await projects.count({ status: 'lead' });
    assert.ok(count >= 1, 'Should count projects with lead status');
    assert.strictEqual(typeof count, 'number');
  });

  // ── Stage management ──────────────────────────────────────────────────

  it('should create a project stage', async () => {
    const stage = await projects.createStage(createdProjectId, {
      code: 'design',
      name: 'Design Phase',
      order: 1,
      status: 'pending',
    });

    assert.ok(stage.id, 'Stage should have ID');
    assert.strictEqual(stage.projectId, createdProjectId);
    assert.strictEqual(stage.code, 'design');
    assert.strictEqual(stage.name, 'Design Phase');
    assert.strictEqual(stage.order, 1);
  });

  it('should update a project stage', async () => {
    const stage = await projects.createStage(createdProjectId, {
      code: 'development',
      name: 'Development',
      order: 2,
      status: 'pending',
    });

    const updated = await projects.updateStage(stage.id, {
      status: 'in_progress',
      startDate: new Date(),
    });

    assert.strictEqual(updated.status, 'in_progress');
    assert.ok(updated.startDate, 'startDate should be set');
  });

  it('should find stages for a project', async () => {
    const stages = await projects.findStages(createdProjectId);
    assert.ok(Array.isArray(stages));
    assert.ok(stages.length >= 2, 'Should have at least 2 stages created');
    // Should be ordered by order asc
    assert.strictEqual(stages[0].order, 1);
    assert.strictEqual(stages[1].order, 2);
  });

  // ── Member management ─────────────────────────────────────────────────

  it('should add a member to a project', async () => {
    const member = await projects.addMember(createdProjectId, memberUserId, 'developer');

    assert.ok(member.id, 'Member should have ID');
    assert.strictEqual(member.projectId, createdProjectId);
    assert.strictEqual(member.userId, memberUserId);
    assert.strictEqual(member.role, 'developer');
    assert.ok(member.joinedAt, 'joinedAt should be set');
    assert.strictEqual(member.leftAt, null, 'leftAt should be null for active member');
  });

  it('should find members for a project', async () => {
    const members = await projects.findMembers(createdProjectId);
    assert.ok(Array.isArray(members));
    assert.ok(members.length >= 1, 'Should have at least one member');
    assert.strictEqual(members[0].User.id, memberUserId);
  });

  it('should remove a member from a project', async () => {
    // First add a fresh member to ensure we have one to remove
    // Note: addMember may fail if member already exists from previous test
    const freshUserId = `${TEST}user-fresh`;
    const now = new Date();
    await prisma.user.upsert({
      where: { id: freshUserId },
      create: { id: freshUserId, email: `${TEST}fresh@test.com`, name: 'Fresh User', passwordHash: 'hash-fresh', updatedAt: now },
      update: {},
    });
    await projects.addMember(createdProjectId, freshUserId, 'tester');

    const removed = await projects.removeMember(createdProjectId, freshUserId);

    assert.ok(removed.leftAt, 'leftAt should be set after removal');

    // Member should no longer appear in active members
    const activeMembers = await projects.findMembers(createdProjectId);
    const memberIds = activeMembers.map(m => m.userId);
    assert.ok(!memberIds.includes(freshUserId), 'Removed member should not be in active members list');
  });

  it('should throw when removing non-existent member', async () => {
    await assert.rejects(
      () => projects.removeMember(createdProjectId, `${TEST}nonexistent-user`),
      /Member .+ not found in project/,
    );
  });

  // ── Helper methods ──────────────────────────────────────────────────

  it('findByStatus returns projects for status', async () => {
    const results = await projects.findByStatus('lead');
    assert.ok(Array.isArray(results));
    for (const p of results) {
      assert.strictEqual(p.status, 'lead');
      assert.strictEqual(p.deletedAt, null);
    }
  });

  it('findByManager returns projects for manager', async () => {
    const mgrProject = await projects.create({
      name: 'Manager Project',
      managerId,
    });
    const results = await projects.findByManager(managerId);
    assert.ok(results.length >= 1);
    for (const p of results) {
      assert.strictEqual(p.managerId, managerId);
    }
  });

  it('findByManager returns empty array for manager with no projects', async () => {
    const results = await projects.findByManager(`${TEST}no-such-manager`);
    assert.deepStrictEqual(results, []);
  });

  it('findByContact returns projects for contact', async () => {
    const contactProject = await projects.create({
      name: 'Contact Project',
      contactId,
    });
    const results = await projects.findByContact(contactId);
    assert.ok(results.length >= 1);
    for (const p of results) {
      assert.strictEqual(p.contactId, contactId);
    }
  });

  it('findByContact returns empty array for contact with no projects', async () => {
    const results = await projects.findByContact(`${TEST}no-such-contact`);
    assert.deepStrictEqual(results, []);
  });

  it('findByDeal returns projects for deal', async () => {
    const results = await projects.findByDeal(dealId);
    assert.ok(results.length >= 1);
    for (const p of results) {
      assert.strictEqual(p.dealId, dealId);
    }
  });

  it('findByDeal returns empty array for deal with no projects', async () => {
    const results = await projects.findByDeal(`${TEST}no-such-deal`);
    assert.deepStrictEqual(results, []);
  });

  // ── completeWithCascade ───────────────────────────────────────────────────

  it('should complete project and cascade to deal when all stages are completed', async () => {
    // Create a test pipeline with a won stage
    const cascadePipelineId = `${TEST}cascade-pipeline`;
    await prisma.pipeline.create({
      data: { id: cascadePipelineId, code: `${TEST}cascade`, name: 'Cascade Pipeline', createdAt: new Date() },
    });

    const cascadeNewStageId = `${TEST}cascade-new`;
    const cascadeWonStageId = `${TEST}cascade-won`;
    await prisma.dealStage.create({
      data: { id: cascadeNewStageId, code: `${TEST}cn`, name: 'New', order: 1, probability: 10, pipelineId: cascadePipelineId, color: '#888888' },
    });
    await prisma.dealStage.create({
      data: { id: cascadeWonStageId, code: `${TEST}cw`, name: 'Won', order: 2, probability: 100, isWonStage: true, pipelineId: cascadePipelineId, color: '#00cc00' },
    });

    // Create a deal in this pipeline
    const cascadeDealId = `${TEST}cascade-deal`;
    const now = new Date();
    const cascadeDeal = await prisma.deal.create({
      data: {
        id: cascadeDealId,
        number: `${TEST}cascade-deal-num`,
        title: 'Cascade Test Deal',
        pipelineId: cascadePipelineId,
        stageId: cascadeNewStageId,
        createdAt: now,
        updatedAt: now,
      },
    });

    // Create a project linked to this deal
    const cascadeProjectId = `${TEST}cascade-project`;
    const cascadeProject = await prisma.project.create({
      data: {
        id: cascadeProjectId,
        externalNumber: `${TEST}cascade-prj-num`,
        name: 'Cascade Test Project',
        dealId: cascadeDealId,
        status: 'in_progress',
        createdAt: now,
        updatedAt: now,
      },
    });

    // Create and complete all stages for the project
    const stage1 = await prisma.projectStage.create({
      data: { id: `${TEST}cs-1`, projectId: cascadeProjectId, code: 'design', name: 'Design', order: 1, status: 'completed', completedAt: now },
    });
    const stage2 = await prisma.projectStage.create({
      data: { id: `${TEST}cs-2`, projectId: cascadeProjectId, code: 'dev', name: 'Development', order: 2, status: 'completed', completedAt: now },
    });

    // Execute completeWithCascade
    const result = await projects.completeWithCascade(cascadeProjectId, userId);

    // Verify project is completed
    assert.strictEqual(result.project.status, 'completed', 'Project status should be completed');
    assert.ok(result.project.completedAt, 'Project completedAt should be set');

    // Verify deal is moved to won stage and closed
    assert.ok(result.deal, 'Deal should be returned');
    assert.strictEqual(result.deal!.id, cascadeDealId, 'Returned deal should match');
    assert.strictEqual(result.deal!.stageId, cascadeWonStageId, 'Deal should be moved to won stage');
    assert.ok(result.deal!.closedAt, 'Deal closedAt should be set');
    assert.ok(result.deal!.actualCloseDate, 'Deal actualCloseDate should be set');

    // Verify deal history was created
    const history = await prisma.dealHistory.findMany({
      where: { dealId: cascadeDealId },
      orderBy: { changedAt: 'desc' },
    });
    assert.ok(history.length >= 1, 'Deal history should have at least one entry');
    assert.strictEqual(history[0].toStageId, cascadeWonStageId, 'History should record move to won stage');
    assert.strictEqual(history[0].changedBy, userId, 'History should record user who made the change');
  });

  it('should throw when completing project with incomplete stages', async () => {
    // Create a project with incomplete stages
    const incompleteProjectId = `${TEST}incomplete-project`;
    const now = new Date();
    const incompleteProject = await prisma.project.create({
      data: {
        id: incompleteProjectId,
        externalNumber: `${TEST}inc-prj-num`,
        name: 'Incomplete Project',
        status: 'in_progress',
        createdAt: now,
        updatedAt: now,
      },
    });

    // Create one completed and one incomplete stage
    await prisma.projectStage.create({
      data: { id: `${TEST}inc-s1`, projectId: incompleteProjectId, code: 'done', name: 'Done', order: 1, status: 'completed', completedAt: now },
    });
    await prisma.projectStage.create({
      data: { id: `${TEST}inc-s2`, projectId: incompleteProjectId, code: 'todo', name: 'To Do', order: 2, status: 'pending' },
    });

    // Should throw because stages are not all completed
    await assert.rejects(
      () => projects.completeWithCascade(incompleteProjectId, userId),
      /Cannot complete project: incomplete stages/,
      'Should throw when stages are incomplete',
    );
  });

  it('should complete project without deal when no deal is linked', async () => {
    // Create a project without a linked deal
    const noDealProjectId = `${TEST}no-deal-project`;
    const now = new Date();
    const noDealProject = await prisma.project.create({
      data: {
        id: noDealProjectId,
        externalNumber: `${TEST}nd-prj-num`,
        name: 'No Deal Project',
        status: 'in_progress',
        createdAt: now,
        updatedAt: now,
      },
    });

    // Create completed stage
    await prisma.projectStage.create({
      data: { id: `${TEST}nd-s1`, projectId: noDealProjectId, code: 'done', name: 'Done', order: 1, status: 'completed', completedAt: now },
    });

    // Execute completeWithCascade
    const result = await projects.completeWithCascade(noDealProjectId, userId);

    // Verify project is completed
    assert.strictEqual(result.project.status, 'completed', 'Project status should be completed');
    assert.ok(result.project.completedAt, 'Project completedAt should be set');

    // Verify no deal is returned
    assert.strictEqual(result.deal, null, 'Deal should be null when no deal is linked');
  });

  it('should throw when completing non-existent project', async () => {
    await assert.rejects(
      () => projects.completeWithCascade(`${TEST}nonexistent-project`, userId),
      /Project with id .+ not found/,
      'Should throw for non-existent project',
    );
  });
});
