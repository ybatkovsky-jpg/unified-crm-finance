/**
 * PurchaseRequestRepository — CRUD + grouping + email + status machine
 *
 * Mirrors BOMRepository / CounterpartyRepository: singleton, manual UUID, manual updatedAt.
 * PurchaseRequest is supplier-scoped (one request per supplier per grouping action).
 * PurchaseRequestItem is a child with onDelete: Cascade.
 *
 * Email "sending" in dev is LOG-BASED: send()/resend() write a row to EmailLog
 * (direction='outbound', linked to project + supplier) and flip status to 'sent'.
 * Real SMTP via the Python worker (PROC-14) is deferred — see M005-CONTEXT.
 */

import { prisma } from './prisma';
import type {
  PurchaseRequest,
  PurchaseRequestItem,
  BOMItem,
  Counterparty,
  Project,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';

export type PurchaseRequestStatus =
  | 'draft'
  | 'sent'
  | 'responded'
  | 'partial'
  | 'closed'
  | 'cancelled';

/** Valid status transitions (PROC-17). `sent` re-allows `sent` for resend. */
const VALID_TRANSITIONS: Record<PurchaseRequestStatus, PurchaseRequestStatus[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['responded', 'partial', 'closed', 'cancelled', 'sent'],
  responded: ['partial', 'closed', 'cancelled'],
  partial: ['closed', 'cancelled'],
  closed: [],
  cancelled: [],
};

const COMPANY_EMAIL = process.env.COMPANY_EMAIL ?? 'zakupki@company.local';

export type PurchaseRequestItemCreateInput = {
  bomItemId: string;
  quantity: number;
  price?: number;
  available?: boolean;
  availableQty?: number;
  deliveryDays?: number;
  notes?: string;
};

export type PurchaseRequestCreateInput = {
  projectId: string;
  supplierId: string;
  number?: string;
  emailTo?: string;
  emailSubject?: string;
  emailBody?: string;
  notes?: string;
  items?: PurchaseRequestItemCreateInput[];
};

export type PurchaseRequestUpdateInput = Omit<
  Prisma.PurchaseRequestUncheckedUpdateInput,
  'updatedAt' | 'status' | 'sentAt' | 'responseAt'
> & {
  updatedAt?: never;
};

/** Result of grouping a locked BOM's items by supplier. */
export type SupplierGroup = {
  supplierId: string;
  supplier: Counterparty;
  items: BOMItem[];
};

/** PurchaseRequest with optional relations included (findById/findMany include paths). */
export type PurchaseRequestWithRelations = PurchaseRequest & {
  Counterparty?: Counterparty | null;
  Project?: Project | null;
  PurchaseRequestItem?: (PurchaseRequestItem & { BOMItem?: BOMItem })[];
};

export class PurchaseRequestRepository {
  // ─── CRUD ───────────────────────────────────────────────

  /**
   * Create a PurchaseRequest with auto-generated number, status='draft', updatedAt.
   * Optionally nests PurchaseRequestItems.
   */
  async create(
    data: PurchaseRequestCreateInput
  ): Promise<PurchaseRequest & { PurchaseRequestItem?: PurchaseRequestItem[] }> {
    const { items, ...requestData } = data;
    return prisma.purchaseRequest.create({
      data: {
        ...requestData,
        id: randomUUID(),
        number: requestData.number ?? generateRequestNumber(),
        status: 'draft',
        updatedAt: new Date(),
        PurchaseRequestItem: items
          ? {
              create: items.map((item) => ({
                ...item,
                id: randomUUID(),
              })),
            }
          : undefined,
      },
      include: { PurchaseRequestItem: true },
    });
  }

  async findById(
    id: string,
    include = false
  ): Promise<PurchaseRequestWithRelations | null> {
    return prisma.purchaseRequest.findUnique({
      where: { id },
      include: include
        ? {
            PurchaseRequestItem: { include: { BOMItem: true } },
            Counterparty: true,
            Project: true,
          }
        : undefined,
    });
  }

  async findMany(filters: {
    projectId?: string;
    supplierId?: string;
    status?: PurchaseRequestStatus | string;
  } = {}): Promise<PurchaseRequestWithRelations[]> {
    return prisma.purchaseRequest.findMany({
      where: {
        projectId: filters.projectId,
        supplierId: filters.supplierId,
        status: filters.status,
      },
      orderBy: { createdAt: 'desc' },
      include: { Counterparty: true, Project: true },
    });
  }

  async update(id: string, data: PurchaseRequestUpdateInput): Promise<PurchaseRequest> {
    return prisma.purchaseRequest.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: string): Promise<PurchaseRequest> {
    return prisma.purchaseRequest.delete({ where: { id } });
  }

  // ─── Grouping (PROC-07, PROC-11) ───────────────────────

  /**
   * Group a BOM's items by supplierId. Requires the BOM to be locked.
   * Items without an assigned supplier are skipped (returned separately by the caller if desired).
   */
  async groupBOMBySupplier(bomId: string): Promise<SupplierGroup[]> {
    const bom = await prisma.bOM.findUnique({
      where: { id: bomId },
      include: { BOMItem: true, Project: true },
    });
    if (!bom) {
      throw new NotFoundError('BOM not found');
    }
    if (bom.status !== 'locked') {
      throw new ValidationError(
        `BOM must be locked before creating purchase requests (current status: ${bom.status})`
      );
    }

    const bySupplier = new Map<string, BOMItem[]>();
    for (const item of bom.BOMItem) {
      if (!item.supplierId) continue;
      const list = bySupplier.get(item.supplierId);
      if (list) list.push(item);
      else bySupplier.set(item.supplierId, [item]);
    }

    const groups: SupplierGroup[] = [];
    for (const [supplierId, items] of bySupplier) {
      const supplier = await prisma.counterparty.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) continue;
      groups.push({ supplierId, supplier, items });
    }
    return groups;
  }

  // ─── Email (PROC-12, PROC-13, PROC-15, PROC-16) ────────

  /**
   * Build the request email subject + body and persist them onto the request.
   * Idempotent — regenerates from current supplier/items/project each call.
   */
  async generateEmailContent(
    requestId: string
  ): Promise<{ subject: string; body: string; emailTo: string | null }> {
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      include: {
        Counterparty: true,
        Project: true,
        PurchaseRequestItem: { include: { BOMItem: true } },
      },
    });
    if (!request) throw new NotFoundError('PurchaseRequest not found');
    if (!request.Counterparty) throw new ValidationError('Request has no supplier');

    const bomItems = request.PurchaseRequestItem.map((pri) => pri.BOMItem);
    const { subject, body } = buildEmailContent(
      request.Counterparty,
      bomItems,
      request.Project?.name ?? request.projectId
    );

    const updated = await prisma.purchaseRequest.update({
      where: { id: requestId },
      data: {
        emailTo: request.Counterparty.email ?? null,
        emailSubject: subject,
        emailBody: body,
        updatedAt: new Date(),
      },
    });

    return {
      subject: updated.emailSubject!,
      body: updated.emailBody!,
      emailTo: updated.emailTo,
    };
  }

  /**
   * "Send" the request: ensure email content exists, write an EmailLog row
   * (direction='outbound', linked to project + supplier), flip status draft→sent.
   * Throws if supplier has no email or status is not 'draft'.
   */
  async send(
    requestId: string
  ): Promise<{ request: PurchaseRequest; emailLog: EmailLogRow }> {
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      include: { Counterparty: true },
    });
    if (!request) throw new NotFoundError('PurchaseRequest not found');
    if (!request.Counterparty) throw new ValidationError('Request has no supplier');
    if (!request.Counterparty.email) {
      throw new ValidationError('Supplier has no email address');
    }

    // (Re)generate content if missing
    if (!request.emailSubject || !request.emailBody) {
      await this.generateEmailContent(requestId);
    }
    const fresh = await prisma.purchaseRequest.findUnique({
      where: { id: requestId },
    });
    if (!fresh) throw new NotFoundError('PurchaseRequest not found');

    const now = new Date();
    const emailLog = await prisma.emailLog.create({
      data: {
        id: randomUUID(),
        projectId: fresh.projectId,
        supplierId: fresh.supplierId,
        direction: 'outbound',
        subject: fresh.emailSubject!,
        body: fresh.emailBody!,
        from: COMPANY_EMAIL,
        to: fresh.emailTo ?? request.Counterparty.email,
        sentAt: now,
      },
    });

    const updated = await this.transitionStatus(requestId, 'sent', { sentAt: now });
    return { request: updated, emailLog };
  }

  /**
   * Resend an already-sent request: writes a new EmailLog and refreshes sentAt.
   * Allowed from sent/responded/partial (PROC-16).
   */
  async resend(
    requestId: string
  ): Promise<{ request: PurchaseRequest; emailLog: EmailLogRow }> {
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      include: { Counterparty: true },
    });
    if (!request) throw new NotFoundError('PurchaseRequest not found');
    if (!['sent', 'responded', 'partial'].includes(request.status)) {
      throw new ValidationError(
        `Can only resend requests in sent/responded/partial (current: ${request.status})`
      );
    }
    if (!request.emailSubject || !request.emailBody) {
      await this.generateEmailContent(requestId);
    }
    const fresh = await prisma.purchaseRequest.findUnique({ where: { id: requestId } });
    if (!fresh) throw new NotFoundError('PurchaseRequest not found');

    const now = new Date();
    const emailLog = await prisma.emailLog.create({
      data: {
        id: randomUUID(),
        projectId: fresh.projectId,
        supplierId: fresh.supplierId,
        direction: 'outbound',
        subject: fresh.emailSubject!,
        body: fresh.emailBody!,
        from: COMPANY_EMAIL,
        to: fresh.emailTo ?? request.Counterparty?.email ?? '',
        sentAt: now,
      },
    });

    const updated = await prisma.purchaseRequest.update({
      where: { id: requestId },
      data: { sentAt: now, status: 'sent', updatedAt: now },
    });
    return { request: updated, emailLog };
  }

  // ─── Status machine (PROC-17) ──────────────────────────

  async transitionStatus(
    requestId: string,
    newStatus: PurchaseRequestStatus,
    extra: Partial<Pick<PurchaseRequest, 'sentAt' | 'responseAt'>> = {}
  ): Promise<PurchaseRequest> {
    const request = await prisma.purchaseRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundError('PurchaseRequest not found');
    const allowed = VALID_TRANSITIONS[request.status as PurchaseRequestStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition: ${request.status} → ${newStatus}`
      );
    }
    return prisma.purchaseRequest.update({
      where: { id: requestId },
      data: { status: newStatus, updatedAt: new Date(), ...extra },
    });
  }

  // ─── Items ─────────────────────────────────────────────

  async addItem(
    requestId: string,
    item: PurchaseRequestItemCreateInput
  ): Promise<PurchaseRequestItem> {
    return prisma.purchaseRequestItem.create({
      data: { ...item, id: randomUUID(), requestId },
    });
  }

  async findItems(requestId: string): Promise<PurchaseRequestItem[]> {
    return prisma.purchaseRequestItem.findMany({
      where: { requestId },
      include: { BOMItem: true },
      orderBy: { BOMItem: { rowNumber: 'asc' } },
    });
  }

  async removeItem(itemId: string): Promise<PurchaseRequestItem> {
    return prisma.purchaseRequestItem.delete({ where: { id: itemId } });
  }
}

// ─── Helpers ──────────────────────────────────────────────

function generateRequestNumber(): string {
  const year = new Date().getFullYear();
  return `PR-${year}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function buildEmailContent(
  supplier: Counterparty,
  items: BOMItem[],
  projectName: string
): { subject: string; body: string } {
  const subject = `Запрос коммерческого предложения по проекту «${projectName}»`;
  const itemLines = items
    .map((it, i) => {
      const article = it.article ? ` (арт. ${it.article})` : '';
      return `${i + 1}. ${it.name}${article} — ${it.quantity} ${it.unit}`;
    })
    .join('\n');
  const body = [
    `Добрый день, ${supplier.name}!`,
    '',
    `Прошу выставить счёт на следующие позиции по проекту «${projectName}»:`,
    '',
    itemLines,
    '',
    'С уважением,',
    'Команда закупок',
  ].join('\n');
  return { subject, body };
}

// Avoid importing the full EmailLog type just for a return annotation alias.
type EmailLogRow = {
  id: string;
  projectId: string | null;
  supplierId: string | null;
  direction: string;
  subject: string;
  body: string;
  from: string;
  to: string;
  sentAt: Date;
};

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** Singleton instance */
export const purchaseRequests = new PurchaseRequestRepository();
export default purchaseRequests;
