/**
 * DeliveryRepository — deliveries + status machine + auto warehouse update (S07)
 *
 * Mirrors the procurement repository pattern; reuses shared lib/db/errors.ts.
 *
 * Status machine: pending → shipped → in_transit → delivered (+ cancelled from
 * any pre-delivered state).
 *
 * On transition to `delivered`, deliver() sets actualDate and, for each invoice
 * item linked to a BOMItem, find-or-creates a WarehouseItem (match by article,
 * then name) and applies an `in` transaction — closing the procurement loop into
 * the warehouse (S06 integration). A delivered guard prevents double-processing.
 */

import { prisma } from './prisma';
import type { Delivery, Counterparty, Project, Invoice, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { NotFoundError, ValidationError } from './errors';
import { warehouse } from './warehouse';

export { NotFoundError, ValidationError } from './errors';

export type DeliveryStatus = 'pending' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled';

const VALID_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ['shipped', 'in_transit', 'delivered', 'cancelled'],
  shipped: ['in_transit', 'delivered', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export type DeliveryCreateInput = {
  projectId: string;
  supplierId: string;
  invoiceId?: string;
  deliveryType?: string;
  trackingNumber?: string;
  carrier?: string;
  fromLocation?: string;
  toLocation?: string;
  cost?: number;
  estimatedDate?: Date;
  notes?: string;
};

export type DeliveryUpdateInput = {
  deliveryType?: string | null;
  trackingNumber?: string | null;
  carrier?: string | null;
  fromLocation?: string | null;
  toLocation?: string | null;
  cost?: number | null;
  estimatedDate?: Date | null;
  notes?: string | null;
};

export type DeliveryWithRelations = Delivery & {
  Counterparty?: Counterparty | null;
  Project?: Project | null;
  Invoice?: Invoice | null;
};

export class DeliveryRepository {
  async create(data: DeliveryCreateInput): Promise<Delivery> {
    return prisma.delivery.create({
      data: {
        id: randomUUID(),
        projectId: data.projectId,
        supplierId: data.supplierId,
        invoiceId: data.invoiceId,
        status: 'pending',
        deliveryType: data.deliveryType,
        trackingNumber: data.trackingNumber,
        carrier: data.carrier,
        fromLocation: data.fromLocation,
        toLocation: data.toLocation,
        cost: data.cost ?? null,
        estimatedDate: data.estimatedDate,
        notes: data.notes,
        updatedAt: new Date(),
      },
    });
  }

  async findById(id: string): Promise<DeliveryWithRelations | null> {
    return prisma.delivery.findUnique({
      where: { id },
      include: { Counterparty: true, Project: true, Invoice: true },
    });
  }

  async findMany(filters: { projectId?: string; supplierId?: string; status?: DeliveryStatus | string } = {}): Promise<DeliveryWithRelations[]> {
    // Явная аннотация типа нужна, чтобы разорвать рекурсивный вывод типов
    // (query-extension $extends → TS2321 excessive stack depth).
    const args: Prisma.DeliveryFindManyArgs = {
      where: { projectId: filters.projectId, supplierId: filters.supplierId, status: filters.status },
      orderBy: { createdAt: 'desc' },
      include: { Counterparty: true, Project: true, Invoice: true },
    };
    return prisma.delivery.findMany(args) as Promise<DeliveryWithRelations[]>;
  }

  async update(id: string, data: DeliveryUpdateInput): Promise<Delivery> {
    return prisma.delivery.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  /**
   * Transition status. Transitioning to `delivered` triggers the auto warehouse
   * update (deliver()). Validates the status machine.
   */
  async transitionStatus(id: string, newStatus: DeliveryStatus): Promise<Delivery> {
    if (!VALID_STATUSES.includes(newStatus)) {
      throw new ValidationError(`Invalid status: ${newStatus}`);
    }
    const delivery = await prisma.delivery.findUnique({ where: { id } });
    if (!delivery) throw new NotFoundError('Delivery not found');
    const allowed = VALID_TRANSITIONS[delivery.status as DeliveryStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new ValidationError(`Invalid status transition: ${delivery.status} → ${newStatus}`);
    }

    if (newStatus === 'delivered') {
      return this.deliver(delivery);
    }
    return prisma.delivery.update({
      where: { id },
      data: { status: newStatus, updatedAt: new Date() },
    });
  }

  /**
   * Mark delivered + auto-update warehouse from the linked invoice's items.
   * Each invoice item linked to a BOMItem find-or-creates a WarehouseItem
   * (match by article, then name) and applies an `in` transaction.
   */
  async deliver(delivery: Delivery): Promise<Delivery> {
    // Process invoice items first (may throw on stock errors — but 'in' never does)
    if (delivery.invoiceId) {
      await this.updateWarehouseFromInvoice(delivery.invoiceId);
    }
    return prisma.delivery.update({
      where: { id: delivery.id },
      data: { status: 'delivered', actualDate: new Date(), updatedAt: new Date() },
    });
  }

  private async updateWarehouseFromInvoice(invoiceId: string): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { InvoiceItem: { include: { BOMItem: true } } },
    });
    if (!invoice) return;

    for (const item of invoice.InvoiceItem) {
      if (!item.BOMItem) continue;
      const bomItem = item.BOMItem;

      // find-or-create a matching WarehouseItem (by article, then name)
      let whItem = null;
      if (bomItem.article) {
        whItem = await prisma.warehouseItem.findFirst({ where: { article: bomItem.article } });
      }
      if (!whItem) {
        whItem = await prisma.warehouseItem.findFirst({ where: { name: bomItem.name } });
      }
      if (!whItem) {
        whItem = await warehouse.create({
          name: bomItem.name,
          article: bomItem.article,
          unit: bomItem.unit,
          quantity: 0,
        });
      }

      await warehouse.applyTransaction(whItem.id, {
        type: 'in',
        quantity: item.quantity,
        bomItemId: bomItem.id,
        notes: `Delivery from invoice ${invoice.number ?? invoice.id}`,
      });
    }
  }
}

const VALID_STATUSES: DeliveryStatus[] = ['pending', 'shipped', 'in_transit', 'delivered', 'cancelled'];

/** Singleton instance */
export const deliveries = new DeliveryRepository();
export default deliveries;
