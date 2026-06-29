/**
 * Bank Statement Import API (FIN-02)
 *
 * POST /api/finance/statements/import — multipart: file (1C/TXT) → парсинг → сохранение.
 *
 * Принимает multipart/form-data с полем `file`. Читает содержимое как UTF-8,
 * парсит через statement-parser, сохраняет BankStatement + BankTransaction[].
 */

import { NextRequest, NextResponse } from 'next/server';
import { bankStatements } from '@/lib/db/bank-statements';
import { parseStatement } from '@/lib/finance/statement-parser';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'file is required' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'File too large (max 10 MB)' },
        { status: 400 }
      );
    }

    // Читаем содержимое как текст (1C/TXT — текстовый формат).
    const content = await file.text();
    if (!content.trim()) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'File is empty' },
        { status: 400 }
      );
    }

    // Парсинг.
    const parsed = parseStatement(content);

    if (parsed.transactions.length === 0) {
      return NextResponse.json(
        {
          error: 'Parse failed',
          message: 'Не удалось распознать ни одной транзакции в файле. Проверьте формат (ожидается 1C Client-Bank или текстовая выгрузка).',
          parsed,
        },
        { status: 422 }
      );
    }

    // Сохраняем выписку (без sourceFileId — содержимое парсится на лету,
    // отдельная загрузка файла опциональна).
    const statement = await bankStatements.importStatement(null, parsed);
    const data = await bankStatements.findById(statement.id);

    return NextResponse.json({
      data,
      parsed: {
        transactionsCount: parsed.transactions.length,
        totalIncome: parsed.totalIncome,
        totalExpense: parsed.totalExpense,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to import bank statement:', error);
    const status =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? (error as { statusCode: number }).statusCode
        : 500;
    return NextResponse.json(
      { error: 'Failed to import bank statement', message: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    );
  }
}
