"use client"

import { useState, useEffect, useCallback } from "react"
import { MessageSquare, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

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

interface DealCommentsProps {
  dealId: string
}

function formatDateTime(d: string): string {
  const date = new Date(d)
  return date.toLocaleDateString("ru-RU") + " " + date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
}

export function DealComments({ dealId }: DealCommentsProps) {
  const [comments, setComments] = useState<DealComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/deals/${dealId}/comments`)
      if (!res.ok) throw new Error("Не удалось загрузить комментарии")
      const json = await res.json()
      setComments(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить комментарии")
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
    setError(null)
    try {
      const res = await fetch(`/api/deals/${dealId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      })
      if (!res.ok) throw new Error("Не удалось добавить комментарий")
      setText("")
      await fetchComments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось добавить комментарий")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Список комментариев */}
      {loading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Загрузка комментариев…
        </div>
      ) : error ? (
        <div className="py-4 text-center text-destructive text-sm">{error}</div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-muted-foreground text-sm">
          <MessageSquare className="size-8 mb-2 opacity-40" />
          Пока нет комментариев
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border bg-card p-3">
              <div className="flex items-baseline gap-2 text-xs text-muted-foreground mb-1">
                <span className="font-medium text-foreground">
                  {c.User?.name || c.User?.email || "—"}
                </span>
                <span>{formatDateTime(c.createdAt)}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap break-words">{c.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Поле ввода */}
      <div className="space-y-2">
        <Textarea
          placeholder="Написать комментарий…"
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
            {submitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            <span className="ml-1.5">Отправить</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
