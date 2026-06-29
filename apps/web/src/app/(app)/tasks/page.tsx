"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon, CheckIcon, RotateCcwIcon, CalendarClockIcon, ListTodoIcon } from "lucide-react"

import { ApiClientError, parseJson } from "@/lib/api/shared"
import {
  getTasks, updateTask, rescheduleTask, recreateTask,
  type TaskData,
} from "@/lib/api/tasks"
import { useMe } from "@/components/layout/use-me"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

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

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("ru-RU")
}

function isOverdue(t: TaskData): boolean {
  if (!t.dueDate) return false
  if (["done", "cancelled", "failed"].includes(t.status)) return false
  return new Date(t.dueDate) < new Date()
}

export default function MyTasksPage() {
  const { me, loading: meLoading } = useMe()
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleReason, setRescheduleReason] = useState("")
  const [busy, setBusy] = useState(false)

  const fetchTasks = useCallback(async () => {
    if (!me?.id) return
    setLoading(true); setError(null)
    try {
      const { data } = await getTasks({ assigneeId: me.id })
      setTasks(data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить задачи.")
    } finally { setLoading(false) }
  }, [me?.id])

  useEffect(() => { if (!meLoading) fetchTasks() }, [fetchTasks, meLoading])

  const handleDone = async (id: string) => {
    setBusy(true)
    try {
      await updateTask(id, { status: "done" })
      await fetchTasks()
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Ошибка")
    } finally { setBusy(false) }
  }

  const handleReschedule = async (id: string) => {
    if (!rescheduleDate) return
    setBusy(true)
    try {
      await rescheduleTask(id, {
        dueDate: new Date(rescheduleDate).toISOString(),
        failedReason: rescheduleReason || "Перенос",
        cancel: false,
      })
      setRescheduleId(null); setRescheduleDate(""); setRescheduleReason("")
      await fetchTasks()
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Ошибка переноса")
    } finally { setBusy(false) }
  }

  const handleRecreate = async (id: string) => {
    const reason = prompt("Причина пересоздания (почему выезд не состоялся)?")
    if (!reason) return
    const date = prompt("Новая дата (YYYY-MM-DD)?")
    if (!date) return
    setBusy(true)
    try {
      await recreateTask(id, { dueDate: new Date(date).toISOString(), failedReason: reason })
      await fetchTasks()
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Ошибка пересоздания")
    } finally { setBusy(false) }
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
              <Button variant="outline" onClick={fetchTasks}>
                <RefreshCwIcon className="size-4" /><span className="ml-1.5">Повторить</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const active = tasks.filter((t) => !["done", "cancelled"].includes(t.status))
  const done = tasks.filter((t) => t.status === "done")

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ListTodoIcon className="size-6" /> Мои задачи
        </h1>
        <Badge variant="outline">{active.length} активных</Badge>
      </div>

      {/* Активные задачи */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-3 font-medium">Задача</th>
                <th className="p-3 font-medium">Тип</th>
                <th className="p-3 font-medium">Статус</th>
                <th className="p-3 font-medium">Дедлайн</th>
                <th className="p-3 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {active.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Нет активных задач</td></tr>
              )}
              {active.map((t) => {
                const overdue = isOverdue(t)
                return (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="p-3">
                      <div className="font-medium">{t.title}</div>
                      {t.projectId && (
                        <Link href={`/projects/${t.projectId}`} className="text-xs text-muted-foreground hover:underline">
                          проект
                        </Link>
                      )}
                      {t.parentTaskId && (
                        <span className="text-xs text-muted-foreground ml-2">↻ перенос</span>
                      )}
                    </td>
                    <td className="p-3"><Badge variant="outline">{typeLabel(t.type)}</Badge></td>
                    <td className="p-3"><Badge variant={STATUS_VARIANTS[t.status]}>{STATUS_LABELS[t.status] ?? t.status}</Badge></td>
                    <td className="p-3">
                      {t.dueDate ? (
                        <span className={overdue ? "text-red-600 font-medium" : ""}>
                          {formatDate(t.dueDate)} {overdue && "⚠ просрочена"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        {t.status !== "done" && (
                          <Button variant="ghost" size="sm" disabled={busy} onClick={() => handleDone(t.id)}>
                            <CheckIcon className="size-3.5" /> Готово
                          </Button>
                        )}
                        {rescheduleId === t.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="date" value={rescheduleDate.slice(0, 10)}
                              onChange={(e) => setRescheduleDate(e.target.value)}
                              className="h-7 w-32 text-xs"
                            />
                            <Button variant="outline" size="sm" disabled={busy} onClick={() => handleReschedule(t.id)}>
                              OK
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setRescheduleId(null)}>×</Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" disabled={busy} onClick={() => { setRescheduleId(t.id); setRescheduleReason("") }}>
                            <CalendarClockIcon className="size-3.5" /> Перенести
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" disabled={busy} onClick={() => handleRecreate(t.id)}>
                          <RotateCcwIcon className="size-3.5" /> Пересоздать
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Выполненные (свёрнуто) */}
      {done.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-3 text-muted-foreground">Выполненные ({done.length})</h3>
            <div className="space-y-1">
              {done.slice(0, 10).map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="line-through">{t.title}</span>
                  <span>{t.completedAt ? formatDate(t.completedAt) : ""}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    measurement_1: "Замер #1",
    measurement_2: "Замер #2",
    installation: "Монтаж",
    general: "Общая",
    client: "Клиентская",
  }
  return labels[type] ?? type
}
