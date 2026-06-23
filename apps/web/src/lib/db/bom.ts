/**
 * BOMRepository — CRUD operations for BOM and BOMItem models
 *
 * BOM has @unique projectId (1 BOM per project). BOMItem is a child with onDelete: Cascade.
 * Follows CounterpartyRepository pattern: singleton, manual UUID, manual updatedAt.
 */

import { prisma } from './prisma';
import type { BOM, BOMItem, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';

/**
 * BOM creation input — projectId is required, items are optional
 */
export type BOMCreateInput = {
  projectId: string;
  sourceFileId?: string;
  items?: (Omit<Prisma.BOMItemUncheckedCreateInput, 'id' | 'bomId' | 'createdAt' | 'updatedAt'> &
    Partial<Pick<Prisma.BOMItemUncheckedCreateInput, 'id' | 'updatedAt'>>)[];
};

/**
 * BOM update input
 */
export type BOMUpdateInput = Prisma.BOMUncheckedUpdateInput;

/**
 * BOMItem creation input
 */
export type BOMItemCreateInput = Omit<Prisma.BOMItemUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'> &
  Partial<Pick<Prisma.BOMItemUncheckedCreateInput, 'id' | 'updatedAt'>>;

/**
 * BOMItem update input
 */
export type BOMItemUpdateInput = Prisma.BOMItemUncheckedUpdateInput & {
  updatedAt?: never; // updatedAt is always set by the repository
};

/**
 * Repository for BOM and BOMItem CRUD operations
 */
export class BOMRepository {
  // ─── BOM CRUD ────────────────────────────────────────────

  /**
   * Create a BOM with auto-generated id, status='draft', version=1, updatedAt
   * Optionally creates nested BOMItems via the `items` field
   */
  async create(data: BOMCreateInput): Promise<BOM & { BOMItem?: BOMItem[] }> {
    const { items, ...bomData } = data;

    return prisma.bOM.create({
      data: {
        ...bomData,
        id: randomUUID(),
        updatedAt: new Date(),
        status: 'draft',
        version: 1,
        BOMItem: items
          ? {
              create: items.map((item, index) => ({
                ...item,
                id: item.id ?? randomUUID(),
                rowNumber: item.rowNumber ?? index + 1,
                updatedAt: item.updatedAt ?? new Date(),
              })),
            }
          : undefined,
      },
      include: { BOMItem: true },
    });
  }

  /**
   * Find a BOM by ID, optionally including its items
   */
  async findById(id: string, includeItems = false): Promise<BOM | null> {
    return prisma.bOM.findUnique({
      where: { id },
      include: { BOMItem: includeItems },
    });
  }

  /**
   * Find a BOM by projectId (1-to-1), optionally including its items
   */
  async findByProjectId(
    projectId: string,
    includeItems = false
  ): Promise<BOM | null> {
    return prisma.bOM.findUnique({
      where: { projectId },
      include: { BOMItem: includeItems },
    });
  }

  /**
   * Update BOM fields. Always sets updatedAt to now.
   */
  async update(id: string, data: BOMUpdateInput): Promise<BOM> {
    return prisma.bOM.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Hard-delete a BOM (cascades to BOMItems)
   */
  async delete(id: string): Promise<BOM> {
    return prisma.bOM.delete({ where: { id } });
  }

  /**
   * Lock a BOM by setting status='locked'
   */
  async lock(id: string): Promise<BOM> {
    return prisma.bOM.update({
      where: { id },
      data: { status: 'locked', updatedAt: new Date() },
    });
  }

  /**
   * Unlock a BOM by setting status='draft'
   */
  async unlock(id: string): Promise<BOM> {
    return prisma.bOM.update({
      where: { id },
      data: { status: 'draft', updatedAt: new Date() },
    });
  }

  // ─── BOMItem CRUD ────────────────────────────────────────

  /**
   * Create a single BOMItem
   */
  async createItem(data: BOMItemCreateInput): Promise<BOMItem> {
    return prisma.bOMItem.create({
      data: {
        ...data,
        id: data.id ?? randomUUID(),
        updatedAt: data.updatedAt ?? new Date(),
      },
    });
  }

  /**
   * Find all BOMItems for a given BOM, ordered by rowNumber
   */
  async findItemsByBomId(bomId: string): Promise<BOMItem[]> {
    return prisma.bOMItem.findMany({
      where: { bomId },
      orderBy: { rowNumber: 'asc' },
    });
  }

  /**
   * Update a BOMItem. Always sets updatedAt to now.
   */
  async updateItem(id: string, data: BOMItemUpdateInput): Promise<BOMItem> {
    return prisma.bOMItem.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete a single BOMItem
   */
  async deleteItem(id: string): Promise<BOMItem> {
    return prisma.bOMItem.delete({ where: { id } });
  }

  /**
   * Bulk-create BOMItems for a BOM.
   * Returns the count of created items.
   */
  async bulkCreateItems(
    bomId: string,
    items: (Omit<BOMItemCreateInput, 'bomId'> &
      Partial<Pick<BOMItemCreateInput, 'id' | 'updatedAt'>>)[]
  ): Promise<number> {
    const result = await prisma.bOMItem.createMany({
      data: items.map((item, index) => ({
        ...item,
        id: item.id ?? randomUUID(),
        bomId,
        rowNumber: item.rowNumber ?? index + 1,
        updatedAt: item.updatedAt ?? new Date(),
      })),
    });
    return result.count;
  }
}

/**
 * Singleton instance for use across the application
 */
export const bom = new BOMRepository();

export default bom;
