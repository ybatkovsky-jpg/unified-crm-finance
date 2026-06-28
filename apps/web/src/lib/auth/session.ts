import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { verifySession } from './jwt';
import { SESSION_COOKIE } from './cookies';
import { isRoleCode, type RoleCode } from './roles';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  roleCodes: RoleCode[]; // может быть несколько ролей
  isActive: boolean;
}

/**
 * Текущий пользователь по session-cookie (server-side).
 * Перечитывает роли/статус из БД. Удалённые (deletedAt) и заблокированные — null.
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
      deletedAt: true,
      UserRole: { select: { Role: { select: { code: true } } } },
    },
  });
  if (!user || !user.isActive || user.deletedAt) return null;

  const roleCodes = user.UserRole.map((ur) => ur.Role.code).filter(isRoleCode);
  if (roleCodes.length === 0) return null;

  return { id: user.id, email: user.email, name: user.name, roleCodes, isActive: user.isActive };
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}
