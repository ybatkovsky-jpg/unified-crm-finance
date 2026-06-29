/**
 * Matching engine — авто-сверка банк-транзакций со счетами/контрагентами (FIN-02).
 *
 * Для каждой входящей BankTransaction (direction=incoming) пытается найти
 * соответствие: контрагента по ИНН, затем счёт по контрагенту+сумме.
 * Назначает confidence score и пишет TransactionMatchingAudit.
 * Высокий confidence → авто-сопоставление; низкий → в очередь ручного разбора
 * (UnresolvedTransaction).
 */

import { prisma } from '@/lib/db/prisma';
import type { BankTransaction, Counterparty, Invoice, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { NotFoundError } from '@/lib/db/errors';

export interface MatchResult {
  bankTransactionId: string;
  matched: boolean;
  confidence: number;
  method: string;
  invoiceId: string | null;
  counterpartyId: string | null;
  matchedBy: string | null;
}

export interface MatchSummary {
  total: number;
  matched: number;
  unmatched: number;
  results: MatchResult[];
}

/** Запустить автосверку по всем unmatched incoming-транзакциям выписки. */
export async function matchBankTransactions(statementId: string): Promise<MatchSummary> {
  const statement = await prisma.bankStatement.findUnique({ where: { id: statementId } });
  if (!statement) throw new NotFoundError('Bank statement not found');

  // Только входящие (клиентские поступления) подлежат сверке с доходной стороной.
  const bankTxns = await prisma.bankTransaction.findMany({
    where: { statementId, direction: 'incoming' },
  });

  const results: MatchResult[] = [];
  let matchedCount = 0;

  for (const bt of bankTxns) {
    const result = await matchSingle(bt);
    results.push(result);
    if (result.matched) matchedCount++;
  }

  return {
    total: bankTxns.length,
    matched: matchedCount,
    unmatched: bankTxns.length - matchedCount,
    results,
  };
}

/** Сверить одну банк-транзакцию: найти контрагента по ИНН, счёт по сумме. */
async function matchSingle(bt: BankTransaction): Promise<MatchResult> {
  const now = new Date();
  const amount = Number(bt.amount);

  // 1. Найти контрагента по ИНН.
  let counterparty: Counterparty | null = null;
  if (bt.counterpartyInn) {
    counterparty = await prisma.counterparty.findFirst({
      where: { inn: bt.counterpartyInn },
    });
  }

  // 2. Найти счёт по контрагенту + сумме (если контрагент найден).
  let invoice: Invoice | null = null;
  let confidence = 0;
  let method = '';
  let matchedBy: string | null = null;

  if (counterparty) {
    // Счета этого контрагента-поставщика на близкую сумму.
    invoice = await prisma.invoice.findFirst({
      where: {
        supplierId: counterparty.id,
        // допуск ±1% от суммы
        totalAmount: { gte: amount * 0.99, lte: amount * 1.01 },
      },
    });

    if (invoice) {
      confidence = 1.0;
      method = 'inn+amount';
      matchedBy = `ИНН ${bt.counterpartyInn} + сумма`;
    } else {
      // Контрагент найден, но точной суммы нет — средний confidence.
      confidence = 0.7;
      method = 'inn';
      matchedBy = `ИНН ${bt.counterpartyInn}`;
    }
  } else if (amount > 0) {
    // ИНН не найден — попробовать по сумме + назначению (слабое совпадение).
    invoice = await prisma.invoice.findFirst({
      where: {
        totalAmount: { gte: amount * 0.99, lte: amount * 1.01 },
      },
    });
    if (invoice) {
      confidence = 0.5;
      method = 'amount';
      matchedBy = 'сумма';
    }
  }

  const matched = confidence >= 0.7;

  // Записать аудит.
  await prisma.transactionMatchingAudit.create({
    data: {
      id: randomUUID(),
      bankTransactionId: bt.id,
      invoiceId: invoice?.id ?? null,
      confidenceScore: confidence,
      method,
      decision: matched ? 'auto' : 'manual',
      matchedBy,
      notes: matched ? 'Авто-сопоставление' : 'Требует ручного подтверждения',
      createdAt: now,
    },
  });

  // Обновить статус банк-транзакции.
  if (matched) {
    await prisma.bankTransaction.update({
      where: { id: bt.id },
      data: { matchingStatus: 'matched' },
    });
  } else {
    // В очередь ручного разбора (если ещё не в очереди).
    const existingUnresolved = await prisma.unresolvedTransaction.findFirst({
      where: { bankTransactionId: bt.id },
    });
    if (!existingUnresolved) {
      await prisma.unresolvedTransaction.create({
        data: {
          id: randomUUID(),
          bankTransactionId: bt.id,
          amount: bt.amount,
          reason: 'Низкий confidence сверки',
          status: 'open',
          updatedAt: now,
        },
      });
    }
  }

  return {
    bankTransactionId: bt.id,
    matched,
    confidence,
    method,
    invoiceId: invoice?.id ?? null,
    counterpartyId: counterparty?.id ?? null,
    matchedBy,
  };
}

/**
 * Ручное подтверждение сопоставления: связывает банк-транзакцию с
 * указанным счётом/проектом и создаёт Transaction(income, source=import).
 */
export async function confirmMatch(
  bankTransactionId: string,
  options: { invoiceId?: string; projectId?: string; paymentMethod?: string }
): Promise<{ transactionId: string }> {
  const bt = await prisma.bankTransaction.findUnique({
    where: { id: bankTransactionId },
    include: { BankStatement: true },
  });
  if (!bt) throw new NotFoundError('Bank transaction not found');

  const now = new Date();
  const amount = Number(bt.amount);

  // Доходная категория для создаваемой транзакции.
  const cat = await prisma.category.findFirst({ where: { type: 'income' } });
  if (!cat) throw new Error('Нет доходной категории (type=income)');

  // Дедупликация: если уже есть Transaction с этим externalId/source — не дублируем.
  const existing = await prisma.transaction.findFirst({
    where: { externalId: bt.id, source: 'import' },
  });
  if (existing) {
    return { transactionId: existing.id };
  }

  const projectId = options.projectId ?? (options.invoiceId
    ? (await prisma.invoice.findUnique({ where: { id: options.invoiceId } }))?.projectId
    : null) ?? null;

  const transaction = await prisma.transaction.create({
    data: {
      id: randomUUID(),
      projectId,
      categoryId: cat.id,
      counterpartyId: null,
      invoiceId: options.invoiceId ?? null,
      createdBy: 'system',
      date: bt.transactionDate,
      amount,
      type: 'income',
      description: bt.paymentPurpose ?? bt.counterpartyName ?? 'Импорт банк-выписки',
      source: 'import',
      externalId: bt.id,
      paymentMethod: options.paymentMethod ?? 'bank',
      updatedAt: now,
    },
  });

  // Пометить банк-транзакцию сопоставленной.
  await prisma.bankTransaction.update({
    where: { id: bankTransactionId },
    data: { matchingStatus: 'matched' },
  });

  // Закрыть unresolved, если было.
  await prisma.unresolvedTransaction.updateMany({
    where: { bankTransactionId },
    data: { status: 'resolved', resolvedAt: now, updatedAt: now },
  });

  return { transactionId: transaction.id };
}
