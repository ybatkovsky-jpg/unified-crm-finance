/**
 * Tasks API Client
 *
 * Minimal client for task creation and listing.
 * Used primarily for measurement tasks (Замер #1 / #2).
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

export async function getTasks(projectId?: string): Promise<{ data: TaskData[]; count: number }> {
  const params = projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''
  const response = await fetch(`${BASE_URL}/tasks${params}`)
  if (!response.ok) return parseApiError(response)
  return parseJson(response)
}
