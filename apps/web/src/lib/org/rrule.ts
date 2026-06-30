/**
 * RRULE-обёртка над библиотекой `rrule` (RFC 5545). PLAT-06.
 *
 * Шаблон задачи хранит `rrule` (напр. "FREQ=MONTHLY;BYMONTHDAY=25") и `dtStart`
 * (дата начала отсчёта) отдельными полями. Здесь — безопасные функции для:
 *   - построения RFC-строки из конструктора (buildRrule),
 *   - парсинга строки обратно в опции (parseRrule) — для UI,
 *   - вычисления инстансов в окне (occurrencesBetween) — для материализации,
 *   - предпросмотра следующих дат (previewDates) — для UI.
 *
 * Все функции defensive: невалидная строка → выброс ValidationError (не падает молча).
 */

import { RRule, rrulestr, Frequency } from 'rrule'
import { ValidationError } from '@/lib/db/errors'

/** Поддерживаемые частоты рекурренции (соответствуют rrule FREQ). */
export type RruleFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

/** Дни недели (RFC: MO,TU,WE,TH,FR,SA,SU). */
export type WeekdayCode = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU'

export interface BuildRruleInput {
  freq: RruleFreq
  interval?: number
  byDay?: WeekdayCode[]
  byMonthDay?: number[]
  until?: Date | null
}

/** Маппинг freq-строка → числовой код rrule. */
const FREQ_MAP: Record<RruleFreq, Frequency> = {
  DAILY: Frequency.DAILY,
  WEEKLY: Frequency.WEEKLY,
  MONTHLY: Frequency.MONTHLY,
  YEARLY: Frequency.YEARLY,
}

const FREQ_CODES = Object.keys(FREQ_MAP) as RruleFreq[]

/** Построить RFC-5545 строку из полей конструктора (без DTSTART). */
export function buildRrule(input: BuildRruleInput): string {
  if (!input || !FREQ_CODES.includes(input.freq)) {
    throw new ValidationError(`Invalid freq: ${input?.freq}`)
  }

  const parts: string[] = [`FREQ=${input.freq}`]

  if (input.interval && input.interval > 1) {
    parts.push(`INTERVAL=${Math.floor(input.interval)}`)
  }
  if (input.byDay && input.byDay.length > 0) {
    parts.push(`BYDAY=${input.byDay.join(',')}`)
  }
  if (input.byMonthDay && input.byMonthDay.length > 0) {
    parts.push(`BYMONTHDAY=${input.byMonthDay.join(',')}`)
  }
  if (input.until) {
    parts.push(`UNTIL=${rruleUtcString(input.until)}`)
  }

  return parts.join(';')
}

/** Отформатировать дату в UTC-строку RFC 5545 (YYYYMMDDTHHMMSSZ). */
function rruleUtcString(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    String(d.getUTCMonth() + 1).padStart(2, '0') +
    String(d.getUTCDate()).padStart(2, '0') +
    'T' +
    String(d.getUTCHours()).padStart(2, '0') +
    String(d.getUTCMinutes()).padStart(2, '0') +
    String(d.getUTCSeconds()).padStart(2, '0') +
    'Z'
  )
}

export interface ParsedRrule {
  freq: RruleFreq
  interval: number
  byDay?: WeekdayCode[]
  byMonthDay?: number[]
  until?: Date
}

