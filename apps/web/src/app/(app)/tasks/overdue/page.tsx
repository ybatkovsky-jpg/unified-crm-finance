"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon, CalendarClockIcon } from "lucide-react"

import { ApiClientError } from "@/lib/api/shared"
import { getTasks, type TaskData } from "@/lib/api/tasks"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("ru-RU")
}

const TYPE_LABELS: Record<string, string> = {
  measurement_1: "Замер #1", measurement_2: "Замер #2", installation: "Монтаж", general: "Общая", client: "Клиентская",
}

export default function OverdueTasksPage() {
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverdue = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await getTasks({ overdue: true })
      setTasks(data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить просроченные задачи.")
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchOverdue() }, [fetchOverdue])

  if (loading) {
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
              <Button variant="outline" onClick={fetchOverdue}>
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
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <CalendarClockIcon className="size-6 text-red-600" /> Просроченные задачи
        </h1>
        <Badge variant="destructive">{tasks.length}</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-3 font-medium">Задача</th>
                <th className="p-3 font-medium">Исполнитель</th>
                <th className="p-3 font-medium">Тип</th>
                <th className="p-3 font-medium">Дедлайн</th>
                <th className="p-3 font-medium">Просрочка (дн.)</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Нет просроченных задач 🎉</td></tr>
              )}
              {tasks.map((t) => {
                const daysOverdue = t.dueDate
                  ? Math.floor((Date.now() - new Date(t.dueDate).getTime()) / 86400000)
                  : 0
                return (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="p-3">
                      <div className="font-medium">{t.title}</div>
                      {t.projectId && (
                        <Link href={`/projects/${t.projectId}`} className="text-xs text-muted-foreground hover:underline">проект</Link>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {t.User_Task_assigneeIdToUser?.name ?? "—"}
                    </td>
                    <td className="p-3"><Badge variant="outline">{TYPE_LABELS[t.type] ?? t.type}</Badge></td>
                    <td className="p-3 text-red-600 font-medium">{t.dueDate ? formatDate(t.dueDate) : "—"}</td>
                    <td className="p-3"><Badge variant="destructive">{daysOverdue}</Badge></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
