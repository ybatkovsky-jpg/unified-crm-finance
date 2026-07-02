/**
 * DTO для добавления контактов в Сделку.
 *
 * Все поля жёстко типизированы по схеме Prisma:
 * - Contact: type, firstName..passportSeries.., companyId
 * - DealContact: role
 *
 * НЕТ миграции — все поля уже существуют.
 */

// ── Роли DealContact (из schema.prisma: customer | designer | installer | other) ──

export type DealContactRole = 'customer' | 'designer' | 'installer' | 'other';

export const DEAL_CONTACT_ROLES: readonly DealContactRole[] = [
  'customer',
  'designer',
  'installer',
  'other',
] as const;

export function isDealContactRole(v: unknown): v is DealContactRole {
  return typeof v === 'string' && (DEAL_CONTACT_ROLES as readonly string[]).includes(v);
}

export const ROLE_LABELS: Record<DealContactRole, string> = {
  customer: 'Заказчик',
  designer: 'Дизайнер',
  installer: 'Монтажник',
  other: 'Другое',
};

// ── Паспортные данные (Contact: passport* полей) ──

export interface PassportData {
  passportSeries: string | null;
  passportNumber: string | null;
  passportIssuedBy: string | null;
  passportIssuedAt: string | null; // ISO date string (YYYY-MM-DD) или null
  passportCode: string | null;
  registrationAddress: string | null;
}

export const EMPTY_PASSPORT: PassportData = {
  passportSeries: null,
  passportNumber: null,
  passportIssuedBy: null,
  passportIssuedAt: null,
  passportCode: null,
  registrationAddress: null,
};

// ── Базовые контактные данные для физлица ──

export interface PersonContactFields {
  firstName: string;
  lastName: string;
  middleName: string;
  phone: string;
  email: string;
  position: string;
  passport: PassportData;
}

export const EMPTY_PERSON: PersonContactFields = {
  firstName: '',
  lastName: '',
  middleName: '',
  phone: '',
  email: '',
  position: '',
  passport: { ...EMPTY_PASSPORT },
};

// ── Сценарий 1: Добавление физлица ──

export interface AddIndividualDto {
  mode: 'individual';
  person: PersonContactFields;
  /** Роль этого человека в сделке (свободный текст). */
  role: string;
  /** ID существующего контакта, если выбран из списка (тогда person не создаётся). */
  existingContactId?: string;
}

// ── Сценарий 2: Добавление организации + сотрудники ──

export interface CompanyFields {
  companyName: string;
  inn: string;
  kpp: string;
  ogrn: string;
  phone: string;
  email: string;
  address: string;
  /** ID существующей компании, если выбрана из списка. */
  existingCompanyId?: string;
}

export const EMPTY_COMPANY: CompanyFields = {
  companyName: '',
  inn: '',
  kpp: '',
  ogrn: '',
  phone: '',
  email: '',
  address: '',
};

/** Один сотрудник в форме организации. */
export interface EmployeeRow {
  /** Временный UI-ключ (не ID в БД). */
  tempId: string;
  person: PersonContactFields;
  role: string;
  /** ID существующего сотрудника, если выбран из списка. */
  existingContactId?: string;
}

export interface AddCompanyWithEmployeesDto {
  mode: 'company';
  company: CompanyFields;
  /** Роль организации в сделке (обычно customer). */
  companyRole: string;
  employees: EmployeeRow[];
}

// ── Объединённый тип для формы ──

export type AddContactDto = AddIndividualDto | AddCompanyWithEmployeesDto;

// ── Результат операции (ответ API) ──

export interface DealContactResult {
  id: string;
  dealId: string;
  contactId: string;
  role: string;
  contact: {
    id: string;
    type: 'person' | 'company';
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    inn: string | null;
    phone: string | null;
    email: string | null;
    companyId: string | null;
  };
}

// ── Type Guards ──

export function isIndividualDto(dto: AddContactDto): dto is AddIndividualDto {
  return dto.mode === 'individual';
}

export function isCompanyDto(dto: AddContactDto): dto is AddCompanyWithEmployeesDto {
  return dto.mode === 'company';
}
