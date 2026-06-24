/**
 * Single Webhook Subscription API
 *
 * PATCH /api/webhooks/[id] — toggle active state
 * DELETE /api/webhooks/[id] — remove subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { webhookDispatcher } from '../../../../lib/webhooks/dispatch'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()

    const sub = webhookDispatcher.toggleSubscription(id, body.isActive ?? true)
    if (!sub) {
      return NextResponse.json({ error: 'Not found', message: 'Subscription not found' }, { status: 404 })
    }
    return NextResponse.json({ data: sub })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update webhook', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const deleted = webhookDispatcher.removeSubscription(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Not found', message: 'Subscription not found' }, { status: 404 })
    }
    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete webhook', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
