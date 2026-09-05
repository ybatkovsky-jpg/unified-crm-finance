/**
 * Projects Collection API Endpoint
 *
 * CRUD API for Project model:
 * - GET: List all projects (excluding soft-deleted) with optional filters
 * - POST: Create a new project
 *
 * GET /api/projects
 * POST /api/projects
 */

import { NextRequest, NextResponse } from 'next/server'
import { projects } from '../../../lib/db/projects'
import { prisma } from '../../../lib/db/prisma'
import { randomUUID } from 'node:crypto'
import { mapErrorToResponse } from '../../../lib/api/error-mapping'
import { getSession } from '../../../lib/auth/session'
import { isAdmin } from '../../../lib/auth/permissions'
import { DEFAULT_PROJECT_STAGES } from '@/lib/db/project-stages'
import { nextProjectNumber } from '@/lib/db/sequence'

/**
 * GET /api/projects
 *
 * Returns all active projects (excludes soft-deleted).
 * Supports optional query parameters for filtering.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const managerId = searchParams.get('managerId')
    const contactId = searchParams.get('contactId')
    const dealId = searchParams.get('dealId')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (managerId) where.managerId = managerId
    if (contactId) where.contactId = contactId
    if (dealId) where.dealId = dealId

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50')))
    const skip = (page - 1) * pageSize
    const whereClause = Object.keys(where).length > 0 ? where : undefined

    const [allProjects, totalCount] = await Promise.all([
      projects.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip,
        include: {
        ProjectStage: {
          orderBy: { order: 'asc' },
          select: { id: true, code: true, name: true, order: true, status: true, startDate: true, endDate: true, completedAt: true },
        },
        ProjectMember: {
          where: { leftAt: null },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        Contact: { select: { id: true, firstName: true, lastName: true, companyName: true, type: true } },
        User: { select: { id: true, name: true, email: true } },
      },
    } as const),
      prisma.project.count({ where: whereClause as any }),
    ])

    return NextResponse.json({
      data: allProjects,
      count: allProjects.length,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    })
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects
 *
 * Creates a new project. Admin-only.
 * Проект создаётся только из сделки: обязательно dealId, связь со сделкой
 * устанавливается атомарно в одной транзакции.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Создание проектов — только администратор.
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Проект создаётся только из сделки
    if (!body.dealId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Проект создаётся только из сделки (укажите dealId)' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'name is required' },
        { status: 400 }
      )
    }

    const newProject = await prisma.$transaction(async (tx) => {
      // Сделка должна существовать и не быть удалённой
      const deal = await tx.deal.findFirst({ where: { id: body.dealId, deletedAt: null } })
      if (!deal) {
        throw new Error(`Deal with id ${body.dealId} not found`)
      }

      // Одна сделка — один проект
      if (deal.projectId) {
        throw new Error(`Project already exists for deal ${body.dealId}`)
      }

      const now = new Date()
      const project = await tx.project.create({
        data: {
          id: randomUUID(),
          name: body.name,
          externalNumber: body.externalNumber ?? await nextProjectNumber(tx, new Date().getFullYear()),
          description: body.description || null,
          status: body.status ?? 'lead',
          managerId: body.managerId || deal.managerId || null,
          contactId: body.contactId || deal.contactId || null,
          dealId: deal.id,
          contractId: body.contractId || null,
          startDate: body.startDate ? new Date(body.startDate) : null,
          endDate: body.endDate ? new Date(body.endDate) : null,
          contractAmount: body.contractAmount || 0,
          currency: body.currency ?? 'RUB',
          marginTarget: body.marginTarget ?? undefined,
          attributes: body.attributes || null,
          createdAt: now,
          updatedAt: now,
        },
      })

      // Атомарно связываем проект со сделкой (обратная связь 1:1)
      await tx.deal.update({
        where: { id: deal.id },
        data: { projectId: project.id },
      })

      // Auto-create default project stages (7 stages per ROADMAP)
      await tx.projectStage.createMany({
        data: DEFAULT_PROJECT_STAGES.map((s) => ({
          id: randomUUID(),
          projectId: project.id,
          code: s.code,
          name: s.name,
          order: s.order,
          status: 'pending',
        })),
      })

      return project
    })

    return NextResponse.json({ data: newProject }, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Сделка не найдена' },
          { status: 404 }
        )
      }
      if (error.message.includes('Project already exists')) {
        return NextResponse.json(
          { error: 'По этой сделке уже существует проект' },
          { status: 409 }
        )
      }
    }
    return mapErrorToResponse(error, 'create project')
  }
}
