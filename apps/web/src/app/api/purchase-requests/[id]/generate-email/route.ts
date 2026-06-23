/**
 * PurchaseRequest Email Generation API (PROC-13)
 *
 * - POST /api/purchase-requests/[id]/generate-email
 *   (Re)builds the request email subject/body from the current supplier/items/project.
 */

import { NextRequest, NextResponse } from 'next/server'
import { purchaseRequests } from '../../../../../lib/db/purchase-requests'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const content = await purchaseRequests.generateEmailContent(id)
    const updated = await purchaseRequests.findById(id)
    return NextResponse.json({ data: updated, email: content })
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (status === 400 || status === 404) {
      return NextResponse.json(
        { error: status === 404 ? 'Not found' : 'Validation failed', message },
        { status }
      )
    }
    console.error('Failed to generate email:', error)
    return NextResponse.json({ error: 'Failed to generate email', message }, { status: 500 })
  }
}
