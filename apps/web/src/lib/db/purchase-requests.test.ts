/**
 * PurchaseRequestRepository tests
 *
 * Uses tsx + node:test. Creates test data in dev.db.
 * Covers CRUD, BOM grouping (PROC-07/11), email generation (PROC-13),
 * send→EmailLog (PROC-15), resend (PROC-16), status machine (PROC-17).
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { purchaseRequests, ValidationError, NotFoundError } from './purchase-requests.js';
import { bom } from './bom.js';
import { prisma } from './prisma.js';

const TEST = 't03-pr-';
const now = () => new Date();

async function cleanup() {
  // Order matters: children before parents. BOM/BOMItem ids are random UUIDs,
  // so delete BOM by projectId and BOMItem by id (both TEST-prefixed).
  await prisma.emailLog.deleteMany({ where: { projectId: { startsWith: TEST } } }).catch(() => {});
  await prisma.purchaseRequest.deleteMany({ where: { projectId: { startsWith: TEST } } }).catch(() => {});
  await prisma.purchaseRequestItem.deleteMany({ where: { id: { startsWith: TEST } } }).catch(() => {});
  await prisma.bOMItem.deleteMany({ where: { id: { startsWith: TEST } } }).catch(() => {});
  await prisma.bOM.deleteMany({ where: { projectId: { startsWith: TEST } } }).catch(() => {});
  await prisma.counterparty.deleteMany({ where: { id: { startsWith: TEST } } }).catch(() => {});
  await prisma.project.deleteMany({ where: { id: { startsWith: TEST } } }).catch(() => {});
}

describe('PurchaseRequestRepository', { concurrency: false }, () => {
  let projectId: string;
  let supplierAId: string;
  let supplierBId: string;
  let bomId: string;
  let requestId: string;

  before(async () => {
    await cleanup();

    projectId = `${TEST}project-1`;
    await prisma.project.upsert({
      where: { id: projectId },
      create: {
        id: projectId,
        externalNumber: `${TEST}ext-1`,
        name: 'Test Project PR',
        updatedAt: now(),
      },
      update: {},
    });

    // Two suppliers (A has email, B has no email — for send-error test)
    supplierAId = `${TEST}supplier-a`;
    supplierBId = `${TEST}supplier-b`;
    const mkSupplier = (id: string, name: string, email: string | null) =>
      prisma.counterparty.upsert({
        where: { id },
        create: { id, name, type: 'supplier', types: ['supplier'], email, updatedAt: now() },
        update: {},
      });
    await mkSupplier(supplierAId, 'Supplier A LLC', 'a@example.com');
    await mkSupplier(supplierBId, 'Supplier B LLC', null);

    // Locked BOM with items assigned to suppliers (+ one unassigned)
    const created = await bom.create({ projectId });
    bomId = created.id;
    const mkItem = (name: string, row: number, supplierId: string | null) =>
      prisma.bOMItem.create({
        data: {
          id: `${TEST}item-${row}`,
          bomId,
          rowNumber: row,
          name,
          quantity: row * 2,
          unit: 'шт',
          price: 100 * row,
          supplierId,
          status: 'pending',
          isFromWarehouse: false,
          updatedAt: now(),
        },
      });
    await mkItem('Widget', 1, supplierAId);
    await mkItem('Gadget', 2, supplierAId);
    await mkItem('Sprocket', 3, supplierBId);
    await mkItem('Unassigned Item', 4, null);
    await bom.lock(bomId);
  });

  after(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  // ─── Grouping (PROC-07/11) ─────────────────────────────

  it('should group a locked BOM by supplier, skipping unassigned items', async () => {
    const groups = await purchaseRequests.groupBOMBySupplier(bomId);
    assert.strictEqual(groups.length, 2, 'two suppliers should be grouped');
    const groupA = groups.find((g) => g.supplierId === supplierAId);
    const groupB = groups.find((g) => g.supplierId === supplierBId);
    assert.ok(groupA, 'supplier A group exists');
    assert.ok(groupB, 'supplier B group exists');
    assert.strictEqual(groupA!.items.length, 2, 'supplier A has 2 items');
    assert.strictEqual(groupB!.items.length, 1, 'supplier B has 1 item');
    assert.strictEqual(groupA!.supplier.name, 'Supplier A LLC');
  });

  it('should reject grouping an unlocked BOM', async () => {
    // Separate project + unlocked BOM
    const pid = `${TEST}project-unlocked`;
    await prisma.project.upsert({
      where: { id: pid },
      create: { id: pid, externalNumber: `${TEST}ext-u`, name: 'Unlocked', updatedAt: now() },
      update: {},
    });
    const unlocked = await bom.create({ projectId: pid });
    await assert.rejects(
      () => purchaseRequests.groupBOMBySupplier(unlocked.id),
      (err: Error) => err instanceof ValidationError && /locked/.test(err.message)
    );
  });

  // ─── CRUD ──────────────────────────────────────────────

  it('should create a PurchaseRequest with auto number and draft status', async () => {
    const result = await purchaseRequests.create({
      projectId,
      supplierId: supplierAId,
      items: [
        { bomItemId: `${TEST}item-1`, quantity: 2 },
        { bomItemId: `${TEST}item-2`, quantity: 4 },
      ],
    });
    assert.ok(result.id);
    assert.strictEqual(result.status, 'draft');
    assert.match(result.number, /^PR-\d{4}-[A-F0-9]{8}$/);
    assert.strictEqual(result.PurchaseRequestItem?.length, 2);
    requestId = result.id;
  });

  it('should find by id with includes', async () => {
    const result = await purchaseRequests.findById(requestId, true);
    assert.ok(result);
    assert.strictEqual(result?.id, requestId);
    assert.ok(result?.Counterparty);
    assert.strictEqual(result?.PurchaseRequestItem?.length, 2);
  });

  it('should filter by status via findMany', async () => {
    const draft = await purchaseRequests.findMany({ projectId, status: 'draft' });
    assert.ok(draft.some((r) => r.id === requestId));
  });

  // ─── Email (PROC-12/13/15/16) ──────────────────────────

  it('should generate email subject/body and populate emailTo', async () => {
    const content = await purchaseRequests.generateEmailContent(requestId);
    assert.ok(content.subject.includes('Test Project PR'));
    assert.ok(content.body.includes('Supplier A LLC'));
    assert.ok(content.body.includes('Widget'));
    assert.strictEqual(content.emailTo, 'a@example.com');
  });

  it('should send: write EmailLog (outbound), flip to sent', async () => {
    const { request, emailLog } = await purchaseRequests.send(requestId);
    assert.strictEqual(request.status, 'sent');
    assert.ok(request.sentAt);
    assert.strictEqual(emailLog.direction, 'outbound');
    assert.strictEqual(emailLog.to, 'a@example.com');
    assert.strictEqual(emailLog.supplierId, supplierAId);
    assert.strictEqual(emailLog.projectId, projectId);
  });

  it('should resend: create a new EmailLog and refresh sentAt', async () => {
    const before = await prisma.emailLog.findMany({ where: { supplierId: supplierAId } });
    const { request, emailLog } = await purchaseRequests.resend(requestId);
    const after = await prisma.emailLog.findMany({ where: { supplierId: supplierAId } });
    assert.strictEqual(after.length, before.length + 1, 'new EmailLog created');
    assert.strictEqual(request.status, 'sent');
    assert.ok(emailLog.id);
  });

  it('should refuse to send when supplier has no email', async () => {
    const req = await purchaseRequests.create({ projectId, supplierId: supplierBId });
    await assert.rejects(
      () => purchaseRequests.send(req.id),
      (err: Error) => err instanceof ValidationError && /email/i.test(err.message)
    );
  });

  // ─── Status machine (PROC-17) ──────────────────────────

  it('should reject invalid status transitions', async () => {
    // re-create a fresh draft request
    const req = await purchaseRequests.create({ projectId, supplierId: supplierAId });
    await assert.rejects(
      () => purchaseRequests.transitionStatus(req.id, 'responded'),
      (err: Error) => err instanceof ValidationError
    );
  });

  it('should allow sent → responded', async () => {
    const updated = await purchaseRequests.transitionStatus(requestId, 'responded', {
      responseAt: now(),
    });
    assert.strictEqual(updated.status, 'responded');
  });

  it('should return null for unknown id on findById', async () => {
    const gone = await purchaseRequests.findById(`${TEST}nope`);
    assert.strictEqual(gone, null);
  });

  it('should throw NotFoundError on transitionStatus for unknown request', async () => {
    await assert.rejects(
      () => purchaseRequests.transitionStatus(`${TEST}nope`, 'cancelled'),
      (err: Error) => err instanceof NotFoundError
    );
  });

  // ─── Items ─────────────────────────────────────────────

  it('should add and remove items', async () => {
    const item = await purchaseRequests.addItem(requestId, {
      bomItemId: `${TEST}item-3`,
      quantity: 6,
    });
    assert.ok(item.id);
    const items = await purchaseRequests.findItems(requestId);
    assert.ok(items.length >= 1);
    await purchaseRequests.removeItem(item.id);
    const after = await purchaseRequests.findItems(requestId);
    assert.ok(!after.some((i) => i.id === item.id));
  });

  // ─── Delete ────────────────────────────────────────────

  it('should delete a request (cascade items)', async () => {
    const req = await purchaseRequests.create({ projectId, supplierId: supplierAId });
    await purchaseRequests.delete(req.id);
    const gone = await purchaseRequests.findById(req.id);
    assert.strictEqual(gone, null);
  });
});
