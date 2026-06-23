/**
 * ApprovalRequestRepository tests (S05)
 *
 * ensureUser() upserts dev users, so the test passes plain user ids.
 * Covers create (+owner notification), decide approve/reject (+requester notification),
 * findPending/findById, and error paths.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { approvals, ValidationError, NotFoundError } from './approvals.js';
import { prisma } from './prisma.js';

const TEST = 't05-appr-';
const MANAGER = `${TEST}manager`;
const OWNER = `${TEST}owner`;

async function cleanup() {
  await prisma.notification.deleteMany({ where: { userId: { startsWith: TEST } } }).catch(() => {});
  // Request ids are random UUIDs; delete by the TEST-prefixed requestedBy instead.
  await prisma.approvalRequest.deleteMany({ where: { requestedBy: { startsWith: TEST } } }).catch(() => {});
  await prisma.user.deleteMany({ where: { id: { startsWith: TEST } } }).catch(() => {});
}

describe('ApprovalRequestRepository', { concurrency: false }, () => {
  let requestId: string;

  before(async () => {
    await cleanup();
  });

  after(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('should create a pending request and notify the owner', async () => {
    const before = await prisma.notification.findMany({ where: { userId: OWNER } });
    const request = await approvals.create({
      type: 'payment',
      entityId: `${TEST}invoice-1`,
      amount: 5000,
      requestedBy: MANAGER,
      comment: 'Оплата счёта SUP-01',
      notifyUserId: OWNER,
    });
    assert.strictEqual(request.status, 'pending');
    assert.strictEqual(request.type, 'payment');
    assert.strictEqual(request.requestedBy, MANAGER);
    const after = await prisma.notification.findMany({ where: { userId: OWNER } });
    assert.strictEqual(after.length, before.length + 1, 'owner notified');
    requestId = request.id;
  });

  it('should find by id with requester', async () => {
    const result = await approvals.findById(requestId);
    assert.ok(result);
    assert.strictEqual(result?.id, requestId);
    assert.ok(result?.requester, 'requester user resolved');
    assert.strictEqual(result?.requester?.id, MANAGER);
  });

  it('should list pending', async () => {
    const pending = await approvals.findPending('payment');
    assert.ok(pending.some((r) => r.id === requestId));
  });

  it('should approve with a comment and notify the requester', async () => {
    const before = await prisma.notification.findMany({ where: { userId: MANAGER } });
    const result = await approvals.decide(requestId, {
      decision: 'approved',
      decidedBy: OWNER,
      comment: 'Ок, оплачиваем',
    });
    assert.strictEqual(result.status, 'approved');
    assert.strictEqual(result.decidedBy, OWNER);
    assert.ok(result.decidedAt);
    assert.strictEqual(result.comment, 'Ок, оплачиваем');
    const after = await prisma.notification.findMany({ where: { userId: MANAGER } });
    assert.strictEqual(after.length, before.length + 1, 'requester notified of decision');
  });

  it('should reject another request', async () => {
    const req = await approvals.create({
      type: 'payment',
      entityId: `${TEST}invoice-2`,
      requestedBy: MANAGER,
      notifyUserId: OWNER,
    });
    const result = await approvals.decide(req.id, { decision: 'rejected', decidedBy: OWNER });
    assert.strictEqual(result.status, 'rejected');
  });

  it('should refuse to decide an already-decided request', async () => {
    await assert.rejects(
      () => approvals.decide(requestId, { decision: 'approved', decidedBy: OWNER }),
      (err: Error) => err instanceof ValidationError
    );
  });

  it('should NotFoundError on decide for unknown id', async () => {
    await assert.rejects(
      () => approvals.decide(`${TEST}nope`, { decision: 'approved', decidedBy: OWNER }),
      (err: Error) => err instanceof NotFoundError
    );
  });

  it('should validate create input', async () => {
    await assert.rejects(
      () => approvals.create({ type: 'payment', entityId: '', requestedBy: '' }),
      (err: Error) => err instanceof ValidationError
    );
  });
});
