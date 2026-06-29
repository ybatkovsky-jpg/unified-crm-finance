"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon, UsersRoundIcon } from "lucide-react"

import { ApiClientError, parseJson } from "@/lib/api/shared"
import { getTasks, type TaskData } from "@/lib/api/tasks"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const STATUS_LABELS: Record<string, string> = {
  todo: "К выполнению", in_progress: "В работе", done: "Готово", failed: "Провалена", cancelled: "Отменена",
}
const TYPE_LABELS: Record<string, string> = {
  measurement_1: "Замер #1", measurement_2: "Замер #2", installation: "Монтаж", general: "Общая", client: "Клиентская",
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("ru-RU")
}

function isOverdue(t: TaskData): boolean {
  if (!t.dueDate) return false
  if (["done", "cancelled", "failed"].includes(t.status)) return false
  return new Date(t.dueDate) < new Date()
}

export default function AllTasksPage() {
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/tasks${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await parseJson<{ data: TaskData[] }>(res)
      setTasks(json.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить задачи.")
    } finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { fetchAll() }, [fetchAll])

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
              <Button variant="outline" onClick={fetchAll}>
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
          <UsersRoundIcon className="size-6" /> Все задачи
        </h1>
        <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v) }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectGroup>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="todo">К выполнению</SelectItem>
            <SelectItem value="in_progress">В работе</SelectItem>
            <SelectItem value="done">Готово</SelectItem>
            <SelectItem value="failed">Провалены</SelectItem>
            <SelectItem value="cancelled">Отменены</SelectItem>
          </SelectGroup></SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-3 font-medium">Задача</th>
                <th className="p-3 font-medium">Исполнитель</th>
                <th className="p-3 font-medium">Тип</th>
                <th className="p-3 font-medium">Статус</th>
                <th className="p-3 font-medium">Дедлайн</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Нет задач</td></tr>
              )}
              {tasks.map((t) => {
                const overdue = isOverdue(t)
                return (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="p-3">
                      <div className="font-medium">{t.title}</div>
                      {t.projectId && (
                        <Link href={`/projects/${t.projectId}`} className="text-xs text-muted-foreground hover:underline">проект</Link>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {t.User_Task_assigneeIdToUser?.name ?? "— не назначен"}
                    </td>
                    <td className="p-3"><Badge variant="outline">{TYPE_LABELS[t.type] ?? t.type}</Badge></td>
                    <td className="p-3"><Badge variant="secondary">{STATUS_LABELS[t.status] ?? t.status}</Badge></td>
                    <td className={`p-3 ${overdue ? "text-red-600 font-medium" : ""}`}>
                      {t.dueDate ? formatDate(t.dueDate) : "—"}
                    </td>
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
