/**
 * Общие форматтеры для отчётных страниц учёта/аналитики.
 * Единый ru-RU/RUB вместо локальных копий в каждой странице.
 */

const currencyFmt = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
})

/** Сумма в рублях без копеек: 1234567 → «1 234 567 ₽». */
export function formatCurrency(amount: number): string {
  return currencyFmt.format(amount)
}

/** Подписанная сумма для доходов/расходов: +1 234 ₽ / −1 234 ₽. */
export function formatSigned(amount: number, positive: boolean): string {
  const sign = positive ? "+" : "−"
  return `${sign}${currencyFmt.format(Math.abs(amount))}`
}

/** Метка месяца "2026-01" → «янв 2026». */
const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]
export function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-")
  const idx = parseInt(m, 10) - 1
  if (idx < 0 || idx > 11) return month
  return `${MONTHS_SHORT[idx]} ${y}`
}