/** Распарсить RFC-строку в поля конструктора. Бросает ValidationError при ошибке. */
export function parseRrule(ruleStr: string): ParsedRrule {
  if (!ruleStr?.trim()) {
    throw new ValidationError('RRULE string is empty')
  }
  try {
    // parseString понимает чистые RRULE-строки (FREQ=...). Если есть DTSTART —
    // берём fromString (он корректно парсит полную строку).
    const opts = ruleStr.includes('DTSTART')
      ? RRule.fromString(ruleStr).origOptions
      : RRule.parseString(ruleStr)

    const freqNum = opts.freq
    const freq = FREQ_CODES.find((f) => FREQ_MAP[f] === freqNum)
    if (!freq) {
      throw new ValidationError(`Unsupported FREQ in: ${ruleStr}`)
    }

    const result: ParsedRrule = {
      freq,
      interval: opts.interval ?? 1,
    }

    if (opts.byweekday) {
      // byweekday может быть ByWeekday | ByWeekday[]; нормализуем в массив.
      const wds = Array.isArray(opts.byweekday) ? opts.byweekday : [opts.byweekday]
      result.byDay = wds.map((wd: any) => {
        // rrule Weekday имеет .weekday; число — это индекс (0=MO..6=SU).
        const idx = typeof wd === 'number' ? wd : wd?.weekday
        return ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'][idx] as WeekdayCode
      })
    }
    if (opts.bymonthday) {
      const mds = Array.isArray(opts.bymonthday) ? opts.bymonthday : [opts.bymonthday]
      if (mds.length > 0) result.byMonthDay = [...mds]
    }
    if (opts.until) {
      result.until = new Date(opts.until)
    }
    return result
  } catch (err) {
    if (err instanceof ValidationError) throw err
    throw new ValidationError(
      `Invalid RRULE: ${ruleStr} (${err instanceof Error ? err.message : 'parse error'})`
    )
  }
}

/** Проверить валидность RFC-строки (true/false). */
export function isValidRrule(ruleStr: string): boolean {
  try {
    parseRrule(ruleStr)
    return true
  } catch {
    return false
  }
}

/**
 * Создать инстанс RRule с заданным dtStart (для расчёта инстансов).
 * Возвращает null для невалидной/пустой строки (мягкая деградация).
 */
export function makeRule(ruleStr: string, dtStart: Date): RRule | null {
  if (!ruleStr?.trim()) return null
  try {
    // parseString понимает чистые RRULE-опции (FREQ=...). dtstart подставляем отдельно.
    const opts = RRule.parseString(ruleStr)
    return new RRule({ ...opts, dtstart: dtStart })
  } catch {
    return null
  }
}

/**
 * Даты инстансов в полуоткрытом окне [from, to] (или [from, ∞) если to опущен).
 * from включается, to — нет (соответствует rrule.between). Для материализации
 * вызывают с to = now, чтобы получить «уже наступившие» инстансы.
 */
export function occurrencesBetween(
  ruleStr: string,
  dtStart: Date,
  from: Date,
  to?: Date
): Date[] {
  const rule = makeRule(ruleStr, dtStart)
  if (!rule) return []
  // between(from, to, inc=true): включить from. Если to нет — берём до конца (until или далеко).
  if (to) {
    return rule.between(from, to, true)
  }
  // Без to — берём все от from до until (или бессрочно ограничиваем 5 годами безопасности).
  const safeUntil = parseRruleSafe(ruleStr).until ?? new Date(from.getTime() + 5 * 365 * 24 * 3600 * 1000)
  return rule.between(from, to ?? safeUntil, true)
}

function parseRruleSafe(ruleStr: string): ParsedRrule {
  try {
    return parseRrule(ruleStr)
  } catch {
    return { freq: 'DAILY', interval: 1 }
  }
}

/**
 * Предпросмотр следующих N инстансов от dtStart (для UI-конструктора).
 * Если until задано — учитывается; иначе capped на count (через between с конечной датой,
 * т.к. .all() для бесконечного правила не завершается).
 */
export function previewDates(
  ruleStr: string,
  dtStart: Date,
  count = 5
): Date[] {
  const rule = makeRule(ruleStr, dtStart)
  if (!rule) return []
  // Берём с запасом (count * ~370 дней от dtStart, минимум 1 год вперёд).
  const horizon = new Date(dtStart.getTime() + Math.max(365, count) * 366 * 24 * 3600 * 1000)
  return rule
    .between(dtStart, horizon, true)
    .slice(0, count)
    .map((d) => new Date(d))
}
