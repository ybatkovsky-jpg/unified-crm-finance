/**
 * BudgetRepository — CRUD with project/category relation validation
 *
 * Provides typed methods for Budget queries with projectId and categoryId
 * existence validation, period-based filtering, and unique constraint handling.
 * All errors propagate to caller for handling at API layer.
 */

import { prisma } from './prisma';
import type { Budget, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export type BudgetCreateInput = Omit<
  Prisma.BudgetUncheckedCreateInput,
  'id' | 'updatedAt'
> &
  Partial<Pick<Prisma.BudgetUncheckedCreateInput, 'id' | 'updatedAt'>>;

export type BudgetUpdateInput = Omit<
  Prisma.BudgetUncheckedUpdateInput,
  'id' | 'createdAt'
>;

export class BudgetRepository {
  /**
   * Find a single budget by ID.
   */
  async findById(id: string): Promise<Budget | null> {
    return prisma.budget.findUnique({ where: { id } });
  }

  /**
   * Find budgets for a specific project, optionally filtered by category or period.
   */
  async findByProject(
    projectId: string,
    filters?: { categoryId?: string; period?: string }
  ): Promise<Budget[]> {
    const where: Prisma.BudgetWhereInput = { projectId };

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters?.period) {
      where.period = filters.period;
    }

    // Явная аннотация типа нужна, чтобы разорвать рекурсивный вывод типов
    // (query-extension $extends → TS2321 excessive stack depth).
    const args: Prisma.BudgetFindManyArgs = {
      where,
      include: {
        Category: { select: { id: true, name: true, type: true } },
      },
      orderBy: [{ period: 'desc' }, { createdAt: 'desc' }],
    };
    return prisma.budget.findMany(args);
  }

  /**
   * Find budgets by period (across all projects).
   */
  async findByPeriod(period: string): Promise<Budget[]> {
    return prisma.budget.findMany({
      where: { period },
      include: {
        Category: { select: { id: true, name: true, type: true } },
        Project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new budget.
   * Validates: projectId exists, categoryId exists and is active.
   * Handles unique constraint violation (projectId + categoryId + period).
   */
  async create(data: BudgetCreateInput): Promise<Budget> {
    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { id: true },
    });
    if (!project) {
      throw new Error(`Project with id ${data.projectId} not found`);
    }

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

    // Check unique constraint
    const existing = await prisma.budget.findUnique({
      where: {
        projectId_categoryId_period: {
          projectId: data.projectId,
          categoryId: data.categoryId,
          period: data.period,
        },
      },
    });
    if (existing) {
      throw new Error(
        `Budget for project ${data.projectId}, category ${data.categoryId}, period ${data.period} already exists`
      );
    }

    return prisma.budget.create({
      data: {
        ...data,
        id: data.id ?? randomUUID(),
        updatedAt: data.updatedAt ?? new Date(),
      },
    });
  }

  /**
   * Update an existing budget.
   * Validates: target exists, new categoryId if changed, new projectId if changed.
   */
  async update(id: string, data: BudgetUpdateInput): Promise<Budget> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Budget with id ${id} not found`);
    }

    // If projectId or categoryId changed, validate they exist
    if (data.projectId !== undefined) {
      const project = await prisma.project.findUnique({
        where: { id: String(data.projectId) },
        select: { id: true },
      });
      if (!project) {
        throw new Error(`Project with id ${data.projectId} not found`);
      }
    }

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

    // Check unique constraint if changing project/category/period
    const newProjectId = (data.projectId as string) ?? existing.projectId;
    const newCategoryId = (data.categoryId as string) ?? existing.categoryId;
    const newPeriod = (data.period as string) ?? existing.period;

    if (
      data.projectId !== undefined ||
      data.categoryId !== undefined ||
      data.period !== undefined
    ) {
      const conflict = await prisma.budget.findFirst({
        where: {
          projectId: newProjectId,
          categoryId: newCategoryId,
          period: newPeriod,
          id: { not: id },
        },
      });
      if (conflict) {
        throw new Error(
          `Budget for project ${newProjectId}, category ${newCategoryId}, period ${newPeriod} already exists`
        );
      }
    }

    return prisma.budget.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  /**
   * Delete a budget permanently.
   */
  async delete(id: string): Promise<Budget> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Budget with id ${id} not found`);
    }

    return prisma.budget.delete({ where: { id } });
  }
}

/** Singleton instance */
export const budgets = new BudgetRepository();
export default budgets;
