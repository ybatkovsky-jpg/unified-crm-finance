/**
 * Общий парсер периодов — единый источник правды для отчётов (учёт/аналитика).
 * Поддерживаемые форматы строки period:
 *   "2026"        — весь год
 *   "2026-Q1"     — квартал (Jan–Mar)
 *   "2026-01"     — один месяц
 *   "3m"/"6m"/"12m" — скользящее окно назад от текущего месяца
 *   "all"         — без ограничения по дате (возвращает null)
 *
 * Возвращает {start, end} в локальном времени (end — последний момент периода),
 * либо null, если ограничение не нужно / формат не распознан.
 */

export interface DateRange {
  start: Date
  end: Date
}

const QUARTER_MONTHS = [0, 3, 6, 9] // старт-месяц Q1..Q4

export function parsePeriodToDateRange(period: string): DateRange | null {
  if (!period || period === 'all') return null

  // Скользящее окно: "3m" / "6m" / "12m" — от начала месяца (N месяцев назад) до конца текущего месяца.
  const rolling = period.match(/^(\d+)m$/)
  if (rolling) {
    const months = parseInt(rolling[1], 10)
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    return { start, end }
  }

  // Год целиком: "2026".
  if (/^\d{4}$/.test(period)) {
    const y = parseInt(period, 10)
    return { start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59, 999) }
  }

  // Квартал: "2026-Q1".
  const q = period.match(/^(\d{4})-Q([1-4])$/)
  if (q) {
    const y = parseInt(q[1], 10)
    const startMonth = QUARTER_MONTHS[parseInt(q[2], 10) - 1]
    return {
      start: new Date(y, startMonth, 1),
      end: new Date(y, startMonth + 3, 0, 23, 59, 59, 999),
    }
  }

  // Месяц: "2026-01".
  const m = period.match(/^(\d{4})-(\d{2})$/)
  if (m) {
    const y = parseInt(m[1], 10)
    const month = parseInt(m[2], 10) // 1..12
    return {
      start: new Date(y, month - 1, 1),
      end: new Date(y, month, 0, 23, 59, 59, 999),
    }
  }

  return null
}

/**
 * Перечень месяцев в диапазоне (включительно) в формате "YYYY-MM".
 * Используется для ДДС-отчётов — разбивка по месяцам периода.
 */
export function monthsInRange(period: string): string[] {
  const range = parsePeriodToDateRange(period)
  if (!range) return []

  const out: string[] = []
  const cur = new Date(range.start.getFullYear(), range.start.getMonth(), 1)
  const last = new Date(range.end.getFullYear(), range.end.getMonth(), 1)
  while (cur <= last) {
    out.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`)
    cur.setMonth(cur.getMonth() + 1)
  }
  return out
}
