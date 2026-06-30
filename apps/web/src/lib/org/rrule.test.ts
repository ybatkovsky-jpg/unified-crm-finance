/**
 * RRULE обёртка — тесты (node:test + tsx). PLAT-06.
 *
 * Тестирует buildRrule/parseRrule/previewDates/occurrencesBetween без БД.
 * Запуск: npx tsx --test src/lib/org/rrule.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { buildRrule, parseRrule, isValidRrule, previewDates, occurrencesBetween } from './rrule.js'

describe('RRULE: buildRrule', () => {
  it('строит ежемесячное правило с BYMONTHDAY', () => {
    const rule = buildRrule({ freq: 'MONTHLY', byMonthDay: [25] })
    assert.ok(rule.includes('FREQ=MONTHLY'))
    assert.ok(rule.includes('BYMONTHDAY=25'))
  })

  it('строит еженедельное правило с BYDAY и INTERVAL', () => {
    const rule = buildRrule({ freq: 'WEEKLY', interval: 2, byDay: ['MO', 'FR'] })
    assert.ok(rule.includes('FREQ=WEEKLY'))
    assert.ok(rule.includes('INTERVAL=2'))
    assert.ok(rule.includes('BYDAY=MO,FR'))
  })

  it('добавляет UNTIL при наличии', () => {
    const until = new Date('2027-01-01T00:00:00Z')
    const rule = buildRrule({ freq: 'DAILY', until })
    assert.ok(rule.includes('UNTIL=20270101T000000Z'))
  })

  it('бросает ValidationError при невалидном freq', () => {
    assert.throws(() => buildRrule({ freq: 'HOURLY' as any }), /Invalid freq/)
  })

  it('не добавляет INTERVAL при interval=1', () => {
    const rule = buildRrule({ freq: 'MONTHLY', interval: 1 })
    assert.ok(!rule.includes('INTERVAL'))
  })
})

describe('RRULE: parseRrule', () => {
  it('парсит MONTHLY с BYMONTHDAY', () => {
    const p = parseRrule('FREQ=MONTHLY;BYMONTHDAY=25')
    assert.strictEqual(p.freq, 'MONTHLY')
    assert.deepStrictEqual(p.byMonthDay, [25])
    assert.strictEqual(p.interval, 1)
  })

  it('парсит WEEKLY с BYDAY и INTERVAL', () => {
    const p = parseRrule('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR')
    assert.strictEqual(p.freq, 'WEEKLY')
    assert.strictEqual(p.interval, 2)
    assert.deepStrictEqual(p.byDay, ['MO', 'FR'])
  })

  it('roundtrip: build → parse сохраняет смысл', () => {
    const built = buildRrule({ freq: 'MONTHLY', byMonthDay: [15] })
    const parsed = parseRrule(built)
    assert.strictEqual(parsed.freq, 'MONTHLY')
    assert.deepStrictEqual(parsed.byMonthDay, [15])
  })

  it('бросает ValidationError при пустой строке', () => {
    assert.throws(() => parseRrule(''), /empty/)
    assert.throws(() => parseRrule('   '), /empty/)
  })

  it('бросает ValidationError при мусоре', () => {
    assert.throws(() => parseRrule('NOTARRULE'), /Invalid RRULE/)
  })
})

describe('RRULE: isValidRrule', () => {
  it('true для валидных правил', () => {
    assert.ok(isValidRrule('FREQ=MONTHLY;BYMONTHDAY=25'))
    assert.ok(isValidRrule('FREQ=WEEKLY;BYDAY=MO'))
    assert.ok(isValidRrule('FREQ=YEARLY'))
  })

  it('false для невалидных', () => {
    assert.strictEqual(isValidRrule(''), false)
    assert.strictEqual(isValidRrule('garbage'), false)
  })
})

describe('RRULE: previewDates', () => {
  it('возвращает N следующих дат для MONTHLY', () => {
    const dtStart = new Date(2026, 0, 25) // 25 января 2026
    const dates = previewDates('FREQ=MONTHLY;BYMONTHDAY=25', dtStart, 5)
    assert.strictEqual(dates.length, 5)
    // Первая дата ~ в январе, вторая ~ в феврале (день 25, но TZ-сдвиг может давать 24/26 в UTC).
    assert.ok(dates[0].getUTCMonth() === 0, `expected Jan, got month ${dates[0].getUTCMonth()}`)
    assert.ok(dates[1].getUTCMonth() === 1, `expected Feb, got month ${dates[1].getUTCMonth()}`)
  })

  it('возвращает пустой массив для невалидного правила', () => {
    const dates = previewDates('garbage', new Date(2026, 0, 1), 5)
    assert.deepStrictEqual(dates, [])
  })

  it('ограничивается count', () => {
    const dates = previewDates('FREQ=DAILY', new Date(2026, 0, 1), 3)
    assert.strictEqual(dates.length, 3)
  })
})

describe('RRULE: occurrencesBetween', () => {
  it('возвращает инстансы в окне', () => {
    const dtStart = new Date(2026, 0, 25) // 25 января
    const from = dtStart
    const to = new Date(2026, 5, 30) // до 30 июня
    const occ = occurrencesBetween('FREQ=MONTHLY;BYMONTHDAY=25', dtStart, from, to)
    // Янв, Фев, Мар, Апр, Май, Июн = 6 инстансов (до 30 июня, exclusive не влияет т.к. 25-е < 30).
    assert.ok(occ.length >= 5 && occ.length <= 6, `expected 5-6, got ${occ.length}`)
  })

  it('возвращает пустой массив для невалидного правила', () => {
    const occ = occurrencesBetween('garbage', new Date(2026, 0, 1), new Date(2026, 0, 1), new Date(2026, 5, 1))
    assert.deepStrictEqual(occ, [])
  })
})
