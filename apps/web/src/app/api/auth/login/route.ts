import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { signSession } from '@/lib/auth/jwt';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth/cookies';
import { isRoleCode } from '@/lib/auth/roles';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    return NextResponse.json({ error: 'Введите email и пароль' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      isActive: true,
      deletedAt: true,
      UserRole: { select: { Role: { select: { code: true } } } },
    },
  });
  if (!user || !user.isActive || user.deletedAt) {
    return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
  }

  const roleCodes = user.UserRole.map((ur) => ur.Role.code).filter(isRoleCode);
  if (roleCodes.length === 0) {
    return NextResponse.json({ error: 'У пользователя не назначена роль' }, { status: 403 });
  }

  const token = await signSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    roleCodes,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, roleCodes },
  });
}
