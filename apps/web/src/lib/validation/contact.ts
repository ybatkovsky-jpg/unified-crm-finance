/**
 * Валидация полей контакта.
 *
 * Правила:
 *  - Имя/Фамилия/Отчество: буквы (кириллица + латиница), пробелы, дефисы, точки.
 *    Без цифр и спецсимволов.
 *  - Название компании: буквы, цифры, кавычки, пробелы, дефисы, точки, №.
 *  - Должность: буквы, пробелы, дефисы, точки.
 *  - Email: стандартный формат.
 *  - Телефон: 7–15 цифр после очистки (допустимы +, пробелы, дефисы, скобки).
 *  - ИНН: 10 или 12 цифр.
 *  - КПП: 9 цифр.
 *  - ОГРН: 13 цифр.
 */

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

// ── Регулярки ──────────────────────────────────────────────────────

/** Буквы (A-Z, a-z, А-Я, а-я, Ё, ё), пробел, дефис, точка, апостроф */
const NAME_RE = /^[\p{L}\s\-.\u0301']+$/u

/** Буквы, цифры, кавычки, №, пробел, дефис, точка, запятая, слеш, амперсанд */
const COMPANY_RE = /^[\p{L}\d\s\-.,'"«»№&/\\()]+$/u

/** Буквы, пробел, дефис, точка, слеш */
const POSITION_RE = /^[\p{L}\s\-./]+$/u

/** Email */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Только цифры */
const DIGITS_RE = /^\d+$/

// ── Функции ────────────────────────────────────────────────────────

export function validateName(value: string | null | undefined, fieldLabel: string): string | null {
  if (!value?.trim()) return null // пустое ok (если не required — проверяется отдельно)
  if (!NAME_RE.test(value.trim())) {
    return `${fieldLabel} должно содержать только буквы, пробелы и дефисы (без цифр).`
  }
  return null
}

export function validateCompanyName(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  if (!COMPANY_RE.test(value.trim())) {
    return 'Название компании содержит недопустимые символы.'
  }
  return null
}

export function validatePosition(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  if (!POSITION_RE.test(value.trim())) {
    return 'Должность должна содержать только буквы, пробелы и дефисы.'
  }
  return null
}

export function validateEmail(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  if (!EMAIL_RE.test(value.trim())) {
    return 'Неверный формат email.'
  }
  return null
}

export function validatePhone(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const cleaned = value.trim().replace(/[\s\-()]/g, '')
  if (!/^\+?\d{7,15}$/.test(cleaned)) {
    return 'Телефон должен содержать 7–15 цифр (допустимы +, пробелы, дефисы, скобки).'
  }
  return null
}

export function validateInn(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const v = value.trim()
  if (!DIGITS_RE.test(v)) {
    return 'ИНН должен содержать только цифры.'
  }
  if (v.length !== 10 && v.length !== 12) {
    return 'ИНН должен содержать 10 или 12 цифр.'
  }
  return null
}

export function validateKpp(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const v = value.trim()
  if (!DIGITS_RE.test(v)) {
    return 'КПП должен содержать только цифры.'
  }
  if (v.length !== 9) {
    return 'КПП должен содержать 9 цифр.'
  }
  return null
}

export function validateOgrn(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const v = value.trim()
  if (!DIGITS_RE.test(v)) {
    return 'ОГРН должен содержать только цифры.'
  }
  if (v.length !== 13) {
    return 'ОГРН должен содержать 13 цифр.'
  }
  return null
}

/**
 * Полная валидация полей контакта.
 * Возвращает первую ошибку или null.
 */
export function validateContactFields(fields: {
  firstName?: string | null
  lastName?: string | null
  middleName?: string | null
  companyName?: string | null
  position?: string | null
  email?: string | null
  phone?: string | null
  inn?: string | null
  kpp?: string | null
  ogrn?: string | null
}): string | null {
  const checks: [string | null | undefined, (v: string | null | undefined) => string | null][] = [
    [fields.firstName, (v) => validateName(v, 'Имя')],
    [fields.lastName, (v) => validateName(v, 'Фамилия')],
    [fields.middleName, (v) => validateName(v, 'Отчество')],
    [fields.companyName, validateCompanyName],
    [fields.position, validatePosition],
    [fields.email, validateEmail],
    [fields.phone, validatePhone],
    [fields.inn, validateInn],
    [fields.kpp, validateKpp],
    [fields.ogrn, validateOgrn],
  ]

  for (const [value, validator] of checks) {
    if (value != null && value !== '') {
      const error = validator(value)
      if (error) return error
    }
  }

  return null
}
