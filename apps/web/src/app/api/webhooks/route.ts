/**
 * Webhook Subscriptions API
 *
 * GET /api/webhooks — list subscriptions
 * POST /api/webhooks — create subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { webhookDispatcher } from '../../../lib/webhooks/dispatch'

export async function GET(): Promise<NextResponse> {
  try {
    const subs = webhookDispatcher.getSubscriptions()
    const logs = webhookDispatcher.getDeliveryLogs(20)
    return NextResponse.json({ data: { subscriptions: subs, recentLogs: logs } })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch webhooks', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    if (!body.url || !body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'url and events[] are required' },
        { status: 400 }
      )
    }

    const sub = webhookDispatcher.addSubscription({
      url: body.url,
      events: body.events,
      secret: body.secret ?? undefined,
      isActive: true,
    })

    return NextResponse.json({ data: sub }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create webhook', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
