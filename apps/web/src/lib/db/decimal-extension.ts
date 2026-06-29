/**
 * Decimal → number normalization for the Prisma client.
 *
 * Денежные поля хранятся в БД как Decimal(15,2) (точное хранение + точная
 * SQL-агрегация _sum/_avg). В TypeScript/UI удобнее работать с number, поэтому
 * оборачиваем клиент query-extension'ом: каждый результат рекурсивно
 * конвертирует Prisma.Decimal → number. Применяется ко всем моделям/операциям,
 * поэтому ни один роут/компонент не получает «сырой» Decimal.
 *
 * Внимание: это runtime-нормализация. На уровне типов Prisma по-прежнему
 * объявляет эти поля как Decimal (модельные типы — это type-алиасы, не
 * augmentable). Поэтому места с арифметикой/.toLocaleString правятся по факту
 * ошибок tsc (см. STEP-2-SCHEMA.md, стратегия Decimal).
 */

import { Prisma, PrismaClient } from '@prisma/client';

/** Рекурсивно in-place конвертирует Prisma.Decimal → number. */
function normalizeDecimal(value: unknown): unknown {
  if (value instanceof Prisma.Decimal) return value.toNumber();
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = normalizeDecimal(value[i]) as never;
    }
    return value;
  }
  if (value && typeof value === 'object') {
    // Date/Buffer и прочие «непростые» объекты не раскрываем
    if (value instanceof Date || value instanceof Buffer) return value;
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      record[key] = normalizeDecimal(record[key]);
    }
    return value;
  }
  return value;
}

/**
 * Оборачивает PrismaClient так, что Decimal-поля любого запроса возвращаются
 * как number. Применять к КАЖДОМУ синглтону (db, prisma) — иначе импортирующие
 * роуты получат сырые Decimal.
 */
export function withDecimalNumbers(client: PrismaClient) {
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ query, args }) {
          const result = await query(args);
          return normalizeDecimal(result);
        },
      },
    },
  });
}

export type DecimalNormalizedClient = ReturnType<typeof withDecimalNumbers>;
