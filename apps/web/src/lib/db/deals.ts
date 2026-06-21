/**
 * DealRepository - CRUD operations for Deal model
 *
 * Provides typed methods for Deal queries with soft-delete support.
 * Handles Deal stage transitions with history tracking.
 */

import { prisma } from './prisma';
import type {
  Deal,
  DealHistory,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';

/**
 * Deal creation input type
 */
export type DealCreateInput = Omit<Prisma.DealUncheckedCreateInput, 'id' | 'number' | 'createdAt' | 'updatedAt'>;

/**
 * Deal update input type
 */
export type DealUpdateInput = Prisma.DealUncheckedUpdateInput;

/**
 * Deal findMany params type
 */
export type DealFindManyParams = {
  where?: Prisma.DealWhereInput;
  orderBy?: Prisma.DealOrderByWithRelationInput;
  skip?: number;
  take?: number;
  include?: Prisma.DealInclude;
};

/**
 * Repository for Deal CRUD operations
 */
export class DealRepository {
  /**
   * Generate deal number in format С-YYYY-NNNNN
   */
  private generateNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    return `С-${year}-${random}`;
  }

  /**
   * Find many deals with optional filtering
   * Automatically filters out soft-deleted records
   */
  async findMany(params?: DealFindManyParams): Promise<Deal[]> {
    const { where, ...rest } = params ?? {};

    return prisma.deal.findMany({
      ...rest,
      where: {
        ...where,
        deletedAt: null, // Always exclude soft-deleted
      },
    });
  }

  /**
   * Find a single deal by ID
   * Returns null if not found or soft-deleted
   */
  async findUnique(
    id: string,
    include?: Prisma.DealInclude
  ): Promise<Deal | null> {
    return prisma.deal.findFirst({
      where: { id, deletedAt: null },
      include,
    });
  }

  /**
   * Find deals by pipeline ID
   */
  async findByPipeline(pipelineId: string): Promise<Deal[]> {
    return this.findMany({
      where: { pipelineId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find deals by stage ID
   */
  async findByStage(stageId: string): Promise<Deal[]> {
    return this.findMany({
      where: { stageId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find deals by manager (owner)
   */
  async findByManager(managerId: string): Promise<Deal[]> {
    return this.findMany({
      where: { managerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find deals by contact
   */
  async findByContact(contactId: string): Promise<Deal[]> {
    return this.findMany({
      where: { contactId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new deal
   * Generates UUID, number, and timestamps if not provided
   */
  async create(data: DealCreateInput): Promise<Deal> {
    const now = new Date();

    return prisma.deal.create({
      data: {
        ...data,
        id: data.id ?? randomUUID(),
        number: data.number ?? this.generateNumber(),
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
      },
    });
  }

  /**
   * Update an existing deal
   * Throws RecordNotFound if deal doesn't exist or is soft-deleted
   */
  async update(
    id: string,
    data: DealUpdateInput
  ): Promise<Deal> {
    // Verify deal exists and not deleted
    const existing = await this.findUnique(id);
    if (!existing) {
      throw new Error(`Deal with id ${id} not found`);
    }

    return prisma.deal.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Move deal to a different stage
   * Records the transition in DealHistory
   */
  async moveStage(
    dealId: string,
    toStageId: string,
    changedBy: string,
    comment?: string
  ): Promise<Deal> {
    const deal = await this.findUnique(dealId);
    if (!deal) {
      throw new Error(`Deal with id ${dealId} not found`);
    }

    const fromStageId = deal.stageId;

    // Record history
    await prisma.dealHistory.create({
      data: {
        id: randomUUID(),
        dealId,
        fromStageId,
        toStageId,
        comment: comment ?? null,
        changedBy,
        changedAt: new Date(),
      },
    });

    // Update deal stage
    const updated = await prisma.deal.update({
      where: { id: dealId },
      data: {
        stageId: toStageId,
        updatedAt: new Date(),
      },
    });

    // Set closedAt if moved to won/lost stage
    const stage = await prisma.dealStage.findUnique({
      where: { id: toStageId },
    });
    if (stage && (stage.isWonStage || stage.isLostStage)) {
      await prisma.deal.update({
        where: { id: dealId },
        data: {
          actualCloseDate: new Date(),
          closedAt: new Date(),
        },
      });
    }

    return updated;
  }

  /**
   * Soft delete a deal by setting deletedAt timestamp
   * Does NOT actually delete the record from database
   */
  async softDelete(id: string): Promise<Deal> {
    // Verify deal exists and not already deleted
    const existing = await this.findUnique(id);
    if (!existing) {
      throw new Error(`Deal with id ${id} not found`);
    }

    return prisma.deal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Count deals matching criteria (excluding soft-deleted)
   */
  async count(where?: Prisma.DealWhereInput): Promise<number> {
    return prisma.deal.count({
      where: {
        ...where,
        deletedAt: null,
      },
    });
  }

  /**
   * Get deal history entries
   */
  async getHistory(dealId: string): Promise<DealHistory[]> {
    return prisma.dealHistory.findMany({
      where: { dealId },
      orderBy: { changedAt: 'desc' },
    });
  }
}

/**
 * Singleton instance for use across the application
 */
export const deals = new DealRepository();

export default deals;
