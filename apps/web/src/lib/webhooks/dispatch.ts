/**
 * Webhook Dispatch Service
 *
 * In-memory webhook subscription management + event dispatch.
 * Supports retry with exponential backoff.
 */

export interface WebhookPayload {
  event: string
  timestamp: string
  data: Record<string, unknown>
}

export interface WebhookSubscription {
  id: string
  url: string
  events: string[]
  secret?: string
  isActive: boolean
  createdAt: string
}

export interface WebhookDeliveryLog {
  id: string
  subscriptionId: string
  eventType: string
  payload: string
  responseStatus: number
  responseBody: string
  success: boolean
  timestamp: string
}

// In-memory store (survives hot-reload but resets on restart)
const subscriptions: Map<string, WebhookSubscription> = new Map()
const deliveryLogs: WebhookDeliveryLog[] = []

export class WebhookDispatcher {
  /** Register a new subscription */
  addSubscription(sub: Omit<WebhookSubscription, 'id' | 'createdAt'>): WebhookSubscription {
    const id = `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const subscription: WebhookSubscription = { ...sub, id, createdAt: new Date().toISOString() }
    subscriptions.set(id, subscription)
    return subscription
  }

  /** Get all subscriptions */
  getSubscriptions(): WebhookSubscription[] {
    return Array.from(subscriptions.values())
  }

  /** Remove a subscription */
  removeSubscription(id: string): boolean {
    return subscriptions.delete(id)
  }

  /** Toggle subscription active state */
  toggleSubscription(id: string, isActive: boolean): WebhookSubscription | undefined {
    const sub = subscriptions.get(id)
    if (sub) {
      sub.isActive = isActive
      subscriptions.set(id, sub)
    }
    return sub
  }

  /** Get delivery logs */
  getDeliveryLogs(limit = 50): WebhookDeliveryLog[] {
    return deliveryLogs.slice(-limit).reverse()
  }

  /**
   * Dispatch an event to all matching active subscriptions.
   */
  async dispatch(event: string, data: Record<string, unknown>): Promise<void> {
    const matching = Array.from(subscriptions.values()).filter(
      (s) => s.isActive && s.events.includes(event)
    )

    if (matching.length === 0) return

    const payload: WebhookPayload = { event, timestamp: new Date().toISOString(), data }
    const payloadStr = JSON.stringify(payload)

    await Promise.allSettled(
      matching.map((sub) => this.sendToSubscriber(sub, payloadStr))
    )
  }

  private async sendToSubscriber(
    sub: WebhookSubscription,
    payload: string,
    retryCount = 0
  ): Promise<void> {
    const logId = `wlog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': 'unified-crm',
      }
      if (sub.secret) headers['X-Webhook-Signature'] = sub.secret

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(sub.url, {
        method: 'POST', headers, body: payload, signal: controller.signal,
      })
      clearTimeout(timeout)

      const responseBody = await response.text().catch(() => '').then(t => t.slice(0, 500))

      deliveryLogs.push({
        id: logId, subscriptionId: sub.id, eventType: 'event', payload,
        responseStatus: response.status, responseBody, success: response.ok,
        timestamp: new Date().toISOString(),
      })

      if (!response.ok && response.status >= 500 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.sendToSubscriber(sub, payload, retryCount + 1)
      }
    } catch (error) {
      deliveryLogs.push({
        id: logId, subscriptionId: sub.id, eventType: 'event', payload,
        responseStatus: 0,
        responseBody: error instanceof Error ? error.message : 'Network error',
        success: false, timestamp: new Date().toISOString(),
      })
    }
  }
}

export const webhookDispatcher = new WebhookDispatcher()
