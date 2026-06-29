/**
 * ChangeOrderRepository — additional works / change orders (PROJ-11)
 *
 * Status machine: draft → approved → completed (+ cancelled)
 *
 * Formal execution of additional work beyond the original contract scope.
 * Customer-initiated changes only (scope policy: no internal mistakes).
 */

import { prisma } from './prisma';
import type { ChangeOrder, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ValidationError } from './errors';

export type ChangeOrderStatus = 'draft' | 'approved' | 'completed' | 'cancelled';

const VALID_TRANSITIONS: Record<ChangeOrderStatus, ChangeOrderStatus[]> = {
  draft: ['approved', 'cancelled'],
  approved: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const VALID_STATUSES: ChangeOrderStatus[] = ['draft', 'approved', 'completed', 'cancelled'];

export type ChangeOrderCreateInput = {
  projectId: string;
  contractId?: string;
  title: string;
  description?: string;
  amount: number;
  notes?: string;
};

export type ChangeOrderUpdateInput = {
  title?: string;
  description?: string | null;
  amount?: number;
  contractId?: string | null;
  notes?: string | null;
};

export class ChangeOrderRepository {
  async create(data: ChangeOrderCreateInput): Promise<ChangeOrder> {
    // Auto-increment number within project
    const count = await prisma.changeOrder.count({
      where: { projectId: data.projectId },
    });

    return prisma.changeOrder.create({
      data: {
        id: randomUUID(),
        projectId: data.projectId,
        contractId: data.contractId ?? null,
        number: count + 1,
        title: data.title,
        description: data.description ?? null,
        amount: data.amount,
        status: 'draft',
        notes: data.notes ?? null,
        updatedAt: new Date(),
      },
    });
  }

  async findById(id: string): Promise<ChangeOrder | null> {
    return prisma.changeOrder.findUnique({
      where: { id },
      include: { Contract: true, Project: { select: { id: true, name: true, externalNumber: true } } },
    });
  }

  async findByProject(projectId: string): Promise<ChangeOrder[]> {
    return prisma.changeOrder.findMany({
      where: { projectId },
      orderBy: { number: 'asc' },
      include: { Contract: true },
    });
  }

  async update(id: string, data: ChangeOrderUpdateInput): Promise<ChangeOrder> {
    const updateData: Prisma.ChangeOrderUncheckedUpdateInput = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.contractId !== undefined) updateData.contractId = data.contractId;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return prisma.changeOrder.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<ChangeOrder> {
    return prisma.changeOrder.delete({ where: { id } });
  }

  async transitionStatus(id: string, newStatus: ChangeOrderStatus): Promise<ChangeOrder> {
    if (!VALID_STATUSES.includes(newStatus)) {
      throw new ValidationError(`Invalid status: ${newStatus}`);
    }

    const co = await prisma.changeOrder.findUnique({ where: { id } });
    if (!co) throw new ValidationError('ChangeOrder not found');

    const allowed = VALID_TRANSITIONS[co.status as ChangeOrderStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition: ${co.status} → ${newStatus}`
      );
    }

    const updateData: Prisma.ChangeOrderUncheckedUpdateInput = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === 'approved') {
      updateData.approvedAt = new Date();
    }
    if (newStatus === 'completed') {
      updateData.completedAt = new Date();
    }

    return prisma.changeOrder.update({
      where: { id },
      data: updateData,
    });
  }

  async approve(id: string): Promise<ChangeOrder> {
    return this.transitionStatus(id, 'approved');
  }

  async complete(id: string): Promise<ChangeOrder> {
    return this.transitionStatus(id, 'completed');
  }
}

export const changeOrders = new ChangeOrderRepository();
export default changeOrders;
