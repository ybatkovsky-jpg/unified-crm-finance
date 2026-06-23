/**
 * CounterpartyRepository - CRUD operations for Counterparty model
 *
 * Provides typed methods for Counterparty queries with soft-delete support.
 * All errors propagate to caller for handling at API layer.
 */

import { prisma } from './prisma';
import type {
  Counterparty,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';

/**
 * Counterparty creation input type
 */
export type CounterpartyCreateInput = Omit<Prisma.CounterpartyUncheckedCreateInput, 'id' | 'updatedAt'> & Partial<Pick<Prisma.CounterpartyUncheckedCreateInput, 'id' | 'updatedAt'>>;

/**
 * Counterparty update input type
 */
export type CounterpartyUpdateInput = Prisma.CounterpartyUncheckedUpdateInput;

/**
 * Counterparty findMany params type
 */
export type CounterpartyFindManyParams = {
  where?: Prisma.CounterpartyWhereInput;
  orderBy?: Prisma.CounterpartyOrderByWithRelationInput;
  skip?: number;
  take?: number;
  include?: Prisma.CounterpartyInclude;
};

/**
 * Repository for Counterparty CRUD operations
 */
export class CounterpartyRepository {
  /**
   * Find many counterparties with optional filtering
   * Automatically filters out soft-deleted records
   */
  async findMany(params?: CounterpartyFindManyParams): Promise<Counterparty[]> {
    const { where, ...rest } = params ?? {};

    return prisma.counterparty.findMany({
      ...rest,
      where: {
        ...where,
        deletedAt: null, // Always exclude soft-deleted
      },
    });
  }

  /**
   * Find a single counterparty by ID
   * Returns null if not found or soft-deleted
   */
  async findUnique(
    id: string,
    include?: Prisma.CounterpartyInclude
  ): Promise<Counterparty | null> {
    return prisma.counterparty.findFirst({
      where: { id, deletedAt: null },
      include,
    });
  }

  /**
   * Find a counterparty by INN (dedup check)
   * Returns null if not found or soft-deleted
   */
  async findByInn(inn: string): Promise<Counterparty | null> {
    return prisma.counterparty.findFirst({
      where: { inn, deletedAt: null },
    });
  }

  /**
   * Find counterparties by type field
   * Returns filtered list excluding soft-deleted
   */
  async findByType(type: string): Promise<Counterparty[]> {
    return prisma.counterparty.findMany({
      where: { type, deletedAt: null },
    });
  }

  /**
   * Create a new counterparty
   * Generates UUID and updatedAt if not provided (schema requires these fields)
   */
  async create(data: CounterpartyCreateInput): Promise<Counterparty> {
    return prisma.counterparty.create({
      data: {
        ...data,
        id: data.id ?? randomUUID(),
        updatedAt: data.updatedAt ?? new Date(),
      },
    });
  }

  /**
   * Update an existing counterparty
   * Throws Error if counterparty doesn't exist or is soft-deleted
   */
  async update(
    id: string,
    data: CounterpartyUpdateInput
  ): Promise<Counterparty> {
    const existing = await this.findUnique(id);
    if (!existing) {
      throw new Error(`Counterparty with id ${id} not found`);
    }

    return prisma.counterparty.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete a counterparty by setting deletedAt timestamp
   * Does NOT actually delete the record from database
   * Throws Error if counterparty doesn't exist or is already soft-deleted
   */
  async softDelete(id: string): Promise<Counterparty> {
    const existing = await this.findUnique(id);
    if (!existing) {
      throw new Error(`Counterparty with id ${id} not found`);
    }

    return prisma.counterparty.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Count counterparties matching criteria (excluding soft-deleted)
   */
  async count(where?: Prisma.CounterpartyWhereInput): Promise<number> {
    return prisma.counterparty.count({
      where: {
        ...where,
        deletedAt: null,
      },
    });
  }

  /**
   * Check if a counterparty exists by INN (excluding soft-deleted)
   */
  async existsByInn(inn: string): Promise<boolean> {
    const count = await prisma.counterparty.count({
      where: { inn, deletedAt: null },
    });
    return count > 0;
  }
}

/**
 * Singleton instance for use across the application
 */
export const counterparties = new CounterpartyRepository();

export default counterparties;
