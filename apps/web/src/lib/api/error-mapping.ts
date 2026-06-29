/**
 * Maps repository/Prisma errors to HTTP-appropriate JSON responses.
 *
 * Prisma foreign-key violations (P2003) surface as raw 500s when a create
 * payload references a non-existent parent (e.g. managerId that isn't a User).
 * This helper converts them to a clear 400 so the client gets an actionable
 * message instead of a server crash.
 *
 * Recognised Prisma codes:
 *  - P2002  unique-constraint violation  → 409 Conflict
 *  - P2003  foreign-key violation         → 400 Bad Request (referenced record missing)
 *  - P2025  record not found              → 404 Not Found
 *
 * Repository errors carrying a `statusCode` (NotFoundError/ValidationError/
 * ConflictError from src/lib/db/errors.ts) are honoured as-is.
 */

import { NextResponse } from 'next/server';

/** Prisma error shape (subset we care about). */
interface PrismaErrorLike {
  code?: string;
  meta?: { field_name?: string | string[]; target?: string[]; cause?: string };
  message?: string;
}

function isPrismaError(error: unknown): error is PrismaErrorLike {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    (error as { code: string }).code.startsWith('P')
  );
}

/** Extract a human-friendly field hint from a Prisma error's meta. */
function fieldHint(error: PrismaErrorLike): string | undefined {
  const meta = error.meta;
  if (!meta) return undefined;
  const raw =
    (Array.isArray(meta.field_name) ? meta.field_name[0] : meta.field_name) ??
    meta.target?.[0];
  if (typeof raw !== 'string') return undefined;
  // Prisma reports fields as `Model_field_fkey (index)` for FK errors; trim to field name.
  return raw.split('_').pop() ?? raw;
}

/**
 * Convert a caught error into a JSON `NextResponse`.
 *
 * @param action  short label used in the generic 500 message, e.g. "create deal".
 */
export function mapErrorToResponse(error: unknown, action: string): NextResponse {
  // Repository-level errors with explicit status codes.
  const statusCode = (error as { statusCode?: number }).statusCode;
  if (statusCode === 400 || statusCode === 404 || statusCode === 409) {
    const label =
      statusCode === 404 ? 'Not found' : statusCode === 409 ? 'Conflict' : 'Validation failed';
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: label, message }, { status: statusCode });
  }

  if (isPrismaError(error)) {
    const message = error.message ?? 'Database error';
    const field = fieldHint(error);

    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          {
            error: 'Conflict',
            message: field
              ? `Запись с таким значением «${field}» уже существует`
              : 'Нарушение уникальности (запись уже существует)',
          },
          { status: 409 }
        );
      case 'P2003': {
        const hint = field ? ` (поле: ${field})` : '';
        return NextResponse.json(
          {
            error: 'Validation failed',
            message: `Указана ссылка на несуществующую запись${hint}. Проверьте выбранные контакт/менеджера/проект.`,
          },
          { status: 400 }
        );
      }
      case 'P2025':
        return NextResponse.json(
          { error: 'Not found', message: 'Связанная запись не найдена' },
          { status: 404 }
        );
    }
  }

  console.error(`Failed to ${action}:`, error);
  const message = error instanceof Error ? error.message : 'Unknown error';
  return NextResponse.json({ error: `Failed to ${action}`, message }, { status: 500 });
}
