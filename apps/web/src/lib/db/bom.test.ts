/**
 * BOMRepository tests
 *
 * Uses tsx for test execution. Creates test data in dev.db.
 * Tests all CRUD operations for BOM and BOMItem.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { bom } from './bom.js';
import { prisma } from './prisma.js';

const TEST = 't01-bom-';

async function cleanup() {
  // Clean up test data in reverse dependency order, ignoring errors
  await prisma.bOMItem.deleteMany({ where: { bomId: { startsWith: TEST } } }).catch(() => {});
  await prisma.bOM.deleteMany({ where: { id: { startsWith: TEST } } }).catch(() => {});
  await prisma.project.deleteMany({ where: { id: { startsWith: TEST } } }).catch(() => {});
}

describe('BOMRepository', { concurrency: false }, () => {
  let projectId: string;
  let bomId: string;
  let itemId: string;

  before(async () => {
    await cleanup();

    // Create a test project (required FK for BOM)
    projectId = `${TEST}project-1`;
    const now = new Date();
    await prisma.project.upsert({
      where: { id: projectId },
      create: {
        id: projectId,
        externalNumber: `${TEST}ext-1`,
        name: 'Test Project for BOM',
        updatedAt: now,
      },
      update: {},
    });
  });

  after(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  // ─── BOM CRUD tests ─────────────────────────────────────

  it('should create a BOM', async () => {
    const result = await bom.create({
      projectId,
    });

    assert.ok(result, 'BOM should be created');
    assert.ok(result.id, 'BOM should have an ID');
    assert.strictEqual(result.projectId, projectId);
    assert.strictEqual(result.status, 'draft');
    assert.strictEqual(result.version, 1);
    assert.ok(result.updatedAt, 'BOM should have updatedAt');
    bomId = result.id;
  });

  it('should find BOM by ID', async () => {
    const result = await bom.findById(bomId);

    assert.ok(result, 'BOM should be found');
    assert.strictEqual(result?.id, bomId);
    assert.strictEqual(result?.status, 'draft');
  });

  it('should find BOM by ID with items', async () => {
    const result = await bom.findById(bomId, true);

    assert.ok(result, 'BOM should be found');
    assert.ok(Array.isArray(result?.BOMItem), 'BOMItem should be an array');
    assert.strictEqual(result?.BOMItem?.length, 0, 'no items yet');
  });

  it('should find BOM by projectId', async () => {
    const result = await bom.findByProjectId(projectId);

    assert.ok(result, 'BOM should be found by projectId');
    assert.strictEqual(result?.id, bomId);
    assert.strictEqual(result?.projectId, projectId);

    const notFound = await bom.findByProjectId('nonexistent-project-id');
    assert.strictEqual(notFound, null, 'Nonexistent project should return null');
  });

  it('should return null for nonexistent BOM ID', async () => {
    const result = await bom.findById('nonexistent-bom-id');
    assert.strictEqual(result, null);
  });

  it('should update a BOM', async () => {
    const updated = await bom.update(bomId, {
      version: 2,
    });

    assert.strictEqual(updated.version, 2);
    // Reset back for subsequent tests
    await bom.update(bomId, { version: 1 });
  });

  it('should lock a BOM', async () => {
    const locked = await bom.lock(bomId);

    assert.strictEqual(locked.status, 'locked');
  });

  it('should unlock a BOM', async () => {
    const unlocked = await bom.unlock(bomId);

    assert.strictEqual(unlocked.status, 'draft');
  });

  it('should throw on duplicate projectId (unique constraint)', async () => {
    await assert.rejects(
      () => bom.create({ projectId }),
      /Unique constraint/
    );
  });

  // ─── BOMItem CRUD tests ─────────────────────────────────

  it('should create a BOMItem', async () => {
    const item = await bom.createItem({
      bomId,
      rowNumber: 1,
      name: 'Test Item 1',
      quantity: 10,
      unit: 'шт',
      price: 1500,
      article: 'ART-001',
      category: 'materials',
    });

    assert.ok(item, 'BOMItem should be created');
    assert.ok(item.id, 'BOMItem should have an ID');
    assert.strictEqual(item.bomId, bomId);
    assert.strictEqual(item.name, 'Test Item 1');
    assert.strictEqual(item.quantity, 10);
    assert.strictEqual(item.price, 1500);
    assert.strictEqual(item.status, 'pending');
    assert.strictEqual(item.isFromWarehouse, false);
    itemId = item.id;
  });

  it('should find items by BOM ID', async () => {
    const items = await bom.findItemsByBomId(bomId);

    assert.ok(Array.isArray(items), 'Result should be an array');
    assert.strictEqual(items.length, 1, 'Should have one item');
    assert.strictEqual(items[0].id, itemId);
    assert.strictEqual(items[0].name, 'Test Item 1');
  });

  it('should update a BOMItem', async () => {
    const updated = await bom.updateItem(itemId, {
      name: 'Updated Test Item',
      price: 2000,
      quantity: 20,
    });

    assert.strictEqual(updated.name, 'Updated Test Item');
    assert.strictEqual(updated.price, 2000);
    assert.strictEqual(updated.quantity, 20);
  });

  it('should bulk create BOMItems', async () => {
    const count = await bom.bulkCreateItems(bomId, [
      { rowNumber: 2, name: 'Bulk Item A', quantity: 5, price: 500 },
      { rowNumber: 3, name: 'Bulk Item B', quantity: 3, price: 800 },
      { rowNumber: 4, name: 'Bulk Item C', quantity: 1, price: 1200 },
    ]);

    assert.strictEqual(count, 3, 'Should create 3 items');

    const items = await bom.findItemsByBomId(bomId);
    assert.strictEqual(items.length, 4, 'Should have 4 items total (1 original + 3 bulk)');
  });

  it('should delete a BOMItem', async () => {
    const deleted = await bom.deleteItem(itemId);

    assert.strictEqual(deleted.id, itemId, 'Deleted item ID should match');

    // Verify it's gone
    const items = await bom.findItemsByBomId(bomId);
    assert.strictEqual(items.length, 3, 'Should have 3 items after deletion');
    assert.ok(items.every((item) => item.id !== itemId), 'Deleted item should not be in results');
  });

  // ─── BOM with items on create ────────────────────────────

  it('should create BOM with nested items', async () => {
    const nestedProjectId = `${TEST}project-2`;
    await prisma.project.create({
      data: {
        id: nestedProjectId,
        externalNumber: `${TEST}ext-2`,
        name: 'Test Project 2 for BOM',
        updatedAt: new Date(),
      },
    });

    const result = await bom.create({
      projectId: nestedProjectId,
      items: [
        { name: 'Nested Item 1', quantity: 2, rowNumber: 1, price: 100 },
        { name: 'Nested Item 2', quantity: 4, rowNumber: 2, price: 200, article: 'NEST-002' },
      ],
    });

    assert.ok(result, 'BOM should be created');
    assert.ok(result.BOMItem, 'BOMItem should be included');
    assert.strictEqual(result.BOMItem?.length, 2, 'Should have 2 nested items');
    assert.strictEqual(result.BOMItem?.[0].name, 'Nested Item 1');
    assert.strictEqual(result.BOMItem?.[1].article, 'NEST-002');

    // Cleanup nested BOM
    await bom.delete(result.id);
    await prisma.project.deleteMany({ where: { id: nestedProjectId } });
  });

  // ─── Delete BOM cascades to items ────────────────────────

  it('should delete BOM and cascade to items', async () => {
    const deleted = await bom.delete(bomId);

    assert.strictEqual(deleted.id, bomId);

    // Verify BOM is gone
    const bomResult = await bom.findById(bomId);
    assert.strictEqual(bomResult, null, 'BOM should not exist after delete');

    // Verify items are cascade-deleted
    const items = await prisma.bOMItem.findMany({ where: { bomId } });
    assert.strictEqual(items.length, 0, 'All items should be cascade-deleted');
  });
});
