/**
 * Org Task Templates API — PLAT-06.
 * - GET  /api/org/templates → список шаблонов
 * - POST /api/org/templates → создать шаблон (director only).
 *        Для разового шаблона (rrule=null) сразу создаёт инстанс Task.
 */
import { NextRequest, NextResponse } from 'next/server'
import { taskTemplates } from '@/lib/db/task-templates'
import { getSession } from '@/lib/auth/session'

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await taskTemplates.findAll()
    return NextResponse.json({ data, count: data.length })
  } catch (error) {
    console.error('Failed to fetch templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.roleCodes.includes('director')) {
      return NextResponse.json({ error: 'Forbidden', message: 'Только директор создаёт шаблоны задач' }, { status: 403 })
    }

    const body = await request.json()
    const template = await taskTemplates.create({
      functionId: body.functionId ?? null,
      title: body.title,
      description: body.description ?? null,
      priority: body.priority ?? 'medium',
      rrule: body.rrule ?? null,
      dtStart: new Date(body.dtStart),
      dtEnd: body.dtEnd ? new Date(body.dtEnd) : null,
      assigneeStrategy: body.assigneeStrategy ?? 'function_responsible',
      fixedAssigneeId: body.fixedAssigneeId ?? null,
      createdBy: session.id,
    })

    // Разовый шаблон → сразу создаёт инстанс.
    if (!body.rrule) {
      await taskTemplates.createOneTimeInstance(template.id)
    }

    return NextResponse.json({ data: template }, { status: 201 })
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json({ error: 'Validation failed', message: error.message }, { status: error.statusCode })
    }
    console.error('Failed to create template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
