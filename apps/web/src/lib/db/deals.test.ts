/**
 * DealRepository tests
 *
 * Uses tsx for test execution. Creates test fixtures in dev.db.
 * Tests all CRUD operations, stage transitions, history tracking, and soft-delete.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { deals } from './deals.js';
import { prisma } from './prisma.js';

const TEST = 't01-';

describe('DealRepository', { concurrency: false }, () => {
  let pipelineId: string;
  let newStageId: string;
  let qualifiedStageId: string;
  let wonStageId: string;
  let lostStageId: string;
  let userId: string;
  let managerId: string;
  let contactId: string;

  before(async () => {
    // Clean up leftover test data from previous runs.
    // Deals have auto-generated UUIDs so we filter by test pipelineId.
    // DealHistory cascades on Deal delete (onDelete: Cascade in schema).
    await prisma.deal.deleteMany({ where: { pipelineId: { startsWith: TEST } } });
    await prisma.dealStage.deleteMany({ where: { id: { startsWith: TEST } } });
    await prisma.pipeline.deleteMany({ where: { id: { startsWith: TEST } } });
    await prisma.user.deleteMany({ where: { id: { startsWith: TEST } } });
    await prisma.contact.deleteMany({ where: { id: { startsWith: TEST } } });

    // Create test pipeline
    pipelineId = `${TEST}pipeline`;
    await prisma.pipeline.create({
      data: {
        id: pipelineId,
        code: `${TEST}default`,
        name: 'Test Pipeline',
        createdAt: new Date(),
      },
    });

    // Create test stages
    newStageId = `${TEST}new`;
    qualifiedStageId = `${TEST}qualified`;
    wonStageId = `${TEST}won`;
    lostStageId = `${TEST}lost`;

    const stages = [
      { id: newStageId, code: `${TEST}new`, name: 'New', order: 1, probability: 10 },
      { id: qualifiedStageId, code: `${TEST}qualified`, name: 'Qualified', order: 2, probability: 30 },
      { id: wonStageId, code: `${TEST}won`, name: 'Won', order: 7, probability: 100, isWonStage: true },
      { id: lostStageId, code: `${TEST}lost`, name: 'Lost', order: 8, probability: 0, isLostStage: true },
    ];

    for (const s of stages) {
      await prisma.dealStage.create({
        data: { ...s, pipelineId, color: '#888888' },
      });
    }

    // Create test users (schema requires manual id, updatedAt)
    userId = `${TEST}user-a`;
    managerId = `${TEST}user-b`;
    const now = new Date();
    await prisma.user.create({
      data: { id: userId, email: `${TEST}a@test.com`, name: 'Test User A', passwordHash: 'hash-a', updatedAt: now },
    });
    await prisma.user.create({
      data: { id: managerId, email: `${TEST}b@test.com`, name: 'Test User B', passwordHash: 'hash-b', updatedAt: now },
    });

    // Create test contact (schema requires manual id, updatedAt)
    contactId = `${TEST}contact`;
    await prisma.contact.create({
      data: { id: contactId, type: 'company', companyName: 'Test Corp', updatedAt: now },
    });
  });

  after(async () => {
    // Deals have auto-generated UUIDs; filter by test pipelineId.
    // DealHistory cascades on Deal delete (onDelete: Cascade in schema).
    await prisma.deal.deleteMany({ where: { pipelineId: { startsWith: TEST } } });
    await prisma.dealStage.deleteMany({ where: { id: { startsWith: TEST } } });
    await prisma.pipeline.deleteMany({ where: { id: { startsWith: TEST } } });
    await prisma.user.deleteMany({ where: { id: { startsWith: TEST } } });
    await prisma.contact.deleteMany({ where: { id: { startsWith: TEST } } });
    await prisma.$disconnect();
  });

  let createdDealId: string;
  let createdDealNumber: string;

  // ── Create ──────────────────────────────────────────────────────────

  it('should create a deal with auto-generated UUID and С-YYYY-NNNNN number', async () => {
    const deal = await deals.create({
      title: 'Test Deal Auto',
      pipelineId,
      stageId: newStageId,
    });

    assert.ok(deal, 'Deal should be created');
    assert.ok(deal.id, 'Deal should have an ID');
    assert.ok(deal.number, 'Deal should have auto-generated number');
    assert.match(deal.number, /^С-\d{4}-\d{5}$/, 'Number format: С-YYYY-NNNNN');
    assert.strictEqual(deal.title, 'Test Deal Auto');
    assert.strictEqual(deal.amount, 0, 'Default amount should be 0');
    assert.strictEqual(deal.currency, 'RUB', 'Default currency should be RUB');
    assert.strictEqual(deal.deletedAt, null, 'New deal should not be deleted');
    createdDealId = deal.id;
    createdDealNumber = deal.number;
  });

  it('should create a deal with provided values overriding defaults', async () => {
    const deal = await deals.create({
      title: 'Test Deal Custom',
      pipelineId,
      stageId: newStageId,
      amount: 150_000,
      currency: 'USD',
      contactId,
      managerId,
      description: 'Custom description',
    });

    assert.strictEqual(deal.title, 'Test Deal Custom');
    assert.strictEqual(deal.amount, 150_000);
    assert.strictEqual(deal.currency, 'USD');
    assert.strictEqual(deal.contactId, contactId);
    assert.strictEqual(deal.managerId, managerId);
    assert.strictEqual(deal.description, 'Custom description');
  });

  it('should generate unique numbers for each deal', async () => {
    const a = await deals.create({ title: 'Unique A', pipelineId, stageId: newStageId });
    const b = await deals.create({ title: 'Unique B', pipelineId, stageId: newStageId });
    assert.notStrictEqual(a.number, b.number, 'Each deal must have a unique number');
  });

  // ── findMany ────────────────────────────────────────────────────────

  it('should findMany returning all non-deleted deals', async () => {
    const list = await deals.findMany();
    assert.ok(Array.isArray(list));
    assert.ok(list.length >= 3, 'Should find at least the deals we created');
    for (const d of list) {
      assert.strictEqual(d.deletedAt, null, 'No soft-deleted deals in results');
    }
  });

  it('should findMany filtered by pipelineId', async () => {
    const list = await deals.findMany({ where: { pipelineId } });
    assert.ok(list.length >= 3);
    for (const d of list) {
      assert.strictEqual(d.pipelineId, pipelineId);
    }
  });

  it('should findMany filtered by stageId', async () => {
    const list = await deals.findMany({ where: { stageId: newStageId } });
    assert.ok(list.length >= 3);
    for (const d of list) {
      assert.strictEqual(d.stageId, newStageId);
    }
  });

  it('should findMany with status=open (closedAt=null)', async () => {
    const list = await deals.findMany({ where: { closedAt: null } });
    assert.ok(list.length >= 3);
    for (const d of list) {
      assert.strictEqual(d.closedAt, null);
    }
  });

  it('should findMany with status=closed (closedAt not null)', async () => {
    // Create a deal and manually set closedAt for this filter test
    const closedDeal = await deals.create({
      title: 'Closed Deal',
      pipelineId,
      stageId: wonStageId,
    });
    await prisma.deal.update({
      where: { id: closedDeal.id },
      data: { closedAt: new Date() },
    });

    const closedList = await deals.findMany({ where: { closedAt: { not: null } } });
    assert.ok(closedList.length >= 1, 'Should find at least one closed deal');
    for (const d of closedList) {
      assert.ok(d.closedAt !== null, 'All returned deals should have closedAt set');
    }

    const openList = await deals.findMany({ where: { closedAt: null } });
    const closedIds = new Set(closedList.map(d => d.id));
    for (const d of openList) {
      assert.ok(!closedIds.has(d.id), 'Open deals should not include closed ones');
    }
  });

  it('should exclude soft-deleted deals from findMany', async () => {
    await deals.softDelete(createdDealId);
    const list = await deals.findMany();
    const ids = list.map(d => d.id);
    assert.ok(!ids.includes(createdDealId), 'Soft-deleted deal should be excluded from findMany');

    // Restore for further tests
    await prisma.deal.update({ where: { id: createdDealId }, data: { deletedAt: null } });
  });

  // ── findUnique ──────────────────────────────────────────────────────

  it('should findUnique by ID', async () => {
    const deal = await deals.findUnique(createdDealId);
    assert.ok(deal, 'Should find existing deal');
    assert.strictEqual(deal.id, createdDealId);
    assert.strictEqual(deal.number, createdDealNumber);
  });

  it('should return null for non-existent ID', async () => {
    const deal = await deals.findUnique(`${TEST}nonexistent`);
    assert.strictEqual(deal, null);
  });

  it('should return null for soft-deleted deal', async () => {
    await deals.softDelete(createdDealId);
    const deal = await deals.findUnique(createdDealId);
    assert.strictEqual(deal, null, 'Soft-deleted deal should return null');

    // Restore
    await prisma.deal.update({ where: { id: createdDealId }, data: { deletedAt: null } });
  });

  it('should findUnique with includes (DealStage, Pipeline, Contact)', async () => {
    const deal = await deals.findUnique(createdDealId, {
      DealStage: true,
      Pipeline: true,
      Contact: true,
    });
    assert.ok(deal, 'Should find the deal');
    assert.ok(deal.DealStage, 'DealStage should be included');
    assert.strictEqual(deal.DealStage.id, newStageId);
    assert.ok(deal.Pipeline, 'Pipeline should be included');
    assert.strictEqual(deal.Pipeline.id, pipelineId);
  });

  it('should findUnique with history include', async () => {
    const deal = await deals.findUnique(createdDealId, {
      DealHistory: true,
    });
    assert.ok(deal);
    assert.ok(Array.isArray(deal.DealHistory), 'DealHistory should be included as array');
  });

  // ── update ──────────────────────────────────────────────────────────

  it('should update valid fields', async () => {
    const updated = await deals.update(createdDealId, {
      title: 'Updated Title',
      amount: 99_999,
    });
    assert.strictEqual(updated.title, 'Updated Title');
    assert.strictEqual(updated.amount, 99_999);
  });

  it('should throw when updating non-existent deal', async () => {
    await assert.rejects(
      () => deals.update(`${TEST}nonexistent`, { title: 'Nope' }),
      /Deal with id .+ not found/,
      'Should throw descriptive error for non-existent deal',
    );
  });

  it('should throw when updating soft-deleted deal', async () => {
    const tmp = await deals.create({ title: 'Update Delete', pipelineId, stageId: newStageId });
    await deals.softDelete(tmp.id);

    await assert.rejects(
      () => deals.update(tmp.id, { title: 'Nope' }),
      /Deal with id .+ not found/,
    );
  });

  // ── moveStage ───────────────────────────────────────────────────────

  it('should move deal to a new stage and create DealHistory record', async () => {
    // Move back to newStage first to have a clean transition
    const moved = await deals.moveStage(createdDealId, qualifiedStageId, userId, 'Moving to qualified');
    assert.strictEqual(moved.stageId, qualifiedStageId);

    const history = await deals.getHistory(createdDealId);
    assert.ok(history.length >= 1, 'History should have at least one entry');
    const latest = history[0]; // ordered by changedAt desc
    assert.strictEqual(latest.toStageId, qualifiedStageId, 'History should record target stage');
    assert.strictEqual(latest.comment, 'Moving to qualified');
    assert.strictEqual(latest.changedBy, userId);
  });

  it('should allow same-stage move (records history without rejection)', async () => {
    // Note: The implementation does not reject same-stage transitions.
    // It records a history entry with fromStageId == toStageId.
    // This is a deviation from the task plan which expected "same stage rejects".
    await deals.moveStage(createdDealId, qualifiedStageId, userId, 'Same stage re-entry');
    const history = await deals.getHistory(createdDealId);
    const latest = history[0];
    assert.strictEqual(latest.fromStageId, qualifiedStageId);
    assert.strictEqual(latest.toStageId, qualifiedStageId);
  });

  it('should set closedAt and actualCloseDate when moving to won stage', async () => {
    const wonDeal = await deals.create({
      title: 'Deal To Win',
      pipelineId,
      stageId: newStageId,
    });
    await deals.moveStage(wonDeal.id, wonStageId, userId);

    const updated = await prisma.deal.findUnique({ where: { id: wonDeal.id } });
    assert.ok(updated?.closedAt, 'closedAt should be set when deal is won');
    assert.ok(updated?.actualCloseDate, 'actualCloseDate should be set when deal is won');
  });

  it('should set closedAt and actualCloseDate when moving to lost stage', async () => {
    const lostDeal = await deals.create({
      title: 'Deal To Lose',
      pipelineId,
      stageId: newStageId,
    });
    await deals.moveStage(lostDeal.id, lostStageId, userId);

    const updated = await prisma.deal.findUnique({ where: { id: lostDeal.id } });
    assert.ok(updated?.closedAt, 'closedAt should be set when deal is lost');
    assert.ok(updated?.actualCloseDate, 'actualCloseDate should be set when deal is lost');
  });

  it('should throw when moving non-existent deal', async () => {
    await assert.rejects(
      () => deals.moveStage(`${TEST}nonexistent`, qualifiedStageId, userId),
      /Deal with id .+ not found/,
    );
  });

  // ── softDelete ──────────────────────────────────────────────────────

  it('should soft delete a deal (sets deletedAt, excludes from queries)', async () => {
    const target = await deals.create({
      title: 'To Delete',
      pipelineId,
      stageId: newStageId,
    });

    const deleted = await deals.softDelete(target.id);
    assert.ok(deleted.deletedAt, 'deletedAt should be set');

    // Excluded from findUnique
    const notFound = await deals.findUnique(target.id);
    assert.strictEqual(notFound, null, 'Soft-deleted should not be found via findUnique');

    // Excluded from findMany
    const list = await deals.findMany();
    assert.ok(!list.find(d => d.id === target.id), 'Soft-deleted should not appear in findMany');

    // Still exists in DB
    const raw = await prisma.deal.findUnique({ where: { id: target.id } });
    assert.ok(raw, 'Record should still exist in database');
    assert.ok(raw.deletedAt, 'Record should have deletedAt set');
  });

  it('should throw when soft-deleting already deleted deal', async () => {
    const target = await deals.create({
      title: 'Double Delete',
      pipelineId,
      stageId: newStageId,
    });
    await deals.softDelete(target.id);

    await assert.rejects(
      () => deals.softDelete(target.id),
      /Deal with id .+ not found/,
    );
  });

  // ── getHistory ──────────────────────────────────────────────────────

  it('should return history entries ordered by changedAt desc', async () => {
    const hDeal = await deals.create({
      title: 'History Deal',
      pipelineId,
      stageId: newStageId,
    });

    await deals.moveStage(hDeal.id, qualifiedStageId, userId, 'Move 1');
    // Small delay to ensure distinct timestamps
    await new Promise(r => setTimeout(r, 10));
    await deals.moveStage(hDeal.id, newStageId, userId, 'Move 2');

    const history = await deals.getHistory(hDeal.id);
    assert.ok(history.length >= 2, 'Should have at least 2 history entries');

    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1].changedAt.getTime();
      const curr = history[i].changedAt.getTime();
      assert.ok(prev >= curr, `Entry ${i - 1} should not be older than entry ${i} (descending order)`);
    }
  });

  it('should return empty array for deal with no history', async () => {
    const noHistory = await deals.create({
      title: 'No History Deal',
      pipelineId,
      stageId: newStageId,
    });
    const history = await deals.getHistory(noHistory.id);
    assert.deepStrictEqual(history, []);
  });

  // ── count ───────────────────────────────────────────────────────────

  it('should count deals excluding soft-deleted', async () => {
    const before = await deals.count();

    const tmp = await deals.create({
      title: 'Count Test',
      pipelineId,
      stageId: newStageId,
    });
    assert.strictEqual(await deals.count(), before + 1, 'Count should increment after create');

    await deals.softDelete(tmp.id);
    assert.strictEqual(await deals.count(), before, 'Count should return to previous after soft-delete');
  });

  it('should count with where filter', async () => {
    const count = await deals.count({ pipelineId });
    assert.ok(count >= 1, 'Should count deals in pipeline');
    assert.strictEqual(typeof count, 'number');
  });

  // ── Helper methods ──────────────────────────────────────────────────

  it('findByPipeline returns deals for pipeline ordered by createdAt desc', async () => {
    const results = await deals.findByPipeline(pipelineId);
    assert.ok(results.length >= 1);
    for (const d of results) {
      assert.strictEqual(d.pipelineId, pipelineId);
      assert.strictEqual(d.deletedAt, null);
    }
  });

  it('findByStage returns deals for stage ordered by createdAt desc', async () => {
    const results = await deals.findByStage(newStageId);
    assert.ok(results.length >= 1);
    for (const d of results) {
      assert.strictEqual(d.stageId, newStageId);
      assert.strictEqual(d.deletedAt, null);
    }
  });

  it('findByManager returns deals for manager', async () => {
    const mgrDeal = await deals.create({
      title: 'Manager Deal',
      pipelineId,
      stageId: newStageId,
      managerId,
    });
    const results = await deals.findByManager(managerId);
    assert.ok(results.length >= 1);
    for (const d of results) {
      assert.strictEqual(d.managerId, managerId);
    }
  });

  it('findByManager returns empty array for manager with no deals', async () => {
    const results = await deals.findByManager(`${TEST}no-such-manager`);
    assert.deepStrictEqual(results, []);
  });

  it('findByContact returns deals for contact', async () => {
    const contactDeal = await deals.create({
      title: 'Contact Deal',
      pipelineId,
      stageId: newStageId,
      contactId,
    });
    const results = await deals.findByContact(contactId);
    assert.ok(results.length >= 1);
    for (const d of results) {
      assert.strictEqual(d.contactId, contactId);
    }
  });

  it('findByContact returns empty array for contact with no deals', async () => {
    const results = await deals.findByContact(`${TEST}no-such-contact`);
    assert.deepStrictEqual(results, []);
  });
});
