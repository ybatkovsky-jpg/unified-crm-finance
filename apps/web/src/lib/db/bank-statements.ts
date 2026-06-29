/**
 * BankStatementRepository — импорт и хранение банк-выписок (FIN-02).
 *
 * Модели BankStatement / BankTransaction / TransactionMatchingAudit /
 * UnresolvedTransaction уже мигрированы. Здесь — прикладной слой:
 * импорт распарсенной выписки, выборки, удаление.
 */

import { prisma } from './prisma';
import type { BankStatement, BankTransaction, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { NotFoundError } from './errors';
import type { ParsedStatement } from '@/lib/finance/statement-parser';

export type BankStatementWithTx = Prisma.BankStatementGetPayload<{
  include: { BankTransaction: true; FileEntity: true };
}>;

export class BankStatementRepository {
  /**
   * Импортировать распарсенную выписку: создать BankStatement + BankTransaction[].
   * sourceFileId — ссылка на загруженный файл (FileEntity).
   */
  async importStatement(sourceFileId: string | null, parsed: ParsedStatement): Promise<BankStatement> {
    const now = new Date();
    const statement = await prisma.bankStatement.create({
      data: {
        id: randomUUID(),
        accountNumber: parsed.accountNumber,
        statementDate: parsed.statementDate ?? now,
        periodFrom: parsed.periodFrom,
        periodTo: parsed.periodTo,
        currency: 'RUB',
        totalIncome: parsed.totalIncome,
        totalExpense: parsed.totalExpense,
        sourceFileId,
        status: 'parsed',
        parsedAt: now,
        updatedAt: now,
      },
    });

    // Создать строки BankTransaction (только incoming-платежи представляют клиентские поступления;
    // исходящие тоже сохраняем для полноты выписки).
    if (parsed.transactions.length > 0) {
      await prisma.bankTransaction.createMany({
        data: parsed.transactions.map((t) => ({
          id: randomUUID(),
          statementId: statement.id,
          transactionDate: t.date,
          amount: t.amount,
          direction: t.direction,
          counterpartyName: t.counterpartyName,
          counterpartyInn: t.counterpartyInn,
          counterpartyAccount: t.counterpartyAccount,
          description: null,
          paymentPurpose: t.paymentPurpose,
          matchingStatus: 'unmatched',
          externalId: t.documentNumber ?? null,
          updatedAt: now,
        })),
      });
    }

    return statement;
  }

  async findById(id: string): Promise<BankStatementWithTx | null> {
    return prisma.bankStatement.findUnique({
      where: { id },
      include: {
        BankTransaction: { orderBy: { transactionDate: 'asc' } },
        FileEntity: true,
      },
    });
  }

  async list(): Promise<BankStatement[]> {
    return prisma.bankStatement.findMany({
      orderBy: { statementDate: 'desc' },
      include: { _count: { select: { BankTransaction: true } } },
    });
  }

  async findBankTransactions(statementId: string): Promise<BankTransaction[]> {
    return prisma.bankTransaction.findMany({
      where: { statementId },
      orderBy: { transactionDate: 'asc' },
    });
  }

  async delete(id: string): Promise<BankStatement> {
    return prisma.bankStatement.delete({ where: { id } });
  }
}

export const bankStatements = new BankStatementRepository();
export default bankStatements;
