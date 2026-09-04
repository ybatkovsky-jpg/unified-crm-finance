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

  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      isActive: true,
      UserRole: { select: { Role: { select: { code: true } } } },
    },
  });
  if (!target) {
    return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
  }

  const data: {
    email?: string;
    name?: string;
    isActive?: boolean;
    passwordHash?: string;
  } = {};

  // Email
  if (typeof body.email === 'string') {
    const email = body.email.trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Укажите email' }, { status: 400 });
    }
    if (email !== target.email) {
      const dup = await prisma.user.findUnique({ where: { email } });
      if (dup) {
        return NextResponse.json({ error: 'Пользователь с таким email уже есть' }, { status: 400 });
      }
    }
    data.email = email;
  }

  // ФИО
  if (typeof body.name === 'string') {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: 'Укажите ФИО' }, { status: 400 });
    }
    data.name = name;
  }

  // Статус
  if (typeof body.isActive === 'boolean') {
    data.isActive = body.isActive;
  }

  // Новый пароль (пустая строка = не менять)
  if (typeof body.password === 'string' && body.password !== '') {
    if (body.password.length < 4) {
      return NextResponse.json({ error: 'Пароль должен быть не короче 4 символов' }, { status: 400 });
    }
    data.passwordHash = await hashPassword(body.password);
  }

  // Роли (массив — полный новый набор)
  let replaceRoles: { userId: string; roleId: string }[] | null = null;
  if (body.roleCodes !== undefined) {
    if (!Array.isArray(body.roleCodes)) {
      return NextResponse.json({ error: 'roleCodes должен быть массивом' }, { status: 400 });
    }
    const roleCodes = body.roleCodes.filter((c: unknown): c is string => typeof c === 'string').filter(isRoleCode);
    if (roleCodes.length === 0) {
      return NextResponse.json({ error: 'Должна быть хотя бы одна роль' }, { status: 400 });
    }
    const roles = await prisma.role.findMany({ where: { code: { in: roleCodes } } });
    if (roles.length !== roleCodes.length) {
      return NextResponse.json({ error: 'Одна из ролей не найдена' }, { status: 400 });
    }
    // Не позволить снять роль директора у последнего активного директора
    const targetIsDirector = target.UserRole.some((ur) => ur.Role.code === 'director');
    const keepsDirector = roleCodes.includes('director');
    if (targetIsDirector && !keepsDirector) {
      const directorsCount = await prisma.userRole.count({
        where: { Role: { code: 'director' }, User: { deletedAt: null, isActive: true } },
      });
      if (directorsCount <= 1) {
        return NextResponse.json(
          { error: 'Нельзя снять роль директора у последнего директора' },
          { status: 400 }
        );
      }
    }
    replaceRoles = roles.map((r) => ({ userId: id, roleId: r.id }));
  }

  if (Object.keys(data).length === 0 && !replaceRoles) {
    return NextResponse.json({ error: 'Нечего обновлять' }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data });
    if (replaceRoles) {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userRole.createMany({ data: replaceRoles });
    }
  });
  return NextResponse.json({ ok: true });
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
