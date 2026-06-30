/**
 * Доменные события уведомлений (in-app). PLAT-02.
 *
 * Единая точка создания уведомлений по ключевым событиям бизнес-процесса.
 * Каждая функция — семантическое событие (смена стадии, оплата, просрочка ...),
 * которое создаёт запись Notification для нужного пользователя.
 *
 * Idempotency: события, которые могут срабатывать многократно (ленивая просрочка),
 * принимают optional dedupeKey — уведомление создаётся только если нет непрочитанного
 * с таким же key в metadata. Event-функции не бросают — ошибки логируются, но не
 * ломают бизнес-операцию (уведомление — побочный эффект).
 */

import { prisma } from '@/lib/db/prisma'
import { notifications } from '@/lib/db/notifications'

export type NotificationLevel = 'info' | 'success' | 'warning' | 'error'

export interface NotifyInput {
  userId: string
  type: string
  title: string
  message: string
  level?: NotificationLevel
  link?: string | null
  /** Ключ идемпотентности (для ленивых событий: не дублировать непрочитанное с тем же key). */
  dedupeKey?: string
}

/**
 * Базовая отправка. При dedupeKey проверяет, нет ли уже непрочитанного уведомления
 * с этим key в metadata — если есть, пропускает (идемпотентность для ленивых триггеров).
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    if (input.dedupeKey) {
      // Идемпотентность: если есть непрочитанное с тем же dedupeKey — не дублируем.
      // Фильтр по колонке dedupeKey (PLAT-02 dedupe fix; ранее фильтр по metadata не работал).
      const existing = await prisma.notification.findFirst({
        where: {
          userId: input.userId,
          isRead: false,
          dedupeKey: input.dedupeKey,
        },
      })
      if (existing) return // уже есть непрочитанное с этим ключом
    }

    await notifications.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      level: input.level ?? 'info',
      link: input.link ?? null,
      dedupeKey: input.dedupeKey ?? null,
      metadata: input.dedupeKey ? { dedupeKey: input.dedupeKey } : undefined,
    })
  } catch (err) {
    // Уведомление — побочный эффект: логируем, но не ломаем бизнес-операцию.
    console.error('[notify] failed to create notification:', err)
  }
}

// ── Конкретные события ──────────────────────────────────────────────

/** Новый лид создан → уведомить ответственному менеджеру. */
export function notifyNewLead(assigneeId: string, leadName: string, leadId: string): Promise<void> {
  return notify({
    userId: assigneeId,
    type: 'lead',
    title: 'Новый лид',
    message: `Поступил новый лид: ${leadName}`,
    level: 'info',
    link: `/crm/contacts`,
  })
}

/** Смена стадии сделки → уведомить менеджеру сделки. */
export function notifyDealStageChange(
  managerId: string,
  dealTitle: string,
  fromStage: string,
  toStage: string,
  dealId: string
): Promise<void> {
  return notify({
    userId: managerId,
    type: 'deal_stage',
    title: 'Сделка перешла на новую стадию',
    message: `«${dealTitle}»: ${fromStage} → ${toStage}`,
    level: 'info',
    link: `/deals/${dealId}`,
  })
}

/** Сделка закрыта отказом → уведомить директору с причиной. */
export function notifyDealLost(
  directorId: string,
  dealTitle: string,
  reason: string,
  dealId: string
): Promise<void> {
  return notify({
    userId: directorId,
    type: 'deal_lost',
    title: 'Сделка закрыта отказом',
    message: `«${dealTitle}» — причина: ${reason}`,
    level: 'warning',
    link: `/deals/${dealId}`,
  })
}

/** Поступила оплата по проекту → уведомить директору и менеджеру. */
export function notifyPaymentReceived(
  userIds: string[],
  projectName: string,
  amount: number,
  projectId: string
): Promise<void> {
  const amountFmt = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount)
  return Promise.all(
    userIds.map((uid) =>
      notify({
        userId: uid,
        type: 'payment',
        title: 'Поступила оплата',
        message: `${amountFmt} по проекту «${projectName}»`,
        level: 'success',
        link: `/projects/${projectId}`,
      })
    )
  ).then(() => undefined)
}

/** Расхождение при сверке ответа поставщика → уведомить снабженцу. */
export function notifySupplierMismatch(
  supplyUserId: string,
  supplierName: string,
  requestId: string
): Promise<void> {
  return notify({
    userId: supplyUserId,
    type: 'supplier_mismatch',
    title: 'Расхождение в ответе поставщика',
    message: `Поставщик «${supplierName}» прислал позиции с расхождениями — требуется сверка`,
    level: 'warning',
    link: `/procurement/purchase-requests/${requestId}`,
  })
}

/**
 * Задача просрочена (ленивый триггер) → уведомить исполнителю.
 * dedupeKey = `task_overdue:${taskId}` — не дублировать, пока непрочитанное существует.
 */
export function notifyTaskOverdue(
  assigneeId: string,
  taskTitle: string,
  taskId: string,
  dueDate: Date
): Promise<void> {
  return notify({
    userId: assigneeId,
    type: 'task_overdue',
    title: 'Задача просрочена',
    message: `«${taskTitle}» — срок ${dueDate.toLocaleDateString('ru-RU')} истёк`,
    level: 'error',
    link: `/tasks`,
    dedupeKey: `task_overdue:${taskId}`,
  })
}

/**
 * Приближение дедлайна проекта (60 дней, ленивый триггер).
 * dedupeKey = `project_deadline_60d:${projectId}`.
 */
export function notifyProjectDeadline(
  managerId: string,
  projectName: string,
  projectId: string,
  daysLeft: number
): Promise<void> {
  return notify({
    userId: managerId,
    type: 'project_deadline',
    title: 'Приближается дедлайн проекта',
    message: `«${projectName}» — осталось ${daysLeft} дн. до срока`,
    level: 'warning',
    link: `/projects/${projectId}`,
    dedupeKey: `project_deadline_${daysLeft}d:${projectId}`,
  })
}
