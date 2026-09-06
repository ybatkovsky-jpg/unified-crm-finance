"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowRight, MessageSquare, Send, Loader2, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { DealHistoryData } from "@/lib/api/types"

interface CommentAuthor {
  id: string
  name: string | null
  email: string
}

interface DealComment {
  id: string
  content: string
  authorId: string
  createdAt: string
  User?: CommentAuthor | null
}

function formatDateTime(d: string | Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d))
}

function userName(u: { name?: string | null; email?: string | null } | null | undefined): string {
  if (!u) return "Система"
  return u.name || u.email || "Система"
}

type Entry =
  | { kind: "history"; id: string; at: Date; history: DealHistoryData }
  | { kind: "comment"; id: string; at: Date; comment: DealComment }

export function DealTimeline({ dealId, history }: { dealId: string; history?: DealHistoryData[] | null }) {
  const [comments, setComments] = useState<DealComment[]>([])
  const [text, setText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/deals/${dealId}/comments`)
      if (res.ok) {
        const json = await res.json()
        setComments(json.data ?? [])
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [dealId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleSubmit = async () => {
    const trimmed = text.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/deals/${dealId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      })
      if (res.ok) {
        setText("")
        await fetchComments()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const entries: Entry[] = [
    ...(history ?? []).map((h): Entry => ({ kind: "history", id: `h-${h.id}`, at: new Date(h.changedAt), history: h })),
    ...comments.map((c): Entry => ({ kind: "comment", id: `c-${c.id}`, at: new Date(c.createdAt), comment: c })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime())

  return (
    <div className="space-y-4">
      {/* Ввод комментария */}
      <div className="space-y-2">
        <Textarea
          placeholder="Написать в ленту…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Ctrl+Enter — отправить</span>
          <Button size="sm" onClick={handleSubmit} disabled={!text.trim() || submitting}>
            {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            <span className="ml-1.5">Отправить</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Загрузка ленты…
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-sm text-muted-foreground">
          <History className="mb-2 size-8 opacity-40" />
          Лента пуста
        </div>
      ) : (
        <ol className="relative space-y-3 border-l border-border pl-4">
          {entries.map((e) =>
            e.kind === "comment" ? (
              <li key={e.id} className="relative">
                <span className="absolute -left-[1.4rem] top-1.5 flex size-5 items-center justify-center rounded-full bg-muted ring-2 ring-background">
                  <MessageSquare className="size-3 text-muted-foreground" />
                </span>
                <div className="flex items-baseline gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{userName(e.comment.User)}</span>
                  <span>{formatDateTime(e.comment.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-sm whitespace-pre-wrap break-words">{e.comment.content}</p>
              </li>
            ) : (
              <li key={e.id} className="relative">
                <span
                  className="absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full ring-2 ring-background"
                  style={{ backgroundColor: e.history.toStage?.color || "#94a3b8" }}
                />
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{e.history.fromStage?.name ?? "Начальный этап"}</span>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-medium"
                    style={{
                      backgroundColor: `${e.history.toStage?.color || "#94a3b8"}1a`,
                      color: e.history.toStage?.color || "#94a3b8",
                    }}
                  >
                    {e.history.toStage?.name ?? "—"}
                  </span>
                  {e.history.toStage?.isWonStage && (
                    <Badge variant="secondary" className="text-[10px]">выиграно</Badge>
                  )}
                  {e.history.toStage?.isLostStage && (
                    <Badge variant="outline" className="text-[10px]">потеряно</Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{formatDateTime(e.history.changedAt)}</span>
                  <span className="text-border">•</span>
                  <span>{userName(e.history.changedByUser)}</span>
                </div>
                {e.history.comment && <p className="mt-1.5 text-sm text-muted-foreground">{e.history.comment}</p>}
              </li>
            )
          )}
        </ol>
      )}
    </div>
  )
}
