/**
 * Bank statement parser (FIN-02).
 *
 * Поддерживает два формата:
 *  1. 1C Client-Bank exchange (текстовый, секции `1CClientBankExchange`,
 *     `СекцияРасчСчет`, `СекцияДокумент`) — стандартный формат выгрузки
 *     из 1С (Озон/Тинькофф и др. банки выгружают в нём или в близком).
 *  2. Толерантный plain-text fallback: парсит строки вида `ключ=значение`
 *     или табличные выгрузки, извлекая дату/сумму/ИНН/назначение эвристически.
 *
 * Допущения (без реального образца файла от заказчика):
 *  — суммы могут содержать пробелы/неразрывные пробелы как разделители тысяч;
 *  — дата в формате DD.MM.YYYY (российский стандарт) или ISO;
 *  — направление платежа: положительная сумма = приход (incoming),
 *    отрицательная = расход; если явного знака нет — считается приходом.
 * При получении реального образца выписки формат уточняется.
 */

export type BankDirection = 'incoming' | 'outgoing';

export interface ParsedBankTransaction {
  date: Date;
  amount: number;
  direction: BankDirection;
  counterpartyName: string | null;
  counterpartyInn: string | null;
  counterpartyAccount: string | null;
  paymentPurpose: string | null;
  documentNumber: string | null;
}

export interface ParsedStatement {
  statementDate: Date | null;
  accountNumber: string | null;
  periodFrom: Date | null;
  periodTo: Date | null;
  totalIncome: number;
  totalExpense: number;
  transactions: ParsedBankTransaction[];
}

