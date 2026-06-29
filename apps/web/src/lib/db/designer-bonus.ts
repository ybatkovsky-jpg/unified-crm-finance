/**
 * DesignerBonusRepository — бонус дизайнеру по проекту (минимальный след для PROJ-13).
 *
 * Полная логика выплат и накопленного долга дизайнера по нескольким проектам
 * относится к FIN-06 (Phase 8). Здесь — ровно то, что нужно для проверки
 * условия закрытия: сумма, статус (pending|paid), отметка о выплате.
 *
 * Дефолтный процент — 10% от суммы договора (см. PRODUCT-SPEC / CRM-фаза).
 */

import { prisma } from './prisma';
import type { DesignerBonus, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { NotFoundError, ConflictError } from './errors';

export type DesignerBonusStatus = 'pending' | 'paid';

export type DesignerBonusUpsertInput = {
  designerId?: string | null;
  percent?: number;
  amount?: number;
  notes?: string | null;
};

export class DesignerBonusRepository {
  /**
   * Найти бонус проекта (1:1). Возвращает null, если бонуса нет.
   */
  async findByProject(projectId: string): Promise<DesignerBonus | null> {
    return prisma.designerBonus.findUnique({
      where: { projectId },
      include: {
        Designer: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findById(id: string): Promise<DesignerBonus | null> {
    return prisma.designerBonus.findUnique({
      where: { id },
      include: {
        Designer: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Создать или обновить бонус проекта.
   * При создании без явного amount и designerId — сумма считается как
   * percent * contractAmount, дизайнер берётся из managerId проекта.
   */
  async upsert(projectId: string, data: DesignerBonusUpsertInput): Promise<DesignerBonus> {
    const now = new Date();
    const existing = await prisma.designerBonus.findUnique({ where: { projectId } });

    // Если сумма не задана — посчитать из percent * contractAmount проекта.
    let amount = data.amount;
    let designerId = data.designerId;
    const percent = data.percent ?? existing?.percent ?? 0.1;

    if ((amount === undefined || amount === null) || (designerId === undefined && !existing)) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { contractAmount: true, managerId: true },
      });
      if (amount === undefined || amount === null) {
        const contractAmount = Number(project?.contractAmount ?? 0);
        amount = Math.round(contractAmount * (percent ?? 0.1) * 100) / 100;
      }
      if (designerId === undefined && !existing) {
        designerId = project?.managerId ?? null;
      }
    }

    if (existing) {
      const updateData: Prisma.DesignerBonusUpdateInput = {
        updatedAt: now,
        percent: data.percent ?? existing.percent,
        amount: amount ?? existing.amount,
      };
      if (data.designerId !== undefined) updateData.Designer = data.designerId ? { connect: { id: data.designerId } } : { disconnect: true };
      if (data.notes !== undefined) updateData.notes = data.notes;

      return prisma.designerBonus.update({ where: { projectId }, data: updateData });
    }

    return prisma.designerBonus.create({
      data: {
        id: randomUUID(),
        projectId,
        designerId: designerId ?? null,
        percent,
        amount: amount ?? 0,
        status: 'pending',
        notes: data.notes ?? null,
        updatedAt: now,
      },
    });
  }

  /**
   * Отметить бонус выплаченным: status → paid, paidAt = now.
   * Идемпотентно: повторный вызов не сбрасывает paidAt.
   *
   * Guard (FIN-06): бонус выплачивается разово ПОСЛЕ всех денег клиента.
   * Проверяет, что полученные income-платежи покрывают contractAmount.
   * Принимает `overrideUnmet` для принудительной выплаты (нестандартные ситуации).
   */
  async markPaid(id: string, overrideUnmet: boolean = false): Promise<DesignerBonus> {
    const bonus = await prisma.designerBonus.findUnique({ where: { id } });
    if (!bonus) throw new NotFoundError('Designer bonus not found');

    // FIN-06: проверка получения всех денег клиента.
    if (!overrideUnmet) {
      const project = await prisma.project.findUnique({
        where: { id: bonus.projectId },
        select: {
          contractAmount: true,
          Transaction: {
            where: { type: 'income', deletedAt: null },
            select: { amount: true },
          },
        },
      });
      const contractAmount = Number(project?.contractAmount ?? 0);
      const received = project?.Transaction.reduce((s, t) => s + Number(t.amount), 0) ?? 0;
      if (received < contractAmount - 0.01) {
        throw new ConflictError(
          `Бонус выплачивается после получения всех денег клиента. Получено ${received.toFixed(2)} из ${contractAmount.toFixed(2)}.`
        );
      }
    }

    const now = new Date();
    return prisma.designerBonus.update({
      where: { id },
      data: {
        status: 'paid',
        paidAt: bonus.paidAt ?? now,
        updatedAt: now,
      },
    });
  }

  /**
   * Накопленный долг дизайнера: сумма невыплаченных бонусов (status=pending)
   * по всем проектам одного дизайнера.
   */
  async getDesignerDebt(designerId: string): Promise<{ designerId: string; totalDebt: number; pendingCount: number }> {
    const result = await prisma.designerBonus.aggregate({
      where: { designerId, status: 'pending' },
      _sum: { amount: true },
      _count: true,
    });
    return {
      designerId,
      totalDebt: Number(result._sum.amount ?? 0),
      pendingCount: result._count,
    };
  }

  /**
   * Сводка накопленного долга по всем дизайнерам (FIN-06):
   * GROUP BY designerId WHERE status=pending → сумма долга каждого.
   */
  async getDebtSummary(): Promise<Array<{ designerId: string; designerName: string; totalDebt: number; pendingCount: number }>> {
    const pending = await prisma.designerBonus.findMany({
      where: { status: 'pending', designerId: { not: null } },
      select: {
        designerId: true,
        amount: true,
        Designer: { select: { name: true, email: true } },
      },
    });

    // Группировка по дизайнеру.
    const byDesigner = new Map<string, { totalDebt: number; pendingCount: number; name: string }>();
    for (const b of pending) {
      if (!b.designerId) continue;
      const existing = byDesigner.get(b.designerId) ?? { totalDebt: 0, pendingCount: 0, name: b.Designer?.name ?? b.Designer?.email ?? 'Дизайнер' };
      existing.totalDebt += Number(b.amount);
      existing.pendingCount += 1;
      byDesigner.set(b.designerId, existing);
    }

    return Array.from(byDesigner.entries())
      .map(([designerId, v]) => ({
        designerId,
        designerName: v.name,
        totalDebt: v.totalDebt,
        pendingCount: v.pendingCount,
      }))
      .sort((a, b) => b.totalDebt - a.totalDebt);
  }

  async delete(id: string): Promise<DesignerBonus> {
    return prisma.designerBonus.delete({ where: { id } });
  }
}

export const designerBonuses = new DesignerBonusRepository();
export default designerBonuses;
