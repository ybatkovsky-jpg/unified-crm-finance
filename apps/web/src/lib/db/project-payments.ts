/**
 * ProjectPaymentRepository — этапы оплаты клиента по проекту (FIN-01).
 *
 * По умолчанию проект имеет 2 этапа: предоплата 70% + финальная оплата 30%.
 * При фиксации платежа создаётся связанная Transaction(type=income) и
 * обновляется receivedAmount/status этапа.
 */

import { prisma } from './prisma';
import type { ProjectPayment, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { NotFoundError, ValidationError, ConflictError } from './errors';

export type ProjectPaymentType = 'prepayment' | 'final' | 'other';
export type ProjectPaymentStatus = 'planned' | 'partial' | 'paid';
export type PaymentMethod = 'cash' | 'bank' | 'card';

export type ProjectPaymentCreateInput = {
  paymentType: ProjectPaymentType;
  plannedPercent?: number;
  dueDate?: Date | string | null;
  notes?: string;
};

export type RecordPaymentInput = {
  amount: number;
  paymentMethod?: PaymentMethod;
  transactionDate?: Date | string;
  description?: string;
};

export type PaymentCoverage = {
  total: number;
  received: number;
  percent: number;
  prepaymentMet: boolean;
  fullyPaid: boolean;
};

/** Найти доходную категорию (type=income) — для создаваемой Transaction платежа. */
async function findIncomeCategory(): Promise<string> {
  const cat = await prisma.category.findFirst({ where: { type: 'income' } });
  if (!cat) throw new ConflictError('Нет доходной категории (type=income) — заведите категорию «Выручка»');
  return cat.id;
}

export class ProjectPaymentRepository {
  async findByProject(projectId: string): Promise<ProjectPayment[]> {
    return prisma.projectPayment.findMany({
      where: { projectId },
      orderBy: [
        // prepayment идёт первым
        { paymentType: 'asc' },
        { createdAt: 'asc' },
      ],
      include: {
        Transaction: { select: { id: true, amount: true, date: true, paymentMethod: true } },
      },
    });
  }

  async findById(id: string): Promise<ProjectPayment | null> {
    return prisma.projectPayment.findUnique({
      where: { id },
      include: {
        Transaction: { select: { id: true, amount: true, date: true, paymentMethod: true } },
      },
    });
  }

  /**
   * Создать этап оплаты. plannedAmount считается из contractAmount*percent проекта.
   */
  async create(projectId: string, data: ProjectPaymentCreateInput): Promise<ProjectPayment> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { contractAmount: true },
    });
    if (!project) throw new NotFoundError('Project not found');

    const percent = data.plannedPercent ?? (data.paymentType === 'prepayment' ? 0.7 : 0.3);
    const contractAmount = Number(project.contractAmount ?? 0);
    const plannedAmount = Math.round(contractAmount * percent * 100) / 100;

    return prisma.projectPayment.create({
      data: {
        id: randomUUID(),
        projectId,
        paymentType: data.paymentType,
        plannedPercent: percent,
        plannedAmount,
        status: 'planned',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Idempotent: если этапов нет — создаёт prepayment 70% + final 30%.
   * Возвращает все этапы проекта.
   */
  async ensureDefaultStages(projectId: string): Promise<ProjectPayment[]> {
    const existing = await prisma.projectPayment.findMany({ where: { projectId } });
    if (existing.length > 0) return this.findByProject(projectId);

    await this.create(projectId, { paymentType: 'prepayment', plannedPercent: 0.7 });
    await this.create(projectId, { paymentType: 'final', plannedPercent: 0.3 });
    return this.findByProject(projectId);
  }

  /**
   * Зафиксировать платёж по этапу: создаёт Transaction(income) и обновляет этап.
   * Принимает частичные платежи (receivedAmount накапливается).
   */
  async recordPayment(id: string, input: RecordPaymentInput): Promise<ProjectPayment> {
    const stage = await prisma.projectPayment.findUnique({
      where: { id },
      include: { Project: { select: { id: true, contactId: true } } },
    });
    if (!stage) throw new NotFoundError('Project payment not found');
    if (stage.status === 'paid') {
      throw new ConflictError('Этап уже полностью оплачен');
    }
    if (input.amount <= 0) {
      throw new ValidationError('Сумма платежа должна быть положительной');
    }

    const now = new Date();
    const txDate = input.transactionDate ? new Date(input.transactionDate) : now;
    const categoryId = await findIncomeCategory();

    // Создаём Transaction(income), связанную с проектом и этапом.
    const transaction = await prisma.transaction.create({
      data: {
        id: randomUUID(),
        projectId: stage.Project.id,
        categoryId,
        counterpartyId: null, // клиентская сторона — через Contact; оставляем null на уровне Transaction
        createdBy: 'system',
        date: txDate,
        amount: input.amount,
        type: 'income',
        description: input.description ?? `Оплата клиента (${stage.paymentType})`,
        source: 'manual',
        paymentMethod: input.paymentMethod ?? null,
        paymentType: stage.paymentType,
        updatedAt: now,
        ProjectPayment: { connect: { id: stage.id } },
      },
    });

    // Обновляем этап: накапливаем receivedAmount, пересчитываем статус.
    const newReceived = Number(stage.receivedAmount) + input.amount;
    const planned = Number(stage.plannedAmount);
    const newStatus: ProjectPaymentStatus =
      newReceived >= planned - 0.01 ? 'paid' : newReceived > 0 ? 'partial' : 'planned';

    return prisma.projectPayment.update({
      where: { id },
      data: {
        receivedAmount: newReceived,
        transactionId: transaction.id,
        paymentMethod: input.paymentMethod ?? stage.paymentMethod,
        status: newStatus,
        receivedAt: newStatus === 'paid' ? (stage.receivedAt ?? txDate) : stage.receivedAt,
        updatedAt: now,
      },
    });
  }

  /**
   * Покрытие проекта оплатами: общая сумма плана/факта, % выполнения,
   * флаги предоплата-покрыта (70%) и полностью оплачено.
   */
  async getCoverage(projectId: string): Promise<PaymentCoverage> {
    const stages = await prisma.projectPayment.findMany({ where: { projectId } });
    const total = stages.reduce((s, p) => s + Number(p.plannedAmount), 0);
    const received = stages.reduce((s, p) => s + Number(p.receivedAmount), 0);
    const prepayment = stages.find((p) => p.paymentType === 'prepayment');
    const prepaymentReceived = prepayment ? Number(prepayment.receivedAmount) : 0;
    const prepaymentPlanned = prepayment ? Number(prepayment.plannedAmount) : 0;

    return {
      total,
      received,
      percent: total > 0 ? Math.round((received / total) * 100) : 0,
      prepaymentMet: prepaymentPlanned > 0 ? prepaymentReceived >= prepaymentPlanned - 0.01 : received > 0,
      fullyPaid: total > 0 ? received >= total - 0.01 : false,
    };
  }

  async delete(id: string): Promise<ProjectPayment> {
    return prisma.projectPayment.delete({ where: { id } });
  }
}

export const projectPayments = new ProjectPaymentRepository();
export default projectPayments;
