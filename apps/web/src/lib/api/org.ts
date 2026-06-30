/**
 * Org API Client — PLAT-06. Орг-платформа задач.
 *
 * Клиент для /api/org/*: структура (отделы/функции/назначения), шаблоны задач,
 * доска инстансов, предпросмотр RRULE. Используется UI /org/*.
 */
import { ApiClientError, parseApiError, parseJson } from './shared'

export { ApiClientError } from './shared'

const BASE_URL = '/api/org'

// ── Типы ──────────────────────────────────────────────────────────────

export interface DepartmentData {
  id: string
  name: string
  description: string | null
  OrgFunction?: FunctionData[]
}

export interface FunctionData {
  id: string
  departmentId: string
  name: string
  description: string | null
  Department?: { id: string; name: string }
  FunctionAssignment?: AssignmentData[]
}

export interface AssignmentData {
  id: string
  functionId: string
  userId: string
  role: 'head' | 'responsible'
  User: { id: string; name: string | null; email: string }
}

export interface TemplateData {
  id: string
  functionId: string | null
  title: string
  description: string | null
  priority: string
  rrule: string | null
  dtStart: string
  dtEnd: string | null
  isActive: boolean
  assigneeStrategy: string
  fixedAssigneeId: string | null
  OrgFunction?: { id: string; name: string; Department?: { id: string; name: string } } | null
  User_TaskTemplate_fixedAssigneeToUser?: { id: string; name: string | null } | null
}

export interface OrgTaskData {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  priority: string
  dueDate: string | null
  assigneeId: string | null
  templateId: string | null
  orgFunctionId: string | null
  plannedDate: string | null
  User_Task_assigneeIdToUser?: { id: string; name: string | null; email: string } | null
  OrgFunction?: { id: string; name: string; Department?: { id: string; name: string } } | null
}

// ── Отделы ────────────────────────────────────────────────────────────

export async function getDepartments(): Promise<{ data: DepartmentData[]; count: number }> {
  const response = await fetch(`${BASE_URL}/departments`)
  if (!response.ok) return parseApiError(response)
  return parseJson(response)
}

export async function createDepartment(body: { name: string; description?: string }): Promise<{ data: DepartmentData }> {
  const response = await fetch(`${BASE_URL}/departments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) return parseApiError(response)
  return parseJson(response)
}

export async function updateDepartment(id: string, body: { name?: string; description?: string }): Promise<{ data: DepartmentData }> {
  const response = await fetch(`${BASE_URL}/departments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) return parseApiError(response)
  return parseJson(response)
}

export async function deleteDepartment(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/departments/${id}`, { method: 'DELETE' })
  if (!response.ok) return parseApiError(response)
}

// ── Функции ───────────────────────────────────────────────────────────

export async function getFunctions(): Promise<{ data: FunctionData[]; count: number }> {
  const response = await fetch(`${BASE_URL}/functions`)
  if (!response.ok) return parseApiError(response)
  return parseJson(response)
}

export async function createFunction(body: { departmentId: string; name: string; description?: string }): Promise<{ data: FunctionData }> {
  const response = await fetch(`${BASE_URL}/functions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) return parseApiError(response)
  return parseJson(response)
}

export async function updateFunction(id: string, body: { name?: string; description?: string }): Promise<{ data: FunctionData }> {
  const response = await fetch(`${BASE_URL}/functions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) return parseApiError(response)
  return parseJson(response)
}

export async function deleteFunction(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/functions/${id}`, { method: 'DELETE' })
  if (!response.ok) return parseApiError(response)
}

// ── Назначения ────────────────────────────────────────────────────────

export async function assignUser(body: { functionId: string; userId: string; role: 'head' | 'responsible' }): Promise<{ data: AssignmentData }> {
  const response = await fetch(`${BASE_URL}/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) return parseApiError(response)
  return parseJson(response)
}

export async function unassignUser(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/assignments/${id}`, { method: 'DELETE' })
  if (!response.ok) return parseApiError(response)
}

// ── Шаблоны ───────────────────────────────────────────────────────────

export async function getTemplates(): Promise<{ data: TemplateData[]; count: number }> {
  const response = await fetch(`${BASE_URL}/templates`)
  if (!response.ok) return parseApiError(response)
  return parseJson(response)
}

export interface TemplateCreateInput {
  functionId?: string | null
  title: string
  description?: string
  priority?: string
  rrule?: string | null
  dtStart: string
  dtEnd?: string | null
  assigneeStrategy?: string
  fixedAssigneeId?: string | null
}

export async function createTemplate(body: TemplateCreateInput): Promise<{ data: TemplateData }> {
  const response = await fetch(`${BASE_URL}/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) return parseApiError(response)
  return parseJson(response)
}

export async function updateTemplate(id: string, body: Partial<TemplateCreateInput> & { isActive?: boolean }): Promise<{ data: TemplateData }> {
  const response = await fetch(`${BASE_URL}/templates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) return parseApiError(response)
  return parseJson(response)
}

export async function deleteTemplate(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/templates/${id}`, { method: 'DELETE' })
  if (!response.ok) return parseApiError(response)
}

// ── Предпросмотр RRULE ────────────────────────────────────────────────

export async function previewRrule(body: { rrule: string; dtStart: string; count?: number }): Promise<{ dates: string[] }> {
  const response = await fetch(`${BASE_URL}/templates/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) return parseApiError(response)
  return parseJson(response)
}

// ── Доска инстансов ───────────────────────────────────────────────────

export async function getOrgTasks(params: { status?: string; functionId?: string; assigneeId?: string } = {}): Promise<{ data: OrgTaskData[]; count: number }> {
  const sp = new URLSearchParams()
  if (params.status) sp.set('status', params.status)
  if (params.functionId) sp.set('functionId', params.functionId)
  if (params.assigneeId) sp.set('assigneeId', params.assigneeId)
  const qs = sp.toString()
  const response = await fetch(`${BASE_URL}/tasks${qs ? `?${qs}` : ''}`)
  if (!response.ok) return parseApiError(response)
  return parseJson(response)
}
