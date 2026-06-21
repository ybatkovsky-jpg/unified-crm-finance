/**
 * ProductionRepository - CRUD operations for Production model
 *
 * Provides typed methods for Production queries with soft-delete support.
 * Handles Production stage transitions with proper cascade behavior.
 */

import { prisma } from './prisma';
import type {
  Production,
  ProductionStage,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';

/**
 * Production creation input type
 */
export type ProductionCreateInput = Omit<Prisma.ProductionUncheckedCreateInput, 'id' | 'updatedAt'> & Partial<Pick<Prisma.ProductionUncheckedCreateInput, 'id' | 'updatedAt'>>;

/**
 * Production update input type
 */
export type ProductionUpdateInput = Prisma.ProductionUncheckedUpdateInput;

/**
 * Production findMany params type
 */
export type ProductionFindManyParams = {
  where?: Prisma.ProductionWhereInput;
  orderBy?: Prisma.ProductionOrderByWithRelationInput;
  skip?: number;
  take?: number;
  include?: Prisma.ProductionInclude;
};

/**
 * ProductionStage creation input type
 */
export type ProductionStageCreateInput = Omit<Prisma.ProductionStageUncheckedCreateInput, 'id' | 'updatedAt'> & Partial<Pick<Prisma.ProductionStageUncheckedCreateInput, 'id' | 'updatedAt'>>;

/**
 * ProductionStage update input type
 */
export type ProductionStageUpdateInput = Prisma.ProductionStageUncheckedUpdateInput;

/**
 * Repository for Production CRUD operations
 */
export class ProductionRepository {
  /**
   * Find many productions with optional filtering
   * Automatically filters out soft-deleted records
   */
  async findMany(params?: ProductionFindManyParams): Promise<Production[]> {
    const { where, ...rest } = params ?? {};

    return prisma.production.findMany({
      ...rest,
      where: {
        ...where,
        deletedAt: null, // Always exclude soft-deleted
      },
    });
  }

  /**
   * Find a single production by ID
   * Returns null if not found or soft-deleted
   */
  async findUnique(
    id: string,
    include?: Prisma.ProductionInclude
  ): Promise<Production | null> {
    return prisma.production.findFirst({
      where: { id, deletedAt: null },
      include,
    });
  }

  /**
   * Find productions by project ID
   */
  async findByProject(projectId: string): Promise<Production[]> {
    return this.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find productions by status
   */
  async findByStatus(status: string): Promise<Production[]> {
    return this.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new production
   * Generates UUID and timestamps if not provided
   */
  async create(data: ProductionCreateInput): Promise<Production> {
    const now = new Date();

    return prisma.production.create({
      data: {
        ...data,
        id: data.id ?? randomUUID(),
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
      },
    });
  }

  /**
   * Update an existing production
   * Throws RecordNotFound if production doesn't exist or is soft-deleted
   */
  async update(
    id: string,
    data: ProductionUpdateInput
  ): Promise<Production> {
    // Verify production exists and not deleted
    const existing = await this.findUnique(id);
    if (!existing) {
      throw new Error(`Production with id ${id} not found`);
    }

    return prisma.production.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete a production by setting deletedAt timestamp
   * Does NOT actually delete the record from database
   */
  async softDelete(id: string): Promise<Production> {
    // Verify production exists and not already deleted
    const existing = await this.findUnique(id);
    if (!existing) {
      throw new Error(`Production with id ${id} not found`);
    }

    return prisma.production.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Count productions matching criteria (excluding soft-deleted)
   */
  async count(where?: Prisma.ProductionWhereInput): Promise<number> {
    return prisma.production.count({
      where: {
        ...where,
        deletedAt: null,
      },
    });
  }

  /**
   * Update production progress
   */
  async updateProgress(id: string, progress: number): Promise<Production> {
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    return this.update(id, { progress });
  }

  /**
   * Start production - sets status to 'active' and actualStartDate
   */
  async start(id: string): Promise<Production> {
    const now = new Date();
    return this.update(id, {
      status: 'active',
      actualStartDate: now,
    });
  }

  /**
   * Complete production - sets status to 'completed', progress to 100, and actualEndDate
   */
  async complete(id: string): Promise<Production> {
    const now = new Date();
    return this.update(id, {
      status: 'completed',
      progress: 100,
      actualEndDate: now,
    });
  }

  /**
   * Move production to a different status
   */
  async moveStatus(
    id: string,
    status: string
  ): Promise<Production> {
    return this.update(id, { status });
  }

  // ==================== ProductionStage methods ====================

  /**
   * Find production stages for a production
   */
  async findStages(productionId: string): Promise<ProductionStage[]> {
    return prisma.productionStage.findMany({
      where: { productionId },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Find a single production stage by ID
   */
  async findStage(id: string): Promise<ProductionStage | null> {
    return prisma.productionStage.findUnique({
      where: { id },
    });
  }

  /**
   * Find production stages by status
   */
  async findStagesByStatus(productionId: string, status: string): Promise<ProductionStage[]> {
    return prisma.productionStage.findMany({
      where: { productionId, status },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Create a new production stage
   */
  async createStage(data: ProductionStageCreateInput): Promise<ProductionStage> {
    const now = new Date();

    return prisma.productionStage.create({
      data: {
        ...data,
        id: data.id ?? randomUUID(),
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
      },
    });
  }

  /**
   * Update an existing production stage
   */
  async updateStage(
    id: string,
    data: ProductionStageUpdateInput
  ): Promise<ProductionStage> {
    // Verify stage exists
    const existing = await this.findStage(id);
    if (!existing) {
      throw new Error(`ProductionStage with id ${id} not found`);
    }

    return prisma.productionStage.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Move a production stage to a different status
   * Automatically sets completedAt when moving to completed status
   */
  async moveStage(
    stageId: string,
    status: string,
    completedAt?: Date
  ): Promise<ProductionStage> {
    const stage = await this.findStage(stageId);
    if (!stage) {
      throw new Error(`ProductionStage with id ${stageId} not found`);
    }

    const updateData: Prisma.ProductionStageUpdateInput = {
      status,
      updatedAt: new Date(),
    };

    // Set completedAt if status is 'completed' or provided
    if (status === 'completed' || completedAt) {
      updateData.completedAt = completedAt ?? new Date();
    }

    return prisma.productionStage.update({
      where: { id: stageId },
      data: updateData,
    });
  }

  /**
   * Delete a production stage
   * This is a hard delete since stages have no soft-delete
   */
  async deleteStage(id: string): Promise<ProductionStage> {
    const stage = await this.findStage(id);
    if (!stage) {
      throw new Error(`ProductionStage with id ${id} not found`);
    }

    return prisma.productionStage.delete({
      where: { id },
    });
  }

  /**
   * Count production stages for a production
   */
  async countStages(productionId: string): Promise<number> {
    return prisma.productionStage.count({
      where: { productionId },
    });
  }
}

/**
 * Singleton instance for use across the application
 */
export const productions = new ProductionRepository();

export default productions;
