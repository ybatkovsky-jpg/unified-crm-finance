import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Deadline urgency level, used to colour-code date badges.
 *  - `overdue`:  date is in the past
 *  - `soon`:     3 days or fewer remaining
 *  - `upcoming`: more than 3 days remaining
 */
export type DeadlineLevel = "overdue" | "soon" | "upcoming"

export interface DeadlineInfo {
  /** Whole days remaining until the deadline (negative if overdue). */
  days: number
  level: DeadlineLevel
}

/**
 * Compute the days remaining until `date` and an urgency level for styling.
 * Returns `null` if `date` is null/undefined/invalid.
 */
export function getDeadlineInfo(date: string | Date | null | undefined): DeadlineInfo | null {
  if (!date) return null
  const target = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(target.getTime())) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const normalizedTarget = new Date(target)
  normalizedTarget.setHours(0, 0, 0, 0)

  const days = Math.round(
    (normalizedTarget.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  let level: DeadlineLevel
  if (days < 0) level = "overdue"
  else if (days <= 3) level = "soon"
  else level = "upcoming"

  return { days, level }
}

/**
 * Human-readable label for a deadline, e.g. «3 дн.», «просрочено на 2 дн.».
 */
export function formatDeadlineLabel(info: DeadlineInfo): string {
  const { days } = info
  if (days === 0) return "сегодня"
  if (days < 0) {
    const abs = Math.abs(days)
    return `просрочено на ${abs} ${pluralDays(abs)}`
  }
  return `${days} ${pluralDays(days)}`
}

function pluralDays(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return "день"
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "дня"
  return "дней"
}

