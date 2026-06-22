/**
 * Single Project API Endpoint
 *
 * CRUD API for a single Project:
 * - GET: Fetch a project by ID
 * - PATCH: Update a project
 * - DELETE: Soft delete a project
 *
 * GET /api/projects/[id]
 * PATCH /api/projects/[id]
 * DELETE /api/projects/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { projects } from '@/lib/db/projects'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/projects/[id]
 *
 * Returns a single project by ID (if not soft-deleted).
 * Includes stages, members, and relations.
 * Also manually fetches Deal and Contract since Prisma schema lacks proper relations.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params

    const project = await projects.findUnique(
      id,
      {
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
      } as const,
    )

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found', message: `Project with id ${id} not found` },
        { status: 404 }
      )
    }

    // Manually fetch Deal if dealId exists (no @relation back to Project in schema)
    let deal = null
    if (project.dealId) {
      deal = await prisma.deal.findUnique({
        where: { id: project.dealId },
        include: {
          Contact: true,
          Pipeline: true,
        },
      })
    }

    // Manually fetch Contract if contractId exists
    // Contract has no projectId field, so we fetch directly by ID
    let contract = null
    if (project.contractId) {
      contract = await prisma.contract.findUnique({
        where: { id: project.contractId },
        include: {
          Contact: true,
          Deal: true,
        },
      })
    }

    return NextResponse.json({
      data: {
        ...project,
        deal,
        contract,
      },
    })
  } catch (error) {
    console.error('Failed to fetch project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/projects/[id]
 *
 * Updates an existing project.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()

    // Verify project exists
    const existing = await projects.findUnique(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found', message: `Project with id ${id} not found` },
        { status: 404 }
      )
    }

    // Prepare update data (only allow specific fields)
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.externalNumber !== undefined) updateData.externalNumber = body.externalNumber
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.managerId !== undefined) updateData.managerId = body.managerId
    if (body.contactId !== undefined) updateData.contactId = body.contactId
    if (body.dealId !== undefined) updateData.dealId = body.dealId
    if (body.startDate !== undefined) updateData.startDate = body.startDate
    if (body.endDate !== undefined) updateData.endDate = body.endDate
    if (body.contractAmount !== undefined) updateData.contractAmount = body.contractAmount
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.marginTarget !== undefined) updateData.marginTarget = body.marginTarget
    if (body.qualityRating !== undefined) updateData.qualityRating = body.qualityRating
    if (body.deadlineStatus !== undefined) updateData.deadlineStatus = body.deadlineStatus
    if (body.completedAt !== undefined) updateData.completedAt = body.completedAt
    if (body.attributes !== undefined) updateData.attributes = body.attributes

    const updatedProject = await projects.update(id, updateData)

    return NextResponse.json({ data: updatedProject })
  } catch (error) {
    console.error('Failed to update project:', error)
    return NextResponse.json(
      { error: 'Failed to update project', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/projects/[id]
 *
 * Soft deletes a project by setting deletedAt timestamp.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params

    const deletedProject = await projects.softDelete(id)

    return NextResponse.json({ data: deletedProject })
  } catch (error) {
    console.error('Failed to delete project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
