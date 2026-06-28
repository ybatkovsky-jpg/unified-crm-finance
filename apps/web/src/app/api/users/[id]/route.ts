import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { isRoleCode } from '@/lib/auth/roles';

async function requireDirector() {
  const session = await getSession();
  if (!session || session.roleCode !== 'director') return null;
  return session;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireDirector())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({} as Record<string, unknown>));

  // Блокировка/активация
  if (typeof body.isActive === 'boolean') {
    await prisma.user.update({ where: { id }, data: { isActive: body.isActive } });
    return NextResponse.json({ ok: true });
  }

  // Смена роли
  if (typeof body.roleCode === 'string' && isRoleCode(body.roleCode)) {
    const role = await prisma.role.findUnique({ where: { code: body.roleCode } });
    if (!role) return NextResponse.json({ error: 'Роль не найдена' }, { status: 400 });
    await prisma.userRole.deleteMany({ where: { userId: id } });
    await prisma.userRole.create({ data: { userId: id, roleId: role.id } });
    return NextResponse.json({ ok: true });
  }

  // Сброс пароля (админ задаёт новый временный)
  if (typeof body.password === 'string' && body.password.length >= 4) {
    await prisma.user.update({
      where: { id },
      data: { passwordHash: await hashPassword(body.password) },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Нечего обновлять' }, { status: 400 });
}
