/**
 * CashFlowPaymentRepository — CRUD with status workflow
 *
 * Provides typed methods for CashFlowPayment queries with relations to
 * Project and Counterparty. Status workflow: planned → scheduled → paid / cancelled.
 * All errors propagate to caller for handling at API layer.
 */

import { prisma } from './prisma';
import type { CashFlowPayment, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export type CashFlowPaymentCreateInput = Omit<
  Prisma.CashFlowPaymentUncheckedCreateInput,
  'id' | 'updatedAt'
> &
  Partial<Pick<Prisma.CashFlowPaymentUncheckedCreateInput, 'id' | 'updatedAt'>>;

export type CashFlowPaymentUpdateInput = Omit<
  Prisma.CashFlowPaymentUncheckedUpdateInput,
  'id' | 'createdAt'
>;

export interface CashFlowPaymentFilters {
  projectId?: string;
  counterpartyId?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  dueBefore?: string;
}

export class CashFlowPaymentRepository {
  async findById(id: string): Promise<CashFlowPayment | null> {
    return prisma.cashFlowPayment.findUnique({
      where: { id },
      include: {
        Project: { select: { id: true, name: true } },
        Counterparty: { select: { id: true, name: true } },
      },
    });
  }

  async findWithFilters(
    filters: CashFlowPaymentFilters,
    skip?: number,
    take?: number
  ): Promise<CashFlowPayment[]> {
    const where: Prisma.CashFlowPaymentWhereInput = {};

    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.counterpartyId) where.counterpartyId = filters.counterpartyId;
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;

    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) (where.date as Prisma.DateTimeFilter).gte = new Date(filters.dateFrom);
      if (filters.dateTo) (where.date as Prisma.DateTimeFilter).lte = new Date(filters.dateTo);
    }

    if (filters.dueBefore) {
      where.dueDate = { lte: new Date(filters.dueBefore) };
    }

    // Явная аннотация типа нужна, чтобы разорвать рекурсивный вывод типов
    // (query-extension $extends → TS2321 excessive stack depth).
    const args: Prisma.CashFlowPaymentFindManyArgs = {
      where,
      include: {
        Project: { select: { id: true, name: true } },
        Counterparty: { select: { id: true, name: true } },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip,
      take,
    };
    return prisma.cashFlowPayment.findMany(args);
  }

  async countWithFilters(filters: CashFlowPaymentFilters): Promise<number> {
    const where: Prisma.CashFlowPaymentWhereInput = {};
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.status) where.status = filters.status;
    return prisma.cashFlowPayment.count({ where });
  }

  async findDuePayments(): Promise<CashFlowPayment[]> {
    return prisma.cashFlowPayment.findMany({
      where: {
        status: { in: ['planned', 'scheduled'] },
        dueDate: { not: null },
      },
      include: {
        Project: { select: { id: true, name: true } },
        Counterparty: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async create(data: CashFlowPaymentCreateInput): Promise<CashFlowPayment> {
    if (data.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
        select: { id: true },
      });
      if (!project) throw new Error(`Project with id ${data.projectId} not found`);
    }

    return prisma.cashFlowPayment.create({
      data: {
        ...data,
        id: data.id ?? randomUUID(),
        updatedAt: data.updatedAt ?? new Date(),
      },
    });
  }

  async update(
    id: string,
    data: CashFlowPaymentUpdateInput
  ): Promise<CashFlowPayment> {
    const existing = await this.findById(id);
    if (!existing) throw new Error(`CashFlowPayment with id ${id} not found`);

    if (data.projectId !== undefined && data.projectId !== null) {
      const project = await prisma.project.findUnique({
        where: { id: String(data.projectId) },
        select: { id: true },
      });
      if (!project) throw new Error(`Project with id ${data.projectId} not found`);
    }

    return prisma.cashFlowPayment.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async updateStatus(
    id: string,
    status: string
  ): Promise<CashFlowPayment> {
    const existing = await this.findById(id);
    if (!existing) throw new Error(`CashFlowPayment with id ${id} not found`);

    const validStatuses = ['planned', 'scheduled', 'paid', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    return prisma.cashFlowPayment.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });
  }

  async delete(id: string): Promise<CashFlowPayment> {
    const existing = await this.findById(id);
    if (!existing) throw new Error(`CashFlowPayment with id ${id} not found`);
    return prisma.cashFlowPayment.delete({ where: { id } });
  }
}

export const cashflowPayments = new CashFlowPaymentRepository();
export default cashflowPayments;
