/**
 * ApprovalRequestRepository — payment approval workflow (S05)
 *
 * Mirrors the procurement repository pattern. ApprovalRequest is generic
 * (type + entityId) but S05 drives it as type='payment' from an approved invoice.
 *
 * Status machine (PROC-30): pending → approved | rejected.
 *
 * Dev-auth shim: ensureUser() idempotently upserts a User so the requestedBy/
 * decidedBy FKs resolve in dev (no real users/auth wired yet). Replace with real
 * auth context when available.
 *
 * Notifications (PROC-29): create() drops an in-app Notification for the owner;
 * decide() notifies the requester. Real email deferred to the worker.
 */

import { prisma } from './prisma';
import type { ApprovalRequest, User, Notification } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { NotFoundError, ValidationError } from './errors';

export { NotFoundError, ValidationError } from './errors';

export type ApprovalDecision = 'approved' | 'rejected';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

const DEFAULT_OWNER_ID = process.env.APPROVAL_OWNER_ID ?? 'owner';

export type ApprovalRequestCreateInput = {
  type: string; // 'payment'
  entityId: string; // invoice id
  amount?: number;
  requestedBy: string; // user id
  comment?: string;
  /** User to notify (the approver). Defaults to the configured owner. */
  notifyUserId?: string;
};

export type ApprovalDecisionInput = {
  decision: ApprovalDecision;
  decidedBy: string; // user id
  comment?: string;
};

export type ApprovalRequestWithRelations = ApprovalRequest & {
  requester?: User | null;
  decider?: User | null;
};

/** Idempotently ensure a dev User exists so FKs resolve. */
async function ensureUser(id: string, name?: string): Promise<User> {
  return prisma.user.upsert({
    where: { id },
    create: {
      id,
      email: `${id}@local.dev`,
      name: name ?? id,
      passwordHash: 'dev-no-auth',
      updatedAt: new Date(),
    },
    update: {},
  });
}

export class ApprovalRequestRepository {
  /**
   * Create a pending approval request and notify the owner (PROC-28/29).
   */
  async create(data: ApprovalRequestCreateInput): Promise<ApprovalRequest> {
    if (!data.type || !data.entityId || !data.requestedBy) {
      throw new ValidationError('type, entityId and requestedBy are required');
    }
    const requester = await ensureUser(data.requestedBy);
    const owner = await ensureUser(data.notifyUserId ?? DEFAULT_OWNER_ID, 'Owner');

    const request = await prisma.approvalRequest.create({
      data: {
        id: randomUUID(),
        type: data.type,
        entityId: data.entityId,
        status: 'pending',
        amount: data.amount,
        requestedBy: requester.id,
        comment: data.comment,
      },
    });

    // In-app notification to the owner (PROC-29). Email deferred to worker.
    await prisma.notification.create({
      data: {
        id: randomUUID(),
        userId: owner.id,
        type: 'approval_request',
        title: `Новая заявка на согласование (${data.type})`,
        message: data.comment
          ? `Заявка ${request.id.slice(0, 8)}: ${data.comment}`
          : `Заявка ${request.id.slice(0, 8)} ожидает согласования`,
        level: 'info',
        link: `/procurement/approvals/${request.id}`,
      },
    });

    return request;
  }

  async findById(id: string): Promise<ApprovalRequestWithRelations | null> {
    const request = await prisma.approvalRequest.findUnique({ where: { id } });
    if (!request) return null;
    // Relations are auto-named (User_ApprovalRequest_*); fetch users manually.
    const userIds = [request.requestedBy, ...(request.decidedBy ? [request.decidedBy] : [])];
    const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
    const userMap = new Map(users.map((u) => [u.id, u]));
    return {
      ...request,
      requester: userMap.get(request.requestedBy) ?? null,
      decider: request.decidedBy ? userMap.get(request.decidedBy) ?? null : null,
    };
  }

  async findMany(filters: { status?: ApprovalStatus | string; type?: string } = {}): Promise<ApprovalRequestWithRelations[]> {
    // Map the named relation includes; Prisma uses the relation alias names.
    const rows = await prisma.approvalRequest.findMany({
      where: { status: filters.status, type: filters.type },
      orderBy: { requestedAt: 'desc' },
    });
    // Fetch related users in one pass
    const userIds = new Set<string>();
    rows.forEach((r) => {
      userIds.add(r.requestedBy);
      if (r.decidedBy) userIds.add(r.decidedBy);
    });
    const users = await prisma.user.findMany({ where: { id: { in: [...userIds] } } });
    const userMap = new Map(users.map((u) => [u.id, u]));
    return rows.map((r) => ({
      ...r,
      requester: userMap.get(r.requestedBy) ?? null,
      decider: r.decidedBy ? userMap.get(r.decidedBy) ?? null : null,
    })) as ApprovalRequestWithRelations[];
  }

  async findPending(type?: string): Promise<ApprovalRequestWithRelations[]> {
    return this.findMany({ status: 'pending', type });
  }

  /**
   * Decide an approval: approve or reject with optional comment (PROC-30).
   * Notifies the requester of the decision.
   */
  async decide(id: string, input: ApprovalDecisionInput): Promise<ApprovalRequest> {
    if (!['approved', 'rejected'].includes(input.decision)) {
      throw new ValidationError(`Invalid decision: ${input.decision}`);
    }
    const request = await prisma.approvalRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundError('ApprovalRequest not found');
    if (request.status !== 'pending') {
      throw new ValidationError(`Request already ${request.status}`);
    }
    const decider = await ensureUser(input.decidedBy);

    const updated = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: input.decision,
        decidedBy: decider.id,
        decidedAt: new Date(),
        comment: input.comment,
      },
    });

    // Notify the requester of the decision
    await prisma.notification.create({
      data: {
        id: randomUUID(),
        userId: request.requestedBy,
        type: 'approval_decision',
        title: input.decision === 'approved' ? 'Заявка одобрена' : 'Заявка отклонена',
        message: `Заявка ${id.slice(0, 8)}: ${input.decision === 'approved' ? 'одобрена' : 'отклонена'}${input.comment ? ` — ${input.comment}` : ''}`,
        level: input.decision === 'approved' ? 'success' : 'warning',
        link: `/procurement/approvals/${id}`,
      },
    }).catch(() => {
      /* notification is best-effort */
    });

    return updated;
  }

  /** List notifications for a user (PROC-29 in-app surface). */
  async findNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

/** Singleton instance */
export const approvals = new ApprovalRequestRepository();
export default approvals;
