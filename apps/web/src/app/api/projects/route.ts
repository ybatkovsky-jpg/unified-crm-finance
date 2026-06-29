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

/** Default project stages per ROADMAP Phase 5 */
const DEFAULT_PROJECT_STAGES = [
  { code: 'measurement_2', name: 'Замер #2', order: 1 },
  { code: 'specification', name: 'ТЗ / Спецификация', order: 2 },
  { code: 'procurement', name: 'Закупки', order: 3 },
  { code: 'production', name: 'Производство', order: 4 },
  { code: 'installation', name: 'Монтаж', order: 5 },
  { code: 'acceptance', name: 'Акт', order: 6 },
  { code: 'closure', name: 'Закрытие', order: 7 },
]

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

    const allProjects = await projects.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        ProjectStage: {
          orderBy: { order: 'asc' },
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
        Contact: true,
        User: true,
      },
    } as const)

    return NextResponse.json({ data: allProjects, count: allProjects.length })
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
 * Creates a new project.
 * Validates required fields.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'name is required' },
        { status: 400 }
      )
    }

    if (!body.externalNumber) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'externalNumber is required' },
        { status: 400 }
      )
    }

    // Prepare creation data (fields aligned with ProjectCreateInput api type)
    const createData = {
      name: body.name,
      externalNumber: body.externalNumber,
      description: body.description || null,
      status: body.status ?? 'lead',
      managerId: body.managerId || null,
      contactId: body.contactId || null,
      dealId: body.dealId || null,
      contractId: body.contractId || null,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      contractAmount: body.contractAmount || 0,
      currency: body.currency ?? 'RUB',
      marginTarget: body.marginTarget ?? undefined,
      attributes: body.attributes || null,
    }

    const newProject = await projects.create(createData)

    // Auto-create default project stages (7 stages per ROADMAP)
    const now = new Date()
    await prisma.projectStage.createMany({
      data: DEFAULT_PROJECT_STAGES.map((s) => ({
        id: randomUUID(),
        projectId: newProject.id,
        code: s.code,
        name: s.name,
        order: s.order,
        status: 'pending',
      })),
    })

    return NextResponse.json({ data: newProject }, { status: 201 })
  } catch (error) {
    return mapErrorToResponse(error, 'create project')
  }
}
