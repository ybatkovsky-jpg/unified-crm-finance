/**
 * WarehouseRepository tests (S06)
 *
 * Covers item CRUD, atomic transactions (in/out/reserve/release), negative-stock
 * guards, findLowStock, and cascade delete.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { warehouse, ValidationError, NotFoundError } from './warehouse.js';
import { prisma } from './prisma.js';

const TEST = 't06-wh-';

async function cleanup() {
  // Items have TEST-prefixed names; deleting them cascades their transactions.
  await prisma.warehouseTransaction.deleteMany({ where: { id: { startsWith: TEST } } }).catch(() => {});
  await prisma.warehouseItem.deleteMany({ where: { name: { startsWith: TEST } } }).catch(() => {});
}

describe('WarehouseRepository', { concurrency: false }, () => {
  let itemId: string;

  before(async () => {
    await cleanup();
  });

  after(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('should create an item with computed availableQty', async () => {
    const item = await warehouse.create({
      name: `${TEST}Widget`,
      quantity: 100,
      reservedQty: 20,
      minQuantity: 10,
    });
    assert.strictEqual(item.quantity, 100);
    assert.strictEqual(item.reservedQty, 20);
    assert.strictEqual(item.availableQty, 80);
    assert.strictEqual(item.minQuantity, 10);
    itemId = item.id;
  });

  it('should find by id', async () => {
    const item = await warehouse.findById(itemId);
    assert.ok(item);
    assert.strictEqual(item?.id, itemId);
  });

  it('should apply a приём (in) transaction', async () => {
    const { item, transaction } = await warehouse.applyTransaction(itemId, {
      type: 'in',
      quantity: 50,
    });
    assert.strictEqual(item.quantity, 150);
    assert.strictEqual(item.availableQty, 130);
    assert.strictEqual(transaction.type, 'in');
    assert.strictEqual(transaction.quantity, 50);
  });

  it('should apply a резерв (reserve) transaction', async () => {
    const { item } = await warehouse.applyTransaction(itemId, {
      type: 'reserve',
      quantity: 30,
    });
    assert.strictEqual(item.reservedQty, 50);
    assert.strictEqual(item.availableQty, 100);
  });

  it('should apply a разрезерв (release) transaction', async () => {
    const { item } = await warehouse.applyTransaction(itemId, {
      type: 'release',
      quantity: 20,
    });
    assert.strictEqual(item.reservedQty, 30);
    assert.strictEqual(item.availableQty, 120);
  });

  it('should apply a расход (out) transaction', async () => {
    const { item } = await warehouse.applyTransaction(itemId, {
      type: 'out',
      quantity: 40,
    });
    // quantity 150-40=110, available 120-40=80
    assert.strictEqual(item.quantity, 110);
    assert.strictEqual(item.availableQty, 80);
  });

  it('should guard against расход exceeding available stock', async () => {
    const before = await warehouse.findById(itemId);
    await assert.rejects(
      () => warehouse.applyTransaction(itemId, { type: 'out', quantity: before!.availableQty + 1 }),
      (err: Error) => err instanceof ValidationError && /Insufficient available/i.test(err.message)
    );
    // State unchanged after failed tx
    const after = await warehouse.findById(itemId);
    assert.strictEqual(after?.availableQty, before!.availableQty);
  });

  it('should guard against резерв exceeding available stock', async () => {
    const before = await warehouse.findById(itemId);
    await assert.rejects(
      () => warehouse.applyTransaction(itemId, { type: 'reserve', quantity: before!.availableQty + 1 }),
      (err: Error) => err instanceof ValidationError
    );
  });

  it('should reject invalid transaction type / non-positive quantity', async () => {
    await assert.rejects(
      () => warehouse.applyTransaction(itemId, { type: 'shrink' as never, quantity: 1 }),
      (err: Error) => err instanceof ValidationError
    );
    await assert.rejects(
      () => warehouse.applyTransaction(itemId, { type: 'in', quantity: 0 }),
      (err: Error) => err instanceof ValidationError
    );
  });

  it('should NotFoundError on transaction for unknown item', async () => {
    await assert.rejects(
      () => warehouse.applyTransaction(`${TEST}nope`, { type: 'in', quantity: 1 }),
      (err: Error) => err instanceof NotFoundError
    );
  });

  it('should find low-stock items', async () => {
    // item availableQty=80, minQuantity=10 → not low. Create a low one.
    const low = await warehouse.create({ name: `${TEST}LowItem`, quantity: 5, reservedQty: 0, minQuantity: 10 });
    const lowStock = await warehouse.findLowStock();
    assert.ok(lowStock.some((i) => i.id === low.id));
  });

  it('should update minQuantity', async () => {
    const updated = await warehouse.update(itemId, { minQuantity: 75 });
    assert.strictEqual(updated.minQuantity, 75);
  });

  it('should record transaction history', async () => {
    const txs = await warehouse.findTransactions(itemId);
    assert.ok(txs.length >= 4, 'at least the 4 successful transactions recorded');
  });

  it('should delete an item (cascade transactions)', async () => {
    const item = await warehouse.create({ name: `${TEST}ToDelete`, quantity: 10 });
    await warehouse.applyTransaction(item.id, { type: 'in', quantity: 5 });
    await warehouse.delete(item.id);
    assert.strictEqual(await warehouse.findById(item.id), null);
  });
});
