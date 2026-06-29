/**
 * Tasks API
 *
 * - GET  /api/tasks?projectId=X  → list tasks (optionally filtered by project)
 * - POST /api/tasks               → create a task
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/db/prisma'
import { randomUUID } from 'node:crypto'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId')
    const tasks = await prisma.task.findMany({
      where: projectId ? { projectId, deletedAt: null } : { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { User_Task_assigneeIdToUser: { select: { id: true, name: true, email: true } } },
    })
    return NextResponse.json({ data: tasks, count: tasks.length })
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    if (!body.title) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'title is required' },
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: {
        id: randomUUID(),
        title: body.title,
        description: body.description ?? null,
        type: body.type ?? 'client',
        status: 'todo',
        priority: body.priority ?? 'medium',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        contactId: body.contactId ?? null,
        projectId: body.projectId ?? null,
        dealId: body.dealId ?? null,
        assigneeId: body.assigneeId ?? null,
        createdBy: body.createdBy ?? 'system',
        updatedAt: new Date(),
      },
      include: {
        User_Task_assigneeIdToUser: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json(
      { error: 'Failed to create task', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
