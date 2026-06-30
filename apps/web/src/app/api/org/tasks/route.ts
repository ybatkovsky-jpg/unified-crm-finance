/**
 * Org Tasks API — PLAT-06. Доска инстансов орг-задач.
 * - GET /api/org/tasks?status=&functionId=&assigneeId=
 *        → список инстансов (type='org') с учётом видимости.
 *
 * При каждом GET лениво материализуются инстансы повторяющихся шаблонов
 * (блокирующе, чтобы новые инстансы попали в ответ), затем — фильтр видимости:
 * директор видит всё; руководитель функции — задачи своих функций; прочие — свои задачи.
 */
import { NextRequest, NextResponse } from 'next/server'
import { tasks } from '@/lib/db/tasks'
import { taskTemplates } from '@/lib/db/task-templates'
import { org } from '@/lib/db/org'
import { getSession } from '@/lib/auth/session'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Ленивая материализация инстансов (повторяющиеся шаблоны, срок которых наступил).
    //    Блокирующе — чтобы созданные инстансы попали в ответ.
    try {
      await taskTemplates.materializeInstances()
    } catch (err) {
      console.error('[org/tasks GET] materialization failed:', err)
    }

    // 2. Фильтры из query.
    const sp = request.nextUrl.searchParams

    // 3. Видимость: head-функции текущего пользователя.
    const isDirector = session.roleCodes.includes('director')
    let headFunctionIds: string[] = []
    if (!isDirector) {
      const userFns = await org.findFunctionsForUser(session.id)
      headFunctionIds = userFns.filter((f) => f.role === 'head').map((f) => f.functionId)
    }

    const data = await tasks.findOrgTasks({
      userId: session.id,
      isDirector,
      headFunctionIds,
      filters: {
        status: sp.get('status') ?? undefined,
        functionId: sp.get('functionId') ?? undefined,
        assigneeId: sp.get('assigneeId') ?? undefined,
      },
    })

    return NextResponse.json({ data, count: data.length })
  } catch (error) {
    console.error('Failed to fetch org tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch org tasks', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
