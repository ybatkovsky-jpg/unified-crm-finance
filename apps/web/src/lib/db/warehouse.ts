/**
 * WarehouseRepository — items + stock transactions (S06)
 *
 * Mirrors the procurement repository pattern; reuses shared lib/db/errors.ts.
 *
 * Stock model: WarehouseItem keeps quantity (total), reservedQty, availableQty
 * (= quantity − reservedQty), minQuantity. Each mutation goes through
 * applyTransaction(), which updates the item and writes a WarehouseTransaction
 * row atomically inside prisma.$transaction, with negative-stock guards.
 *
 * Transaction types: in (приём), out (расход), reserve (резерв), release (разрезерв).
 */

import { prisma } from './prisma';
import type { WarehouseItem, WarehouseTransaction, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { NotFoundError, ValidationError } from './errors';

export { NotFoundError, ValidationError } from './errors';

export type WarehouseTransactionType = 'in' | 'out' | 'reserve' | 'release';

const VALID_TYPES: WarehouseTransactionType[] = ['in', 'out', 'reserve', 'release'];

export type WarehouseItemCreateInput = {
  name: string;
  article?: string | null;
  category?: string | null;
  quantity?: number;
  reservedQty?: number;
  minQuantity?: number;
  unit?: string;
  location?: string | null;
};

export type WarehouseItemUpdateInput = {
  name?: string;
  article?: string | null;
  category?: string | null;
  minQuantity?: number;
  unit?: string;
  location?: string | null;
};

export type TransactionInput = {
  type: WarehouseTransactionType;
  quantity: number;
  bomItemId?: string;
  notes?: string;
};

export type WarehouseItemWithTransactions = WarehouseItem & {
  WarehouseTransaction?: WarehouseTransaction[];
};

export class WarehouseRepository {
  // ─── Items ─────────────────────────────────────────────

  async create(data: WarehouseItemCreateInput): Promise<WarehouseItem> {
    const quantity = data.quantity ?? 0;
    const reservedQty = data.reservedQty ?? 0;
    return prisma.warehouseItem.create({
      data: {
        id: randomUUID(),
        name: data.name,
        article: data.article ?? null,
        category: data.category ?? null,
        quantity,
        reservedQty,
        availableQty: Math.max(0, quantity - reservedQty),
        minQuantity: data.minQuantity ?? 0,
        unit: data.unit ?? 'шт',
        location: data.location ?? null,
        updatedAt: new Date(),
      },
    });
  }

  async findById(
    id: string,
    includeTransactions = false
  ): Promise<WarehouseItemWithTransactions | null> {
    return prisma.warehouseItem.findUnique({
      where: { id },
      include: includeTransactions
        ? { WarehouseTransaction: { orderBy: { createdAt: 'desc' }, take: 50 } }
        : undefined,
    });
  }

  async findMany(filters: {
    search?: string;
    lowStockOnly?: boolean;
  } = {}): Promise<WarehouseItem[]> {
    const where: Prisma.WarehouseItemWhereInput = {};
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { article: { contains: filters.search } },
      ];
    }
    const items = await prisma.warehouseItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    if (filters.lowStockOnly) {
      return items.filter((i) => i.availableQty <= i.minQuantity);
    }
    return items;
  }

  async update(id: string, data: WarehouseItemUpdateInput): Promise<WarehouseItem> {
    return prisma.warehouseItem.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: string): Promise<WarehouseItem> {
    return prisma.warehouseItem.delete({ where: { id } });
  }

  /** Items at or below their minimum available quantity. */
  async findLowStock(): Promise<WarehouseItem[]> {
    const items = await prisma.warehouseItem.findMany();
    return items
      .filter((i) => i.availableQty <= i.minQuantity)
      .sort((a, b) => a.availableQty - b.availableQty);
  }

  // ─── Transactions (atomic stock mutation) ──────────────

  /**
   * Apply a stock transaction atomically: update item quantities and write
   * a WarehouseTransaction row. Guards against negative available/reserved stock.
   */
  async applyTransaction(
    itemId: string,
    input: TransactionInput
  ): Promise<{ item: WarehouseItem; transaction: WarehouseTransaction }> {
    if (!VALID_TYPES.includes(input.type)) {
      throw new ValidationError(`Invalid transaction type: ${input.type}`);
    }
    if (!(input.quantity > 0)) {
      throw new ValidationError('quantity must be positive');
    }

    return prisma.$transaction(async (tx) => {
      const item = await tx.warehouseItem.findUnique({ where: { id: itemId } });
      if (!item) throw new NotFoundError('WarehouseItem not found');

      let { quantity, reservedQty, availableQty } = item;

      switch (input.type) {
        case 'in':
          quantity += input.quantity;
          availableQty += input.quantity;
          break;
        case 'out':
          if (availableQty < input.quantity) {
            throw new ValidationError(
              `Insufficient available stock: have ${availableQty}, need ${input.quantity}`
            );
          }
          quantity -= input.quantity;
          availableQty -= input.quantity;
          break;
        case 'reserve':
          if (availableQty < input.quantity) {
            throw new ValidationError(
              `Insufficient available stock to reserve: have ${availableQty}, need ${input.quantity}`
            );
          }
          reservedQty += input.quantity;
          availableQty -= input.quantity;
          break;
        case 'release':
          if (reservedQty < input.quantity) {
            throw new ValidationError(
              `Insufficient reserved stock to release: have ${reservedQty}, need ${input.quantity}`
            );
          }
          reservedQty -= input.quantity;
          availableQty += input.quantity;
          break;
      }

      const updated = await tx.warehouseItem.update({
        where: { id: itemId },
        data: { quantity, reservedQty, availableQty, updatedAt: new Date() },
      });

      const transaction = await tx.warehouseTransaction.create({
        data: {
          id: randomUUID(),
          warehouseItemId: itemId,
          bomItemId: input.bomItemId,
          type: input.type,
          quantity: input.quantity,
          notes: input.notes,
        },
      });

      return { item: updated, transaction };
    });
  }

  /** Transaction history for an item. */
  async findTransactions(itemId: string): Promise<WarehouseTransaction[]> {
    return prisma.warehouseTransaction.findMany({
      where: { warehouseItemId: itemId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

/** Singleton instance */
export const warehouse = new WarehouseRepository();
export default warehouse;
