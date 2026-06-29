/**
 * Loss Reason Dictionary
 *
 * Справочник причин отказа сделки.
 * Соответствует ТЗ: дорого / выбрал конкурента / передумал / пропал / иное.
 * Статичен — не требует ORM-модели (больше гибкости, проще поддержка).
 */

export interface LossReason {
  code: string
  label: string
}

export const LOSS_REASONS: LossReason[] = [
  { code: 'too_expensive', label: 'Дорого' },
  { code: 'competitor', label: 'Выбрал конкурента' },
  { code: 'changed_mind', label: 'Передумал' },
  { code: 'lost_contact', label: 'Пропал' },
  { code: 'other', label: 'Иное' },
]

/**
 * Check whether a given code is a valid loss reason.
 */
export function isValidLossReason(code: string): boolean {
  return LOSS_REASONS.some((r) => r.code === code)
}

/**
 * Get the label for a loss reason code. Returns code if not found.
 */
export function getLossReasonLabel(code: string): string {
  return LOSS_REASONS.find((r) => r.code === code)?.label ?? code
}
