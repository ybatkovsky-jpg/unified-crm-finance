import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { isRoleCode } from '@/lib/auth/roles';

/** Управление пользователями — только директор. */
async function requireDirector() {
  const session = await getSession();
  if (!session || !session.roleCodes.includes('director')) return null;
  return session;
}

export async function GET() {
  if (!(await requireDirector())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      lastLoginAt: true,
      UserRole: { select: { Role: { select: { code: true, name: true } } } },
    },
    orderBy: { email: 'asc' },
  });
  const data = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt,
    roleCodes: u.UserRole.map((ur) => ur.Role.code).filter(isRoleCode),
    roleNames: u.UserRole.map((ur) => ur.Role.name),
  }));
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  if (!(await requireDirector())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const rawRoles = Array.isArray(body.roleCodes)
    ? body.roleCodes
    : typeof body.roleCode === 'string'
      ? [body.roleCode]
      : [];
  const roleCodes = rawRoles.filter((c: unknown): c is string => typeof c === 'string').filter(isRoleCode);

  if (!email || !name || password.length < 4 || roleCodes.length === 0) {
    return NextResponse.json(
      { error: 'Укажите email, ФИО, пароль (≥4 симв.) и хотя бы одну роль' },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Пользователь с таким email уже есть' }, { status: 400 });
  }
  const roles = await prisma.role.findMany({ where: { code: { in: roleCodes } } });
  if (roles.length !== roleCodes.length) {
    return NextResponse.json({ error: 'Одна из ролей не найдена' }, { status: 400 });
  }

  const userId = randomUUID();
  await prisma.user.create({
    data: {
      id: userId,
      email,
      name,
      passwordHash: await hashPassword(password),
      isActive: true,
      updatedAt: new Date(),
      UserRole: { create: roles.map((r) => ({ roleId: r.id })) },
    },
  });

  return NextResponse.json({ user: { id: userId, email, name, roleCodes } }, { status: 201 });
}
