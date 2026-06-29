/**
 * Lead Sources API Endpoint
 *
 * Returns the list of active lead sources from the dictionary.
 * Public for authenticated users (used in deal/contact creation forms).
 *
 * GET /api/lead-sources
 */

import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/db/prisma'

export async function GET(): Promise<NextResponse> {
  try {
    const sources = await prisma.leadSource.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
      select: { id: true, code: true, name: true, description: true, isActive: true },
    })

    return NextResponse.json({ data: sources })
  } catch (error) {
    console.error('Failed to fetch lead sources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead sources', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
