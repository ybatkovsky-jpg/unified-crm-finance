/**
 * CategoryRepository tests
 *
 * Uses node:test runner. Creates test data in dev.db.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { categories, CategoryRepository } from './categories.js';
import { prisma } from './prisma.js';
import { randomUUID } from 'node:crypto';

const TEST_PREFIX = 'TEST_CAT_';

describe('CategoryRepository', { concurrency: false }, () => {
  let parentId: string;
  let childId: string;

  before(async () => {
    // Clean up test leftovers from prior runs
    await prisma.category.deleteMany({
      where: { name: { startsWith: TEST_PREFIX } },
    });
  });

  it('should create a root category', async () => {
    const cat = await categories.create({
      name: `${TEST_PREFIX}Продукты`,
      type: 'expense',
      order: 1,
    });

    assert.ok(cat, 'Category should be created');
    assert.ok(cat.id, 'Category should have an ID');
    assert.strictEqual(cat.name, `${TEST_PREFIX}Продукты`);
    assert.strictEqual(cat.type, 'expense');
    assert.strictEqual(cat.order, 1);
    assert.strictEqual(cat.parentId, null);
    assert.strictEqual(cat.isActive, true);
    parentId = cat.id;
  });

  it('should create a child category with valid parentId', async () => {
    const cat = await categories.create({
      name: `${TEST_PREFIX}Овощи`,
      type: 'expense',
      parentId,
      order: 1,
    });

    assert.ok(cat, 'Child category should be created');
    assert.strictEqual(cat.parentId, parentId);
    childId = cat.id;
  });

  it('should find category by ID', async () => {
    const cat = await categories.findUnique(parentId);
    assert.ok(cat, 'Category should be found');
    assert.strictEqual(cat?.id, parentId);
    assert.strictEqual(cat?.name, `${TEST_PREFIX}Продукты`);
  });

  it('should return null for non-existent ID', async () => {
    const cat = await categories.findUnique('non-existent-id');
    assert.strictEqual(cat, null);
  });

  it('should find categories by type (expense)', async () => {
    const list = await categories.findByType('expense');
    assert.ok(Array.isArray(list), 'Result should be an array');
    const ours = list.filter((c) => c.name.startsWith(TEST_PREFIX));
    assert.ok(ours.length >= 2, 'Should find our test categories');
    assert.ok(ours.every((c) => c.type === 'expense'));
  });

  it('should find categories by type (income)', async () => {
    const list = await categories.findByType('income');
    assert.ok(Array.isArray(list), 'Result should be an array');
    // Our test categories are expense, so income list may be empty or have others
  });

  it('should return tree sorted by parentId then order', async () => {
    const tree = await categories.findTree();
    assert.ok(Array.isArray(tree), 'Result should be an array');

    const ours = tree.filter((c) => c.name.startsWith(TEST_PREFIX));
    // Root categories (null parentId) should come before children
    const rootIdx = ours.findIndex((c) => c.id === parentId);
    const childIdx = ours.findIndex((c) => c.id === childId);
    assert.ok(rootIdx >= 0, 'Root should be in tree');
    assert.ok(childIdx >= 0, 'Child should be in tree');
    assert.ok(
      rootIdx < childIdx,
      'Root categories should appear before children in tree order'
    );
  });

  it('should reject create with non-existent parentId', async () => {
    await assert.rejects(
      () =>
        categories.create({
          name: `${TEST_PREFIX}Orphan`,
          type: 'expense',
          parentId: 'non-existent-parent',
        }),
      /Parent category non-existent-parent not found/
    );
  });

  it('should reject create with inactive parent', async () => {
    // Create a category then deactivate it
    const tmp = await categories.create({
      name: `${TEST_PREFIX}TempParent`,
      type: 'expense',
    });
    await prisma.category.update({
      where: { id: tmp.id },
      data: { isActive: false },
    });

    await assert.rejects(
      () =>
        categories.create({
          name: `${TEST_PREFIX}Orphan2`,
          type: 'expense',
          parentId: tmp.id,
        }),
      /Parent category .+ not found or is inactive/
    );

    // Cleanup
    await prisma.category.delete({ where: { id: tmp.id } });
  });

  it('should update a category', async () => {
    const updated = await categories.update(parentId, {
      name: `${TEST_PREFIX}ПродуктыUpdated`,
      order: 5,
    });
    assert.strictEqual(updated.name, `${TEST_PREFIX}ПродуктыUpdated`);
    assert.strictEqual(updated.order, 5);
  });

  it('should throw when updating a non-existent category', async () => {
    await assert.rejects(
      () => categories.update('non-existent-id', { name: 'Foo' }),
      /Category with id non-existent-id not found/
    );
  });

  it('should reject self-parenting', async () => {
    await assert.rejects(
      () => categories.update(parentId, { parentId: parentId }),
      /Category cannot be its own parent/
    );
  });

  it('should reject update that would create a cycle', async () => {
    // parentId → childId chain exists
    // Trying to set parentId of parent to childId would create a cycle
    await assert.rejects(
      () => categories.update(parentId, { parentId: childId }),
      /would create a cycle/
    );
  });

  it('should reject delete when budget references exist', async () => {
    // Create a minimal Project and Budget to test referential integrity
    const cat = await categories.create({
      name: `${TEST_PREFIX}BudgetTest`,
      type: 'expense',
    });
    const projectId = randomUUID();
    await prisma.project.create({
      data: {
        id: projectId,
        externalNumber: `${TEST_PREFIX}BUDGET_PROJ`,
        name: `${TEST_PREFIX}BudgetProject`,
        updatedAt: new Date(),
      },
    });
    await prisma.budget.create({
      data: {
        id: randomUUID(),
        projectId,
        categoryId: cat.id,
        amount: 1000,
        period: '2026-06',
        updatedAt: new Date(),
      },
    });

    await assert.rejects(
      () => categories.delete(cat.id),
      /referenced by 1 budget/
    );

    // Cleanup: remove budget first, then project, then category
    await prisma.budget.deleteMany({ where: { categoryId: cat.id } });
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.category.delete({ where: { id: cat.id } });
  });

  it('should soft-delete a category (isActive = false)', async () => {
    // First delete the child so the parent can be deleted
    const deletedChild = await categories.delete(childId);
    assert.strictEqual(deletedChild.isActive, false);

    // Should not be found via normal queries
    const notFound = await categories.findUnique(childId);
    assert.strictEqual(notFound, null, 'Deactivated category should not be found');

    // But should still exist in database
    const stillExists = await prisma.category.findUnique({
      where: { id: childId },
    });
    assert.ok(stillExists, 'Category should still exist in DB');
    assert.strictEqual(stillExists?.isActive, false);
  });

  it('should throw when deleting already-deactivated category', async () => {
    await assert.rejects(
      () => categories.delete(childId),
      /Category with id .+ not found/
    );
  });

  it('should count active categories', async () => {
    const count = await categories.count();
    assert.strictEqual(typeof count, 'number');
    assert.ok(count >= 0);
  });

  it('should count with type filter', async () => {
    const count = await categories.count({ type: 'expense' });
    assert.strictEqual(typeof count, 'number');
    assert.ok(count >= 0);
  });

  // Final cleanup
  after(async () => {
    await prisma.category.deleteMany({
      where: { name: { startsWith: TEST_PREFIX } },
    });
    await prisma.$disconnect();
  });
});
