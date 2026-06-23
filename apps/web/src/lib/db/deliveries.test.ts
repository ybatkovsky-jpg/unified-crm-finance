/**
 * DeliveryRepository tests (S07)
 *
 * Covers create, status machine (pending→shipped→in_transit→delivered), the
 * invalid-transition guard, the delivered→terminal guard, and the delivered
 * auto-warehouse-update integration (find-or-create + 'in' transaction).
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { deliveries, ValidationError, NotFoundError } from './deliveries.js';
import { warehouse } from './warehouse.js';
import { bom } from './bom.js';
import { prisma } from './prisma.js';

const TEST = 't07-del-';
const now = () => new Date();
const WIDGET_NAME = `${TEST}Widget`;

async function cleanup() {
  await prisma.delivery.deleteMany({ where: { projectId: { startsWith: TEST } } }).catch(() => {});
  await prisma.warehouseTransaction.deleteMany({ where: { id: { startsWith: TEST } } }).catch(() => {});
  await prisma.warehouseItem.deleteMany({ where: { name: { startsWith: TEST } } }).catch(() => {});
  await prisma.invoice.deleteMany({ where: { projectId: { startsWith: TEST } } }).catch(() => {});
  await prisma.bOMItem.deleteMany({ where: { id: { startsWith: TEST } } }).catch(() => {});
  await prisma.bOM.deleteMany({ where: { projectId: { startsWith: TEST } } }).catch(() => {});
  await prisma.counterparty.deleteMany({ where: { id: { startsWith: TEST } } }).catch(() => {});
  await prisma.project.deleteMany({ where: { id: { startsWith: TEST } } }).catch(() => {});
}

describe('DeliveryRepository', { concurrency: false }, () => {
  let projectId: string;
  let supplierId: string;
  let invoiceId: string;
  let deliveryId: string;

  before(async () => {
    await cleanup();

    projectId = `${TEST}project-1`;
    await prisma.project.upsert({
      where: { id: projectId },
      create: { id: projectId, externalNumber: `${TEST}ext`, name: 'Delivery Project', updatedAt: now() },
      update: {},
    });
    supplierId = `${TEST}supplier-1`;
    await prisma.counterparty.upsert({
      where: { id: supplierId },
      create: { id: supplierId, name: 'Del Supplier', type: 'supplier', types: ['supplier'], updatedAt: now() },
      update: {},
    });

    // BOM + 1 BOMItem, then an Invoice with 1 item linked to that BOMItem
    const createdBom = await bom.create({ projectId });
    const bomItem = await prisma.bOMItem.create({
      data: {
        id: `${TEST}bomitem-1`,
        bomId: createdBom.id,
        rowNumber: 1,
        name: WIDGET_NAME,
        article: `${TEST}-ART`,
        quantity: 10,
        unit: 'шт',
        price: 100,
        supplierId,
        status: 'pending',
        isFromWarehouse: false,
        updatedAt: now(),
      },
    });
    const invoice = await prisma.invoice.create({
      data: {
        id: `${TEST}invoice-1`,
        number: `${TEST}INV`,
        projectId,
        supplierId,
        status: 'approved',
        updatedAt: now(),
        InvoiceItem: {
          create: [{ id: `${TEST}iitem-1`, name: WIDGET_NAME, quantity: 10, price: 100, bomItemId: bomItem.id }],
        },
      },
    });
    invoiceId = invoice.id;
  });

  after(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('should create a pending delivery', async () => {
    const d = await deliveries.create({ projectId, supplierId, invoiceId });
    assert.strictEqual(d.status, 'pending');
    assert.strictEqual(d.invoiceId, invoiceId);
    deliveryId = d.id;
  });

  it('should find by id with relations', async () => {
    const d = await deliveries.findById(deliveryId);
    assert.ok(d);
    assert.ok(d?.Invoice);
    assert.strictEqual(d?.Invoice?.id, invoiceId);
  });

  it('should filter by status via findMany', async () => {
    const list = await deliveries.findMany({ projectId, status: 'pending' });
    assert.ok(list.some((x) => x.id === deliveryId));
  });

  it('should transition pending → shipped → in_transit', async () => {
    let d = await deliveries.transitionStatus(deliveryId, 'shipped');
    assert.strictEqual(d.status, 'shipped');
    d = await deliveries.transitionStatus(deliveryId, 'in_transit');
    assert.strictEqual(d.status, 'in_transit');
  });

  it('should reject an invalid transition (in_transit → pending)', async () => {
    await assert.rejects(
      () => deliveries.transitionStatus(deliveryId, 'pending'),
      (err: Error) => err instanceof ValidationError
    );
  });

  it('on delivered: set actualDate + auto-update warehouse (find-or-create + in)', async () => {
    const d = await deliveries.transitionStatus(deliveryId, 'delivered');
    assert.strictEqual(d.status, 'delivered');
    assert.ok(d.actualDate);

    // A warehouse item should now exist for the invoice item, with quantity 10
    const whItems = await warehouse.findMany({ search: WIDGET_NAME });
    const wh = whItems.find((w) => w.name === WIDGET_NAME);
    assert.ok(wh, 'warehouse item created on delivery');
    assert.strictEqual(wh!.quantity, 10);
  });

  it('should treat delivered as terminal', async () => {
    await assert.rejects(
      () => deliveries.transitionStatus(deliveryId, 'shipped'),
      (err: Error) => err instanceof ValidationError
    );
  });

  it('should support cancel from pending (separate delivery)', async () => {
    const d = await deliveries.create({ projectId, supplierId });
    const cancelled = await deliveries.transitionStatus(d.id, 'cancelled');
    assert.strictEqual(cancelled.status, 'cancelled');
  });

  it('should update tracking metadata', async () => {
    const d = await deliveries.create({ projectId, supplierId });
    const updated = await deliveries.update(d.id, { trackingNumber: 'TRACK-123', carrier: 'СДЭК' });
    assert.strictEqual(updated.trackingNumber, 'TRACK-123');
    assert.strictEqual(updated.carrier, 'СДЭК');
  });

  it('should NotFoundError on transition for unknown id', async () => {
    await assert.rejects(
      () => deliveries.transitionStatus(`${TEST}nope`, 'shipped'),
      (err: Error) => err instanceof NotFoundError
    );
  });
});
