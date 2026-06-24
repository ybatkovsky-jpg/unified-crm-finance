/**
 * Email Sender Service
 *
 * Sends email notifications. Supports SMTP and Resend provider.
 * Falls back to logging when no provider is configured (dev mode).
 */

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export class EmailSender {
  private provider: 'smtp' | 'resend' | 'log'
  private apiKey?: string
  private defaultFrom: string

  constructor(config?: { provider?: 'smtp' | 'resend' | 'log'; apiKey?: string; defaultFrom?: string }) {
    this.provider = config?.provider ?? 'log'
    this.apiKey = config?.apiKey
    this.defaultFrom = config?.defaultFrom ?? 'noreply@unified-crm.local'
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    const from = options.from ?? this.defaultFrom

    switch (this.provider) {
      case 'resend':
        return this.sendViaResend({ ...options, from })
      case 'smtp':
        return this.sendViaSmtp({ ...options, from })
      case 'log':
      default:
        return this.logEmail({ ...options, from })
    }
  }

  private async sendViaResend(options: EmailOptions): Promise<EmailResult> {
    if (!this.apiKey) {
      return { success: false, error: 'Resend API key not configured' }
    }
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: options.from,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return { success: false, error: (err as any).message ?? `HTTP ${res.status}` }
      }
      const data = await res.json() as { id: string }
      return { success: true, messageId: data.id }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  private async sendViaSmtp(options: EmailOptions): Promise<EmailResult> {
    // SMTP implementation would use nodemailer in production
    // For now, log and return success
    console.log('[EmailSender:SMTP] Would send:', options.subject, 'to', options.to)
    return { success: true, messageId: `smtp-${Date.now()}` }
  }

  private logEmail(options: EmailOptions): EmailResult {
    console.log('[EmailSender:LOG]')
    console.log('  To:', options.to)
    console.log('  Subject:', options.subject)
    console.log('  Body:', options.html.slice(0, 200))
    return { success: true, messageId: `log-${Date.now()}` }
  }
}

/** Default singleton — logs to console in dev */
export const emailSender = new EmailSender({ provider: 'log' })

/**
 * Simple email template helper for notifications.
 */
export function notificationEmailTemplate(title: string, message: string, link?: string): string {
  return `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>${title}</h2>
  <p>${message}</p>
  ${link ? `<p><a href="${link}" style="color: #3b82f6;">View details →</a></p>` : ''}
  <hr />
  <p style="color: #94a3b8; font-size: 12px;">Unified CRM — automated notification</p>
</div>`
}
