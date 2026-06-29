/**
 * Lightweight user list for dropdowns/selects.
 *
 * Available to any authenticated user (no director-only restriction), since
 * assignee/manager selection is needed by managers and other roles when
 * creating deals, projects, tasks, etc.
 *
 * Returns only { id, name, email } — no roles, status, or last-login, so it is
 * safe to expose beyond directors.
 *
 * GET /api/users/list
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { deletedAt: null, isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ data: users });
}
