/**
 * DebtsRepository — дебиторская и кредиторская задолженность (FIN-05).
 *
 * Дебиторка (нам должны клиенты): contractAmount − полученные income-платежи.
 * Кредиторка (мы должны): неоплаченные счета поставщикам + невыплаченные бонусы дизайнерам.
 * Просрочка определяется по dueDate (счета) / endDate (проекты).
 */

import { prisma } from './prisma';

export interface ReceivableItem {
  projectId: string;
  projectName: string;
  externalNumber: string;
  clientName: string;
  contractAmount: number;
  received: number;
  amount: number; // долг
  dueDate: string | null;
  overdue: boolean;
}

export interface PayableItem {
  type: 'supplier' | 'designer';
  counterpartyName: string;
  projectName: string | null;
  amount: number;
  dueDate: string | null;
  overdue: boolean;
  refId: string; // invoice.id или designerBonus.id
}

export interface DebtSummary {
  receivables: ReceivableItem[];
  payables: PayableItem[];
  totals: {
    receivableTotal: number;
    receivableOverdue: number;
    payableTotal: number;
    payableOverdue: number;
  };
}

export class DebtsRepository {
  async getSummary(): Promise<DebtSummary> {
    const now = new Date();

    // ── Дебиторка: проекты, где contractAmount > полученных income-платежей ──
    const projects = await prisma.project.findMany({
      where: { deletedAt: null, status: { not: 'completed' } },
      select: {
        id: true,
        name: true,
        externalNumber: true,
        contractAmount: true,
        endDate: true,
        Contact: { select: { type: true, companyName: true, firstName: true, lastName: true } },
        Transaction: {
          where: { type: 'income', deletedAt: null },
          select: { amount: true },
        },
      },
    });

    const receivables: ReceivableItem[] = projects
      .map((p) => {
        const contractAmount = Number(p.contractAmount ?? 0);
        const received = p.Transaction.reduce((s, t) => s + Number(t.amount), 0);
        const amount = contractAmount - received;
        const clientName = p.Contact
          ? p.Contact.type === 'company'
            ? p.Contact.companyName || 'Юрлицо'
            : [p.Contact.lastName, p.Contact.firstName].filter(Boolean).join(' ') || 'Физлицо'
          : 'Без контрагента';
        const dueDate = p.endDate;
        return {
          projectId: p.id,
          projectName: p.name,
          externalNumber: p.externalNumber,
          clientName,
          contractAmount,
          received,
          amount,
          dueDate: dueDate ? dueDate.toISOString() : null,
          overdue: dueDate ? dueDate < now && amount > 0.01 : false,
        };
      })
      .filter((r) => r.amount > 0.01); // только реальные долги

    // ── Кредиторка поставщикам: неоплаченные счета ──
    const unpaidInvoices = await prisma.invoice.findMany({
      where: { paidAt: null },
      select: {
        id: true,
        totalAmount: true,
        dueDate: true,
        invoiceNumber: true,
        Counterparty: { select: { name: true } },
        Project: { select: { name: true, externalNumber: true } },
      },
    });

    const supplierPayables: PayableItem[] = unpaidInvoices.map((inv) => ({
      type: 'supplier' as const,
      counterpartyName: inv.Counterparty?.name ?? 'Поставщик',
      projectName: inv.Project ? `${inv.Project.externalNumber} — ${inv.Project.name}` : null,
      amount: Number(inv.totalAmount),
      dueDate: inv.dueDate ? inv.dueDate.toISOString() : null,
      overdue: inv.dueDate ? inv.dueDate < now : false,
      refId: inv.id,
    }));

    // ── Кредиторка дизайнерам: невыплаченные бонусы ──
    const pendingBonuses = await prisma.designerBonus.findMany({
      where: { status: 'pending' },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        Designer: { select: { name: true, email: true } },
        Project: { select: { name: true, externalNumber: true } },
      },
    });

    const designerPayables: PayableItem[] = pendingBonuses.map((b) => ({
      type: 'designer' as const,
      counterpartyName: b.Designer?.name ?? b.Designer?.email ?? 'Дизайнер',
      projectName: b.Project ? `${b.Project.externalNumber} — ${b.Project.name}` : null,
      amount: Number(b.amount),
      dueDate: null,
      overdue: false, // у бонуса нет due date; считается ожидающим
      refId: b.id,
    }));

    const payables = [...supplierPayables, ...designerPayables];

    const receivableTotal = receivables.reduce((s, r) => s + r.amount, 0);
    const receivableOverdue = receivables.filter((r) => r.overdue).reduce((s, r) => s + r.amount, 0);
    const payableTotal = payables.reduce((s, p) => s + p.amount, 0);
    const payableOverdue = payables.filter((p) => p.overdue).reduce((s, p) => s + p.amount, 0);

    return {
      receivables,
      payables,
      totals: {
        receivableTotal,
        receivableOverdue,
        payableTotal,
        payableOverdue,
      },
    };
  }
}

export const debts = new DebtsRepository();
export default debts;
