/**
 * Хелперы прав доступа для API-эндпоинтов.
 *
 * Модель: админ — полный доступ ко всему; остальные роли — только свои сущности.
 * Поля владения: Deal.managerId, Contact.ownerId, Task.createdBy/assigneeId,
 * Transaction.createdBy, Interaction.authorId, FileEntity.uploadedBy и т.д.
 * Операционные сущности наследуют владение через projectId → Project.managerId.
 */

import { NextResponse } from 'next/server';
import type { SessionUser } from './session';
import { hasSection, type Section } from './roles';

/** Админ — полный доступ ко всему (CRUD любых сущностей). */
export function isAdmin(session: SessionUser): boolean {
  return session.roleCodes.includes('admin');
}

/** Директор или админ (для разделов, где исторически требовалась роль director). */
export function isAdminOrDirector(session: SessionUser): boolean {
  return isAdmin(session) || session.roleCodes.includes('director');
}

/**
 * Может ли пользователь изменять сущность.
 * Админ — всё; остальные — только если они владелец (isOwner).
 */
export function canModify(session: SessionUser, isOwner: boolean): boolean {
  return isAdmin(session) || isOwner;
}

/**
 * Защита мутирующих API-эндпоинтов: проверка сессии и section-RBAC на запись.
 *
 * Возвращает готовый 401/403 NextResponse, если доступ закрыт, либо `null`,
 * если доступ разрешён — caller должен ранний return при непустом ответе.
 *
 * ВНИМАНИЕ: middleware НЕ применяет section-RBAC к /api/* — для API он проверяет
 * только наличие валидного токена (401), а фильтр разделов (hasSection) выполняется
 * лишь для страниц. Поэтому для мутирующих API-роутов эта функция — ЕДИНСТВЕННАЯ
 * section-проверка, а не дублирующий «второй этаж». Без неё любой авторизованный
 * пользователь с любой ролью может создавать сущности, раздел которых ему недоступен
 * в UI (например, кладовщик — сделки).
 *
 * Поведение для текущих пользователей не меняется: кто видит раздел в UI,
 * тот и пишет (тот же фильтр по hasSection, что и в middleware для страниц).
 *
 * Пример:
 *   const session = await getSession()
 *   const denied = requireSectionWrite(session, 'crm')
 *   if (denied) return denied
 */
export function requireSectionWrite(
  session: SessionUser | null,
  section: Section
): NextResponse | null {
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Админ пишет везде; остальные — только если раздел доступен по любой из ролей.
  if (!isAdmin(session) && !hasSection(session.roleCodes, section)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}
