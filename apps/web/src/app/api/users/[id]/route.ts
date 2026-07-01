import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { isRoleCode } from '@/lib/auth/roles';
import { isAdminOrDirector } from '@/lib/auth/permissions';

async function requireDirector() {
  const session = await getSession();
  if (!session || !isAdminOrDirector(session)) return null;
  return session;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireDirector();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({} as Record<string, unknown>));

  // Блокировка/активация
  if (typeof body.isActive === 'boolean') {
    await prisma.user.update({ where: { id }, data: { isActive: body.isActive } });
    return NextResponse.json({ ok: true });
  }

  // Смена набора ролей (массив — полный новый набор)
  if (Array.isArray(body.roleCodes)) {
    const roleCodes = body.roleCodes.filter((c: unknown): c is string => typeof c === 'string').filter(isRoleCode);
    if (roleCodes.length === 0) {
      return NextResponse.json({ error: 'Должна быть хотя бы одна роль' }, { status: 400 });
    }
    const roles = await prisma.role.findMany({ where: { code: { in: roleCodes } } });
    if (roles.length !== roleCodes.length) {
      return NextResponse.json({ error: 'Одна из ролей не найдена' }, { status: 400 });
    }
    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: id } }),
      prisma.userRole.createMany({
        data: roles.map((r) => ({ userId: id, roleId: r.id })),
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  // Сброс пароля
  if (typeof body.password === 'string' && body.password.length >= 4) {
    await prisma.user.update({
      where: { id },
      data: { passwordHash: await hashPassword(body.password) },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Нечего обновлять' }, { status: 400 });
}

/** Мягкое удаление (deletedAt) — пользователь остаётся в истории, но исчезает из списка и не может войти. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireDirector();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  if (id === session.id) {
    return NextResponse.json({ error: 'Нельзя удалить самого себя' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, isActive: true, UserRole: { select: { Role: { select: { code: true } } } } },
  });
  if (!target) {
    return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
  }
  // Не дать удалить последнего директора
  const targetIsDirector = target.UserRole.some((ur) => ur.Role.code === 'director');
  if (targetIsDirector) {
    const directorsCount = await prisma.userRole.count({
      where: { Role: { code: 'director' }, User: { deletedAt: null, isActive: true } },
    });
    if (directorsCount <= 1) {
      return NextResponse.json(
        { error: 'Нельзя удалить последнего директора' },
        { status: 400 }
      );
    }
  }

  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
  return NextResponse.json({ ok: true });
}
