/**
 * Tasks API Client — PLAT-01.
 *
 * Создание/список задач + перенос/пересоздание/обновление.
 * Используется UI задач (выезды замер/монтаж + общие) и карточкой проекта.
 */
import type { Task } from '@prisma/client'
import { ApiClientError, parseApiError, parseJson } from './shared'

export { ApiClientError } from './shared'

const BASE_URL = '/api'

export interface TaskCreateInput {
  title: string
  description?: string
  type?: string
  priority?: string
  dueDate?: string
  contactId?: string
  projectId?: string
  dealId?: string
  assigneeId?: string
  createdBy?: string
}

export interface TaskUpdateInput {
  title?: string
  description?: string
  type?: string
  priority?: string
  status?: string
  assigneeId?: string
  dueDate?: string | null
}

export interface TaskListParams {
  projectId?: string
  assigneeId?: string
  status?: string
  type?: string
  dueBefore?: string
  overdue?: boolean
}

export type TaskData = Task & {
  User_Task_assigneeIdToUser?: { id: string; name: string | null; email: string } | null
}

export async function createTask(data: TaskCreateInput): Promise<{ data: TaskData }> {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) return parseApiError(response)
  return parseJson(response)
}

export async function getTasks(params: TaskListParams = {}): Promise<{ data: TaskData[]; count: number }> {
  const sp = new URLSearchParams()
  if (params.projectId) sp.set('projectId', params.projectId)
  if (params.assigneeId) sp.set('assigneeId', params.assigneeId)
  if (params.status) sp.set('status', params.status)
  if (params.type) sp.set('type', params.type)
  if (params.dueBefore) sp.set('dueBefore', params.dueBefore)
  if (params.overdue) sp.set('overdue', '1')
  const qs = sp.toString()
  const response = await fetch(`${BASE_URL}/tasks${qs ? `?${qs}` : ''}`)
  if (!response.ok) return parseApiError(response)
  return parseJson(response)
}

export async function updateTask(id: string, data: TaskUpdateInput): Promise<{ data: TaskData }> {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) return parseApiError(response)
  return parseJson(response)
}

export async function rescheduleTask(
  id: string,
  body: { dueDate: string; failedReason?: string; cancel?: boolean; assigneeId?: string }
): Promise<{ data: TaskData }> {
  const response = await fetch(`${BASE_URL}/tasks/${id}/reschedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) return parseApiError(response)
  return parseJson(response)
}

export async function recreateTask(
  id: string,
  body: { dueDate: string; failedReason: string; assigneeId?: string }
): Promise<{ data: TaskData }> {
  const response = await fetch(`${BASE_URL}/tasks/${id}/recreate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) return parseApiError(response)
  return parseJson(response)
}
