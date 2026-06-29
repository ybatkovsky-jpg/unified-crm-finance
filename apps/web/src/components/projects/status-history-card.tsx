"use client"

import { useState, useEffect, useCallback } from "react"
import { Clock, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface HistoryEntry {
  id: string
  fromStatus: string | null
  toStatus: string
  changedAt: string
  reason: string | null
  User: { id: string; name: string; email: string } | null
}

const STATUS_LABELS: Record<string, string> = {
  lead: "Лид",
  active: "Активный",
  completed: "Завершён",
  paused: "На паузе",
}

function statusLabel(s: string): string {
  return STATUS_LABELS[s] ?? s
}

export function StatusHistoryCard({ projectId }: { projectId: string }) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/history`)
      if (!res.ok) return
      const { data } = await res.json()
      setHistory(data ?? [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="size-4" />
          История статусов
          <ChevronDown
            className={`size-4 ml-auto transition-transform ${open ? "rotate-180" : ""}`}
          />
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3 text-sm">
          {loading ? (
            <p className="text-muted-foreground">Загрузка...</p>
          ) : history.length === 0 ? (
            <p className="text-muted-foreground">Нет записей</p>
          ) : (
            history.map((h) => (
              <div key={h.id} className="border-l-2 border-muted pl-3 space-y-1">
                <div className="flex items-center gap-2">
                  {h.fromStatus && (
                    <Badge variant="secondary" className="text-xs">
                      {statusLabel(h.fromStatus)}
                    </Badge>
                  )}
                  <span className="text-muted-foreground">→</span>
                  <Badge
                    variant={h.toStatus === "completed" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {statusLabel(h.toStatus)}
                  </Badge>
                </div>
                {h.reason && (
                  <p className="text-muted-foreground text-xs">{h.reason}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(h.changedAt).toLocaleString("ru-RU")}
                  {h.User && ` · ${h.User.name || h.User.email}`}
                </p>
              </div>
            ))
          )}
        </CardContent>
      )}
    </Card>
  )
}
