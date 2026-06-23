/**
 * InvoiceRepository tests (S04 manual MVP)
 *
 * Uses tsx + node:test. Creates test data in dev.db.
 * Covers CRUD, total recompute, manual matching (match/unmatch/mismatch),
 * status machine (received→verified/discrepancy→approved), items, cascade.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { invoices, ValidationError, NotFoundError } from './invoices.js';
import { bom } from './bom.js';
import { prisma } from './prisma.js';

const TEST = 't04-inv-';
const now = () => new Date();

async function cleanup() {
  await prisma.invoiceItem.deleteMany({ where: { id: { startsWith: TEST } } }).catch(() => {});
  await prisma.invoice.deleteMany({ where: { projectId: { startsWith: TEST } } }).catch(() => {});
  await prisma.bOMItem.deleteMany({ where: { id: { startsWith: TEST } } }).catch(() => {});
  await prisma.bOM.deleteMany({ where: { projectId: { startsWith: TEST } } }).catch(() => {});
  await prisma.counterparty.deleteMany({ where: { id: { startsWith: TEST } } }).catch(() => {});
  await prisma.project.deleteMany({ where: { id: { startsWith: TEST } } }).catch(() => {});
}

describe('InvoiceRepository', { concurrency: false }, () => {
  let projectId: string;
  let supplierId: string;
  let bomItem1Id: string;
  let bomItem2Id: string;
  let invoiceId: string;
  let item1Id: string;
  let item2Id: string;

  before(async () => {
    await cleanup();

    projectId = `${TEST}project-1`;
    await prisma.project.upsert({
      where: { id: projectId },
      create: { id: projectId, externalNumber: `${TEST}ext-1`, name: 'Test Project INV', updatedAt: now() },
      update: {},
    });

    supplierId = `${TEST}supplier-1`;
    await prisma.counterparty.upsert({
      where: { id: supplierId },
      create: { id: supplierId, name: 'Inv Supplier', type: 'supplier', types: ['supplier'], email: 'inv@s.com', updatedAt: now() },
      update: {},
    });

    // BOM (draft is fine — matching is against BOMItem directly) with 2 items
    const created = await bom.create({ projectId });
    const mkItem = (name: string, row: number) =>
      prisma.bOMItem.create({
        data: {
          id: `${TEST}bomitem-${row}`,
          bomId: created.id,
          rowNumber: row,
          name,
          quantity: 10,
          unit: 'шт',
          price: 100,
          supplierId,
          status: 'pending',
          isFromWarehouse: false,
          updatedAt: now(),
        },
      });
    const bi1 = await mkItem('Widget', 1);
    const bi2 = await mkItem('Gadget', 2);
    bomItem1Id = bi1.id;
    bomItem2Id = bi2.id;
  });

  after(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  // ─── CRUD ──────────────────────────────────────────────

  it('should create an invoice with auto number, received status, computed total', async () => {
    const result = await invoices.create({
      projectId,
      supplierId,
      invoiceNumber: 'SUP-2026-01',
      items: [
        { name: 'Widget line', quantity: 10, price: 100 },
        { name: 'Gadget line', quantity: 5, price: 200 },
      ],
    });
    assert.ok(result.id);
    assert.strictEqual(result.status, 'received');
    assert.match(result.number, /^INV-\d{4}-[A-F0-9]{8}$/);
    assert.strictEqual(result.InvoiceItem?.length, 2);
    // total = 10*100 + 5*200 = 2000
    assert.strictEqual(result.totalAmount, 2000);
    invoiceId = result.id;
    item1Id = result.InvoiceItem![0].id;
    item2Id = result.InvoiceItem![1].id;
  });

  it('should find by id with includes', async () => {
    const result = await invoices.findById(invoiceId, true);
    assert.ok(result);
    assert.strictEqual(result?.id, invoiceId);
    assert.ok(result?.Counterparty);
    assert.strictEqual(result?.InvoiceItem?.length, 2);
  });

  it('should filter by status via findMany', async () => {
    const list = await invoices.findMany({ projectId, status: 'received' });
    assert.ok(list.some((i) => i.id === invoiceId));
  });

  it('should recompute total', async () => {
    await invoices.addItem(invoiceId, { name: 'Extra', quantity: 2, price: 50 });
    const updated = await invoices.recomputeTotal(invoiceId);
    // 2000 + 2*50 = 2100
    assert.strictEqual(updated.totalAmount, 2100);
    await invoices.removeItem((await invoices.findItems(invoiceId)).find((i) => i.name === 'Extra')!.id);
  });

  // ─── Matching (PROC-24) ────────────────────────────────

  it('should match an invoice item to a BOM item', async () => {
    const matched = await invoices.matchItem(item1Id, bomItem1Id);
    assert.strictEqual(matched.bomItemId, bomItem1Id);
    assert.strictEqual(matched.isMatch, true);
    assert.strictEqual(matched.mismatchReason, null);
  });

  it('should set a mismatch with reason', async () => {
    const mismatched = await invoices.setMismatch(item2Id, 'price differs');
    assert.strictEqual(mismatched.isMatch, false);
    assert.strictEqual(mismatched.mismatchReason, 'price differs');
  });

  it('should unmatch an invoice item', async () => {
    const unmatched = await invoices.unmatchItem(item1Id);
    assert.strictEqual(unmatched.bomItemId, null);
    assert.strictEqual(unmatched.isMatch, false);
  });

  // ─── Status machine (PROC-23/25) ───────────────────────

  it('recomputeStatus → discrepancy when not all matched', async () => {
    // item1 unmatched, item2 mismatched → discrepancy
    const result = await invoices.recomputeStatus(invoiceId);
    assert.strictEqual(result.status, 'discrepancy');
  });

  it('recomputeStatus → verified when all matched', async () => {
    await invoices.matchItem(item1Id, bomItem1Id);
    await invoices.matchItem(item2Id, bomItem2Id); // match clears mismatch
    const result = await invoices.recomputeStatus(invoiceId);
    assert.strictEqual(result.status, 'verified');
  });

  it('approve → approved from verified', async () => {
    const result = await invoices.approve(invoiceId);
    assert.strictEqual(result.status, 'approved');
  });

  it('should refuse to approve a received invoice', async () => {
    const inv = await invoices.create({ projectId, supplierId });
    await assert.rejects(
      () => invoices.approve(inv.id),
      (err: Error) => err instanceof ValidationError
    );
  });

  it('should return null for unknown id, and NotFoundError on approve', async () => {
    assert.strictEqual(await invoices.findById(`${TEST}nope`), null);
    await assert.rejects(
      () => invoices.approve(`${TEST}nope`),
      (err: Error) => err instanceof NotFoundError
    );
  });

  it('should reject reconcile on empty invoice', async () => {
    const inv = await invoices.create({ projectId, supplierId });
    await assert.rejects(
      () => invoices.recomputeStatus(inv.id),
      (err: Error) => err instanceof ValidationError && /no items/i.test(err.message)
    );
  });

  // ─── Items ─────────────────────────────────────────────

  it('should add, update, remove items', async () => {
    const item = await invoices.addItem(invoiceId, { name: 'New line', quantity: 1, price: 10 });
    assert.ok(item.id);
    const updated = await invoices.updateItem(item.id, { quantity: 3 });
    assert.strictEqual(updated.quantity, 3);
    await invoices.removeItem(item.id);
  });

  // ─── Delete ────────────────────────────────────────────

  it('should delete an invoice (cascade items)', async () => {
    const inv = await invoices.create({ projectId, supplierId, items: [{ name: 'x', quantity: 1 }] });
    await invoices.delete(inv.id);
    assert.strictEqual(await invoices.findById(inv.id), null);
  });
});
