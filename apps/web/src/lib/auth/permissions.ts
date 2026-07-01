/**
 * Хелперы прав доступа для API-эндпоинтов.
 *
 * Модель: админ — полный доступ ко всему; остальные роли — только свои сущности.
 * Поля владения: Deal.managerId, Contact.ownerId, Task.createdBy/assigneeId,
 * Transaction.createdBy, Interaction.authorId, FileEntity.uploadedBy и т.д.
 * Операционные сущности наследуют владение через projectId → Project.managerId.
 */

import type { SessionUser } from './session';

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
