/**
 * Entity Sequence Generator
 *
 * Generates shared project/contract numbers in format ПМ{YYYY}-{NNNN}
 * with a sequential counter per year.
 *
 * Проект и договор получают ОДИН общий номер (ТЗ: «Номер один на проект и договор»).
 */

import type { PrismaClient } from '@prisma/client'

/** Format: ПМ2026-0001 */
export const PROJECT_PREFIX = 'ПМ'

export function formatProjectNumber(year: number, seq: number): string {
  return `${PROJECT_PREFIX}${year}-${String(seq).padStart(4, '0')}`
}

/**
 * Generate the next project/contract number for a given year.
 * Must be called within a Prisma transaction (tx) for atomicity.
 *
 * Считает количество существующих проектов с префиксом ПМ{year} и возвращает count+1.
 */
export async function nextProjectNumber(
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  year: number
): Promise<string> {
  const prefix = `${PROJECT_PREFIX}${year}`
  const count = await tx.project.count({
    where: { externalNumber: { startsWith: prefix } },
  })
  return formatProjectNumber(year, count + 1)
}
