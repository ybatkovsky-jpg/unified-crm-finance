/**
 * InvoiceRepository — CRUD + manual reconciliation + status machine (S04 MVP)
 *
 * Mirrors BOMRepository / PurchaseRequestRepository: singleton, manual UUID, manual updatedAt.
 * Invoice is supplier+project scoped; InvoiceItem is a child with onDelete: Cascade.
 *
 * Reconciliation model: each InvoiceItem can be linked to a BOMItem via `bomItemId`
 * with `isMatch`/`mismatchReason`. recomputeStatus() flips the invoice to
 * `verified` (all matched) or `discrepancy` (any mismatch). approve() → `approved`.
 *
 * AI parsing / IMAP / fuzzy matching (PROC-20/21/22) are deferred — this is the
 * manual path (PROC-24/26/27/25).
 */

import { prisma } from './prisma';
import type {
  Invoice,
  InvoiceItem,
  BOMItem,
  Counterparty,
  Project,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { NotFoundError, ValidationError } from './errors';

export { NotFoundError, ValidationError, ConflictError } from './errors';

export type InvoiceStatus = 'received' | 'verified' | 'discrepancy' | 'approved';

const VALID_STATUSES: InvoiceStatus[] = ['received', 'verified', 'discrepancy', 'approved'];

export type InvoiceItemCreateInput = {
  bomItemId?: string | null;
  name: string;
  quantity: number;
  price?: number;
  isMatch?: boolean;
  mismatchReason?: string | null;
};

export type InvoiceCreateInput = {
  projectId: string;
  supplierId: string;
  number?: string;
  invoiceNumber?: string;
  totalAmount?: number;
  dueDate?: Date;
  notes?: string;
  sourceFileId?: string;
  items?: InvoiceItemCreateInput[];
};

export type InvoiceUpdateInput = Omit<
  Prisma.InvoiceUncheckedUpdateInput,
  'updatedAt' | 'status' | 'totalAmount' | 'paidAt'
> & {
  updatedAt?: never;
};

/** Invoice with optional relations (findById/findMany include paths). */
export type InvoiceWithRelations = Invoice & {
  Counterparty?: Counterparty | null;
  Project?: Project | null;
  InvoiceItem?: (InvoiceItem & { BOMItem?: BOMItem | null })[];
};

export class InvoiceRepository {
  // ─── CRUD ───────────────────────────────────────────────

  async create(
    data: InvoiceCreateInput
  ): Promise<Invoice & { InvoiceItem?: InvoiceItem[] }> {
    const { items, ...invoiceData } = data;
    const created = await prisma.invoice.create({
      data: {
        ...invoiceData,
        id: randomUUID(),
        number: invoiceData.number ?? generateInvoiceNumber(),
        status: 'received',
        updatedAt: new Date(),
        InvoiceItem: items
          ? {
              create: items.map((item) => ({ ...item, id: randomUUID() })),
            }
          : undefined,
      },
      include: { InvoiceItem: true },
    });

    // Recompute total from items if items were provided, then return with items included
    if (items && items.length > 0) {
      await this.recomputeTotal(created.id);
      const withItems = await prisma.invoice.findUnique({
        where: { id: created.id },
        include: { InvoiceItem: true },
      });
      return (withItems ?? created) as Invoice & { InvoiceItem: InvoiceItem[] };
    }
    return created;
  }

  async findById(id: string, include = false): Promise<InvoiceWithRelations | null> {
    return prisma.invoice.findUnique({
      where: { id },
      include: include
        ? {
            InvoiceItem: { include: { BOMItem: true } },
            Counterparty: true,
            Project: true,
          }
        : undefined,
    });
  }

  async findMany(filters: {
    projectId?: string;
    supplierId?: string;
    status?: InvoiceStatus | string;
  } = {}): Promise<InvoiceWithRelations[]> {
    // Явная аннотация типа нужна, чтобы разорвать рекурсивный вывод типов
    // (query-extension $extends + спред локального типа → TS2321 excessive stack depth).
    const args: Prisma.InvoiceFindManyArgs = {
      where: {
        projectId: filters.projectId,
        supplierId: filters.supplierId,
        status: filters.status,
      },
      orderBy: { createdAt: 'desc' },
      include: { Counterparty: true, Project: true },
    };
    return prisma.invoice.findMany(args) as Promise<InvoiceWithRelations[]>;
  }

  async update(id: string, data: InvoiceUpdateInput): Promise<Invoice> {
    return prisma.invoice.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: string): Promise<Invoice> {
    return prisma.invoice.delete({ where: { id } });
  }

  // ─── Totals & reconciliation ────────────────────────────

  /** Sum item qty*price and persist to totalAmount. Returns the updated invoice. */
  async recomputeTotal(id: string): Promise<Invoice> {
    const items = await prisma.invoiceItem.findMany({ where: { invoiceId: id } });
    const total = items.reduce((sum, it) => sum + (it.quantity || 0) * Number(it.price || 0), 0);
    return prisma.invoice.update({
      where: { id },
      data: { totalAmount: total, updatedAt: new Date() },
    });
  }

  /**
   * Match an invoice line to an ordered (BOM) item.
   * Sets bomItemId + isMatch=true, clears mismatchReason.
   */
  async matchItem(invoiceItemId: string, bomItemId: string): Promise<InvoiceItem> {
    const item = await prisma.invoiceItem.findUnique({ where: { id: invoiceItemId } });
    if (!item) throw new NotFoundError('InvoiceItem not found');
    const bomItem = await prisma.bOMItem.findUnique({ where: { id: bomItemId } });
    if (!bomItem) throw new NotFoundError('BOMItem not found');

    return prisma.invoiceItem.update({
      where: { id: invoiceItemId },
      data: { bomItemId, isMatch: true, mismatchReason: null },
    });
  }

  /** Remove the match from an invoice line. */
  async unmatchItem(invoiceItemId: string): Promise<InvoiceItem> {
    const item = await prisma.invoiceItem.findUnique({ where: { id: invoiceItemId } });
    if (!item) throw new NotFoundError('InvoiceItem not found');
    return prisma.invoiceItem.update({
      where: { id: invoiceItemId },
      data: { bomItemId: null, isMatch: false, mismatchReason: null },
    });
  }

  /** Mark an invoice line as a mismatch with a reason (qty/price/name difference). */
  async setMismatch(invoiceItemId: string, reason: string): Promise<InvoiceItem> {
    const item = await prisma.invoiceItem.findUnique({ where: { id: invoiceItemId } });
    if (!item) throw new NotFoundError('InvoiceItem not found');
    return prisma.invoiceItem.update({
      where: { id: invoiceItemId },
      data: { isMatch: false, mismatchReason: reason },
    });
  }

  /**
   * Recompute invoice status from item match state (PROC-23):
   * all matched → verified; any unmatched/mismatched → discrepancy.
   */
  async recomputeStatus(id: string): Promise<Invoice> {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { InvoiceItem: true },
    });
    if (!invoice) throw new NotFoundError('Invoice not found');
    if (invoice.InvoiceItem.length === 0) {
      throw new ValidationError('Cannot reconcile an invoice with no items');
    }
    const allMatched = invoice.InvoiceItem.every((it) => it.isMatch);
    const status: InvoiceStatus = allMatched ? 'verified' : 'discrepancy';
    return prisma.invoice.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });
  }

  /**
   * Approve the invoice (PROC-25). Allowed from verified or discrepancy.
   */
  async approve(id: string): Promise<Invoice> {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundError('Invoice not found');
    if (!['verified', 'discrepancy'].includes(invoice.status)) {
      throw new ValidationError(
        `Can only approve verified/discrepancy invoices (current: ${invoice.status})`
      );
    }
    return prisma.invoice.update({
      where: { id },
      data: { status: 'approved', updatedAt: new Date() },
    });
  }

  /** Explicit status transition with basic validation. */
  async transitionStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    if (!VALID_STATUSES.includes(status)) {
      throw new ValidationError(`Invalid status: ${status}`);
    }
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundError('Invoice not found');
    return prisma.invoice.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });
  }

  // ─── Items ─────────────────────────────────────────────

  async addItem(invoiceId: string, item: InvoiceItemCreateInput): Promise<InvoiceItem> {
    return prisma.invoiceItem.create({
      data: { ...item, id: randomUUID(), invoiceId },
    });
  }

  async findItems(invoiceId: string): Promise<(InvoiceItem & { BOMItem?: BOMItem | null })[]> {
    return prisma.invoiceItem.findMany({
      where: { invoiceId },
      include: { BOMItem: true },
    });
  }

  async updateItem(
    id: string,
    data: Partial<Omit<InvoiceItemCreateInput, 'name'>> & { name?: string }
  ): Promise<InvoiceItem> {
    return prisma.invoiceItem.update({ where: { id }, data });
  }

  async removeItem(id: string): Promise<InvoiceItem> {
    return prisma.invoiceItem.delete({ where: { id } });
  }
}

// ─── Helpers ──────────────────────────────────────────────

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  return `INV-${year}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

/** Singleton instance */
export const invoices = new InvoiceRepository();
export default invoices;