/** Нормализовать строку числа ("1 234,56" / "1234.56" / "1 234.56") → number. */
function parseAmount(raw: string | null | undefined): number {
  if (!raw) return 0;
  // Убираем пробелы и неразр. пробелы, заменяем запятую на точку.
  const cleaned = raw.replace(/[\s\u00A0]/g, '').replace(',', '.').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/** Парсить дату DD.MM.YYYY или YYYY-MM-DD. */
function parseDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const s = raw.trim();
  // DD.MM.YYYY
  const m1 = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (m1) {
    const d = new Date(Number(m1[3]), Number(m1[2]) - 1, Number(m1[1]));
    return isNaN(d.getTime()) ? null : d;
  }
  // ISO YYYY-MM-DD
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) {
    const d = new Date(Number(m2[1]), Number(m2[2]) - 1, Number(m2[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  const fallback = new Date(s);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/** Извлечь числовой ИНН (10 или 12 цифр) из произвольной строки. */
function extractInn(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = raw.match(/\b(\d{10}|\d{12})\b/);
  return m ? m[1] : null;
}

type FieldMap = Record<string, string | undefined>;

/** Разобрать секцию документа в поля ключ=значение. */
function parseFields(block: string): FieldMap {
  const fields: FieldMap = {};
  for (const line of block.split(/\r?\n/)) {
    const idx = line.indexOf('=');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (key) fields[key] = value || undefined;
    }
  }
  return fields;
}

/**
 * Основной парсер. Определяет формат и делегирует.
 */
export function parseStatement(content: string): ParsedStatement {
  const text = content.replace(/^\uFEFF/, ''); // убрать BOM
  // 1C Client-Bank: есть заголовок 1CClientBankExchange
  if (/1CClientBankExchange/i.test(text) || /СекцияДокумент/i.test(text)) {
    return parse1CFormat(text);
  }
  // Fallback: эвристический plain-text
  return parsePlainText(text);
}

/** Парсер формата 1C Client-Bank. */
function parse1CFormat(text: string): ParsedStatement {
  let accountNumber: string | null = null;
  let periodFrom: Date | null = null;
  let periodTo: Date | null = null;
  let statementDate: Date | null = null;

  // Секция расчётного счёта — реквизиты выписки
  const accountMatch = text.match(/СекцияРасчСчет([\s\S]*?)(?:КонецРасчСчет|$)/);
  if (accountMatch) {
    const f = parseFields(accountMatch[1]);
    accountNumber = f['РасчетныйСчет'] ?? f['Счет'] ?? null;
    periodFrom = parseDate(f['ДатаНачала']);
    periodTo = parseDate(f['ДатаКонца']);
  }
  statementDate = periodTo ?? new Date();

  // Секции документов — отдельные платежи.
  // Формат 1C: строка `СекцияДокумент=<ТипДокумента>` открывает блок, далее поля,
  // блок заканчивается `КонецДокумента`.
  const transactions: ParsedBankTransaction[] = [];
  const docRegex = /СекцияДокумент(?:=([^\r\n]*))?([\s\S]*?)(?=СекцияДокумент|КонецФайла|$)/g;
  let docMatch: RegExpExecArray | null;
  while ((docMatch = docRegex.exec(text)) !== null) {
    const docTypeHeader = (docMatch[1] || '').trim();
    const f = parseFields(docMatch[2]);
    const amount = parseAmount(f['Сумма']);
    if (amount === 0) continue;

    // В 1C направление определяется типом документа (из заголовка или ВидДокумента)
    // или знаком суммы.
    const docType = (docTypeHeader || f['ВидДокумента'] || '').toLowerCase();
    const isOutgoing =
      docType.includes('списание') ||
      docType.includes('платежноепоручение') ||
      docType.includes('расход') ||
      amount < 0;
    const direction: BankDirection = isOutgoing ? 'outgoing' : 'incoming';
    const absAmount = Math.abs(amount);

    transactions.push({
      date: parseDate(f['Дата'] ?? f['ДатаПроведения']) ?? statementDate!,
      amount: absAmount,
      direction,
      counterpartyName: f['Плательщик'] ?? f['Получатель'] ?? f['НаименованиеПлательщика'] ?? null,
      counterpartyInn: extractInn(f['ПлательщикИНН'] ?? f['ИНН'] ?? f['Плательщик1'] ?? null),
      counterpartyAccount: f['ПлательщикРасчСчет'] ?? f['РасчСчетПлательщика'] ?? null,
      paymentPurpose: f['НазначениеПлатежа'] ?? f['Назначение'] ?? null,
      documentNumber: f['Номер'] ?? f['НомерДокумента'] ?? null,
    });
  }

  const totalIncome = transactions.filter((t) => t.direction === 'incoming').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.direction === 'outgoing').reduce((s, t) => s + t.amount, 0);

  return {
    statementDate,
    accountNumber,
    periodFrom,
    periodTo,
    totalIncome,
    totalExpense,
    transactions,
  };
}

/**
 * Эвристический plain-text парсер (для не-1C выгрузок).
 * Поддерживает строки вида `ключ=значение` и табличные строки (разделённые табом/точкой с запятой).
 * Поля распознаются по подстрокам в ключах/заголовках.
 */
function parsePlainText(text: string): ParsedStatement {
  const transactions: ParsedBankTransaction[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Строка ключ=значение
    if (line.includes('=')) {
      const f = parseFields(line);
      const amount = parseAmount(f['Сумма'] ?? f['Amount']);
      if (amount === 0) continue;
      const date = parseDate(f['Дата'] ?? f['Date'] ?? f['Дата операции']);
      transactions.push({
        date: date ?? new Date(),
        amount: Math.abs(amount),
        direction: amount < 0 ? 'outgoing' : 'incoming',
        counterpartyName: f['Плательщик'] ?? f['Наименование'] ?? f['Контрагент'] ?? null,
        counterpartyInn: extractInn(f['ИНН'] ?? f['Inn'] ?? null),
        counterpartyAccount: f['Счет'] ?? f['РасчСчет'] ?? null,
        paymentPurpose: f['Назначение'] ?? f['НазначениеПлатежа'] ?? f['Purpose'] ?? null,
        documentNumber: f['Номер'] ?? f['Number'] ?? null,
      });
      continue;
    }
    // Табличная строка: дата;контрагент;назначение;сумма
    const cols = line.split(/[\t;]/).map((c) => c.trim());
    if (cols.length >= 4) {
      const date = parseDate(cols[0]);
      const amount = parseAmount(cols[cols.length - 1]);
      if (date && amount > 0) {
        transactions.push({
          date,
          amount: Math.abs(amount),
          direction: amount < 0 ? 'outgoing' : 'incoming',
          counterpartyName: cols[1] || null,
          counterpartyInn: extractInn(cols[1]),
          counterpartyAccount: null,
          paymentPurpose: cols[2] || null,
          documentNumber: null,
        });
      }
    }
  }

  const totalIncome = transactions.filter((t) => t.direction === 'incoming').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.direction === 'outgoing').reduce((s, t) => s + t.amount, 0);

  return {
    statementDate: new Date(),
    accountNumber: null,
    periodFrom: null,
    periodTo: null,
    totalIncome,
    totalExpense,
    transactions,
  };
}
