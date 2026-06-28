import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { verifySession } from './jwt';
import { SESSION_COOKIE } from './cookies';
import { isRoleCode, type RoleCode } from './roles';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  roleCode: RoleCode;
  isActive: boolean;
}

/**
 * Текущий пользователь по session-cookie (server-side).
 * Перечитывает роль из БД (на случай смены роли/блокировки — сессия не переживает).
 */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySession(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      UserRole: { select: { Role: { select: { code: true } } } },
    },
  });
  if (!user || !user.isActive) return null;

  const dbRole = user.UserRole[0]?.Role.code;
  const roleCode = dbRole && isRoleCode(dbRole) ? dbRole : isRoleCode(payload.roleCode) ? payload.roleCode : null;
  if (!roleCode) return null;

  return { id: user.id, email: user.email, name: user.name, roleCode, isActive: user.isActive };
}

/** Требовать аутентифицированного пользователя (для server-components/routes). */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}
