import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { isRoleCode } from '@/lib/auth/roles';

/** Только директор управляет пользователями. */
async function requireDirector() {
  const session = await getSession();
  if (!session || session.roleCode !== 'director') return null;
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
    roleCode: u.UserRole[0]?.Role.code ?? null,
    roleName: u.UserRole[0]?.Role.name ?? null,
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
  const roleCode = typeof body.roleCode === 'string' ? body.roleCode : '';

  if (!email || !name || password.length < 4 || !isRoleCode(roleCode)) {
    return NextResponse.json(
      { error: 'Укажите email, ФИО, пароль (≥4 симв.) и роль' },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Пользователь с таким email уже есть' }, { status: 400 });
  }
  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (!role) {
    return NextResponse.json({ error: 'Роль не найдена' }, { status: 400 });
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
      UserRole: { create: { roleId: role.id } },
    },
  });

  return NextResponse.json({ user: { id: userId, email, name, roleCode } }, { status: 201 });
}
