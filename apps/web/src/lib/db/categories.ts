/**
 * CategoryRepository — CRUD with hierarchy support
 *
 * Provides typed methods for Category queries with parentId cycle detection,
 * type filtering (income/expense), and soft-delete via isActive flag.
 * All errors propagate to caller for handling at API layer.
 */

import { prisma } from './prisma';
import type {
  Category,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';

export type CategoryCreateInput = Omit<
  Prisma.CategoryUncheckedCreateInput,
  'id' | 'updatedAt'
> &
  Partial<Pick<Prisma.CategoryUncheckedCreateInput, 'id' | 'updatedAt'>>;

export type CategoryUpdateInput = Prisma.CategoryUncheckedUpdateInput;

export class CategoryRepository {
  /**
   * Flat list of active categories, sorted by parentId (nulls first), then order.
   * Suitable for building a tree in the UI.
   */
  async findTree(): Promise<Category[]> {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ parentId: { sort: 'asc', nulls: 'first' } }, { order: 'asc' }],
    });
  }

  /**
   * Find categories by type (income / expense).
   * Only returns active categories.
   */
  async findByType(type: string): Promise<Category[]> {
    return prisma.category.findMany({
      where: { type, isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Find a single active category by ID.
   */
  async findUnique(id: string): Promise<Category | null> {
    return prisma.category.findFirst({
      where: { id, isActive: true },
    });
  }

  /**
   * Create a new category.
   * Validates parentId existence and cycle prevention.
   */
  async create(data: CategoryCreateInput): Promise<Category> {
    if (data.parentId) {
      await this._validateParent(data.parentId);
    }

    return prisma.category.create({
      data: {
        ...data,
        id: data.id ?? randomUUID(),
        updatedAt: data.updatedAt ?? new Date(),
      },
    });
  }

  /**
   * Update an existing category.
   * Validates parentId existence, cycle prevention, and target existence.
   */
  async update(id: string, data: CategoryUpdateInput): Promise<Category> {
    const existing = await this.findUnique(id);
    if (!existing) {
      throw new Error(`Category with id ${id} not found`);
    }

    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new Error('Category cannot be its own parent');
      }
      if (data.parentId !== null) {
        await this._validateParent(String(data.parentId), id);
      }
    }

    return prisma.category.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft-delete: sets isActive = false.
   * Refuses if category is referenced by active Budget or Transaction records.
   */
  async delete(id: string): Promise<Category> {
    const existing = await this.findUnique(id);
    if (!existing) {
      throw new Error(`Category with id ${id} not found`);
    }

    // Check Budget references
    const budgetCount = await prisma.budget.count({
      where: { categoryId: id },
    });
    if (budgetCount > 0) {
      throw new Error(
        `Cannot delete category ${id}: referenced by ${budgetCount} budget(s)`
      );
    }

    // Check Transaction references (non-deleted)
    const txCount = await prisma.transaction.count({
      where: { categoryId: id, deletedAt: null },
    });
    if (txCount > 0) {
      throw new Error(
        `Cannot delete category ${id}: referenced by ${txCount} transaction(s)`
      );
    }

    return prisma.category.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    });
  }

  /**
   * Count active categories matching optional criteria.
   */
  async count(where?: Prisma.CategoryWhereInput): Promise<number> {
    return prisma.category.count({
      where: { ...where, isActive: true },
    });
  }

  // ── private helpers ──────────────────────────────────────────────

  /**
   * Validate parentId: must reference an active category.
   * If excludeId is provided, also checks for cycles.
   */
  private async _validateParent(
    parentId: string,
    excludeId?: string
  ): Promise<void> {
    const parent = await prisma.category.findFirst({
      where: { id: parentId, isActive: true },
    });
    if (!parent) {
      throw new Error(
        `Parent category ${parentId} not found or is inactive`
      );
    }

    if (excludeId) {
      const wouldCycle = await this._wouldCreateCycle(parentId, excludeId);
      if (wouldCycle) {
        throw new Error(
          `Setting parentId=${parentId} would create a cycle for category ${excludeId}`
        );
      }
    }
  }

  /**
   * Walk the parent chain upward from startId.
   * Returns true if we encounter targetId, indicating a cycle.
   */
  private async _wouldCreateCycle(
    startId: string,
    targetId: string
  ): Promise<boolean> {
    const visited = new Set<string>();
    let currentId: string | null = startId;

    while (currentId !== null) {
      if (currentId === targetId) return true;
      if (visited.has(currentId)) return true; // already a cycle in DB
      visited.add(currentId);

      const cat = await prisma.category.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
      currentId = cat?.parentId ?? null;
    }

    return false;
  }
}

/** Singleton instance */
export const categories = new CategoryRepository();
export default categories;
