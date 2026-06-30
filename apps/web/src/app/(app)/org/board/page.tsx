"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { RefreshCwIcon, CheckIcon, FilterIcon, CalendarClockIcon } from "lucide-react"
import { ApiClientError } from "@/lib/api/shared"
import { getOrgTasks, type OrgTaskData } from "@/lib/api/org"
import { getFunctions, type FunctionData } from "@/lib/api/org"
import { useMe } from "@/components/layout/use-me"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const STATUS_LABELS: Record<string, string> = {
  todo: "К выполнению",
  in_progress: "В работе",
  done: "Готово",
  failed: "Провалена",
  cancelled: "Отменена",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  todo: "secondary",
  in_progress: "default",
  done: "outline",
  failed: "destructive",
  cancelled: "outline",
}

const PRIORITY_LABELS: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  urgent: "Срочный",
}

const PRIORITY_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  urgent: "destructive",
}

function formatDate(d: string | Date | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("ru-RU")
}

function isOverdue(t: OrgTaskData): boolean {
  if (!t.dueDate) return false
  if (["done", "cancelled", "failed"].includes(t.status)) return false
  return new Date(t.dueDate) < new Date()
}

export default function OrgBoardPage() {
  const { me, loading: meLoading } = useMe()
  const [tasks, setTasks] = useState<OrgTaskData[]>([])
  const [functions, setFunctions] = useState<FunctionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [functionFilter, setFunctionFilter] = useState<string>("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")

  const isDirector = !!me?.roleCodes?.includes("director")

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [tasksRes, fnRes] = await Promise.all([
        getOrgTasks({
          status: statusFilter !== "all" ? statusFilter : undefined,
          functionId: functionFilter !== "all" ? functionFilter : undefined,
          assigneeId: assigneeFilter !== "all" ? assigneeFilter : undefined,
        }),
        getFunctions(),
      ])
      setTasks(tasksRes.data)
      setFunctions(fnRes.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить задачи.")
    } finally { setLoading(false) }
  }, [statusFilter, functionFilter, assigneeFilter])

  useEffect(() => { if (!meLoading) fetchData() }, [fetchData, meLoading])

  // Уникальные исполнители из задач (для фильтра — без отдельного API пользователей).
  const assignees = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of tasks) {
      if (t.assigneeId && t.User_Task_assigneeIdToUser?.name) {
        map.set(t.assigneeId, t.User_Task_assigneeIdToUser.name)
      }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [tasks])

  const grouped = useMemo(() => {
    const groups: Record<string, OrgTaskData[]> = { todo: [], in_progress: [], done: [], failed: [], cancelled: [] }
    for (const t of tasks) {
      if (groups[t.status]) groups[t.status].push(t)
    }
    return groups
  }, [tasks])

  const handleDone = async (id: string) => {
    setBusyId(id)
    try {
      // Локальное обновление статуса через tasks API.
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.message || "Ошибка")
      }
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: "done" } : t)))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка")
    } finally { setBusyId(null) }
  }

  if (meLoading || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center py-12">
          <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Загрузка...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={fetchData}>
                <RefreshCwIcon className="size-4" /><span className="ml-1.5">Повторить</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Доска орг-задач</h1>
          <p className="text-sm text-muted-foreground">
            Задачи функций компании: реклама, налоги, аренда и т.п.
            {!isDirector && " — видны ваши задачи и задачи ваших функций."}
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCwIcon className="size-4" /><span className="ml-1.5">Обновить</span>
        </Button>
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <FilterIcon className="size-4" /> Фильтры:
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Статус" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={functionFilter} onValueChange={(v) => setFunctionFilter(v ?? "all")}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Функция" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все функции</SelectItem>
            {functions.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.Department?.name ? `${f.Department.name} → ` : ""}{f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={assigneeFilter} onValueChange={(v) => setAssigneeFilter(v ?? "all")}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Исполнитель" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все исполнители</SelectItem>
            {assignees.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Список задач */}
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              Нет задач по выбранным фильтрам.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(["todo", "in_progress", "done", "failed", "cancelled"] as const).map((status) => {
            const items = grouped[status]
            if (items.length === 0) return null
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{STATUS_LABELS[status]}</h3>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((t) => {
                    const overdue = isOverdue(t)
                    return (
                      <Card key={t.id} className={overdue ? "border-destructive" : ""}>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium leading-snug">{t.title}</h4>
                            {overdue && (
                              <Badge variant="destructive" className="shrink-0 gap-1">
                                <CalendarClockIcon className="size-3" /> Просрочена
                              </Badge>
                            )}
                          </div>

                          {t.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant={PRIORITY_VARIANTS[t.priority] ?? "secondary"}>
                              {PRIORITY_LABELS[t.priority] ?? t.priority}
                            </Badge>
                            {t.OrgFunction && (
                              <Badge variant="outline">
                                {t.OrgFunction.Department?.name ? `${t.OrgFunction.Department.name} → ` : ""}
                                {t.OrgFunction.name}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                            <span>
                              Срок: <span className={overdue ? "text-destructive font-medium" : ""}>
                                {formatDate(t.dueDate)}
                              </span>
                            </span>
                            {t.User_Task_assigneeIdToUser && (
                              <span>👤 {t.User_Task_assigneeIdToUser.name}</span>
                            )}
                          </div>

                          {status !== "done" && status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              disabled={busyId === t.id}
                              onClick={() => handleDone(t.id)}
                            >
                              <CheckIcon className="size-4" />
                              <span className="ml-1.5">{busyId === t.id ? "..." : "Выполнено"}</span>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
