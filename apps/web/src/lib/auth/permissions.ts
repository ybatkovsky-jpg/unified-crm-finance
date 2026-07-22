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
 * Защита мутирующих эндпоинтов на уровне роута (второй этаж после middleware).
 *
 * Возвращает готовый 401/403 NextResponse, если доступ закрыт, либо `null`,
 * если доступ разрешён — caller должен ранний return при непустом ответе.
 *
 * Дублирует section-RBAC из middleware (defense in depth): если middleware
 * когда-либо изменят или секцию случайно откроют лишней роли, эта проверка
 * всё равно потребует валидную сессию с доступом к разделу. Поведение для
 * текущих пользователей не меняется — кто видел раздел в UI, тот и пишет.
 *
 * Пример:
 *   const denied = requireSectionWrite(session, 'crm');
 *   if (denied) return denied;
 */
export function requireSectionWrite(
  session: SessionUser | null,
  section: Section
): NextResponse | null {
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Требуется авторизация' },
      { status: 401 }
    );
  }
  // Админ пишeт везде; остальные — только если раздел доступен по любой из ролей.
  if (!isAdmin(session) && !hasSection(session.roleCodes, section)) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Нет прав на действие в этом разделе' },
      { status: 403 }
    );
  }
  return null;
}
