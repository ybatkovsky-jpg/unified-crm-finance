/**
 * TransactionRepository — CRUD with soft-delete and rich filtering
 *
 * Provides typed methods for Transaction queries with relations to
 * Category, Project, Counterparty, and Invoice.
 * Soft-delete via deletedAt field.
 * All errors propagate to caller for handling at API layer.
 */

import { prisma } from './prisma';
import type { Transaction, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export type TransactionCreateInput = Omit<
  Prisma.TransactionUncheckedCreateInput,
  'id' | 'updatedAt'
> &
  Partial<Pick<Prisma.TransactionUncheckedCreateInput, 'id' | 'updatedAt'>>;

export type TransactionUpdateInput = Omit<
  Prisma.TransactionUncheckedUpdateInput,
  'id' | 'createdAt'
>;

export interface TransactionFilters {
  projectId?: string;
  categoryId?: string;
  counterpartyId?: string;
  invoiceId?: string;
  type?: string;
  status?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  includeDeleted?: boolean;
}

export class TransactionRepository {
  /**
   * Find a single non-deleted transaction by ID.
   */
  async findById(id: string): Promise<Transaction | null> {
    return prisma.transaction.findFirst({
      where: { id, deletedAt: null },
      include: {
        Category: { select: { id: true, name: true, type: true } },
        Project: { select: { id: true, name: true } },
        Counterparty: { select: { id: true, name: true } },
        Invoice: { select: { id: true, number: true } },
      },
    });
  }

  /**
   * Find transactions with filters.
   * By default excludes soft-deleted records.
   */
  async findWithFilters(
    filters: TransactionFilters,
    skip?: number,
    take?: number
  ): Promise<Transaction[]> {
    const where: Prisma.TransactionWhereInput = {};

    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.counterpartyId) where.counterpartyId = filters.counterpartyId;
    if (filters.invoiceId) where.invoiceId = filters.invoiceId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        (where.date as Prisma.DateTimeFilter).gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        (where.date as Prisma.DateTimeFilter).lte = new Date(filters.dateTo);
      }
    }

    // Soft-delete filter: exclude deleted by default
    if (!filters.includeDeleted) {
      where.deletedAt = null;
    }

    // Явная аннотация типа нужна, чтобы разорвать рекурсивный вывод типов
    // (query-extension $extends → TS2321 excessive stack depth).
    const args: Prisma.TransactionFindManyArgs = {
      where,
      include: {
        Category: { select: { id: true, name: true, type: true } },
        Project: { select: { id: true, name: true } },
        Counterparty: { select: { id: true, name: true } },
        Invoice: { select: { id: true, number: true } },
      },
      orderBy: { date: 'desc' },
      skip,
      take,
    };
    return prisma.transaction.findMany(args);
  }

  /**
   * Count transactions matching filters.
   */
  async countWithFilters(filters: TransactionFilters): Promise<number> {
    const where: Prisma.TransactionWhereInput = {};

    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.counterpartyId) where.counterpartyId = filters.counterpartyId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;

    if (!filters.includeDeleted) {
      where.deletedAt = null;
    }

    return prisma.transaction.count({ where });
  }

  /**
   * Create a new transaction.
   * Validates: categoryId exists and is active.
   */
  async create(data: TransactionCreateInput): Promise<Transaction> {
    // Validate category exists and is active
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, isActive: true },
      select: { id: true },
    });
    if (!category) {
      throw new Error(
        `Category with id ${data.categoryId} not found or is inactive`
      );
    }

    // Validate project if provided
    if (data.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
        select: { id: true },
      });
      if (!project) {
        throw new Error(`Project with id ${data.projectId} not found`);
      }
    }

    return prisma.transaction.create({
      data: {
        ...data,
        id: data.id ?? randomUUID(),
        updatedAt: data.updatedAt ?? new Date(),
      },
    });
  }

  /**
   * Update an existing transaction.
   */
  async update(
    id: string,
    data: TransactionUpdateInput
  ): Promise<Transaction> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    // Validate category if changed
    if (data.categoryId !== undefined) {
      const category = await prisma.category.findFirst({
        where: { id: String(data.categoryId), isActive: true },
        select: { id: true },
      });
      if (!category) {
        throw new Error(
          `Category with id ${data.categoryId} not found or is inactive`
        );
      }
    }

    // Validate project if changed
    if (data.projectId !== undefined && data.projectId !== null) {
      const project = await prisma.project.findUnique({
        where: { id: String(data.projectId) },
        select: { id: true },
      });
      if (!project) {
        throw new Error(`Project with id ${data.projectId} not found`);
      }
    }

    return prisma.transaction.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  /**
   * Soft-delete: sets deletedAt = now.
   */
  async softDelete(id: string): Promise<Transaction> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    return prisma.transaction.update({
      where: { id },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });
  }

  /**
   * Hard-delete (admin only, use with caution).
   */
  async delete(id: string): Promise<Transaction> {
    const existing = await prisma.transaction.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    return prisma.transaction.delete({ where: { id } });
  }
}

/** Singleton instance */
export const transactions = new TransactionRepository();
export default transactions;
