"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon, RefreshCwIcon, CheckIcon, XIcon } from "lucide-react"

import { approvalsApi, ApiClientError } from "@/lib/api/approvals"
import type { ApprovalRequestData } from "@/lib/api/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  approved: "Одобрено",
  rejected: "Отклонено",
}

export default function ApprovalDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const [approval, setApproval] = useState<ApprovalRequestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [comment, setComment] = useState("")
  const [decidedBy, setDecidedBy] = useState("owner")

  const fetchApproval = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await approvalsApi.getApproval(id)
      setApproval(res.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить заявку.")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchApproval()
  }, [fetchApproval])

  const handleDecide = async (decision: "approved" | "rejected") => {
    setBusy(true)
    setError(null)
    try {
      const res = await approvalsApi.decideApproval(id, {
        decision,
        decidedBy: decidedBy.trim() || "owner",
        comment: comment.trim() || undefined,
      })
      setApproval(res.data)
      setComment("")
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось принять решение.")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center py-12">
        <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Загрузка...</span>
      </div>
    )
  }

  if (error && !approval) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <BackLink />
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchApproval}>
          <RefreshCwIcon className="size-4" /> Повторить
        </Button>
      </div>
    )
  }

  if (!approval) return null

  const isPending = approval.status === "pending"

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackLink />

      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-3">
          Заявка <span className="text-muted-foreground font-mono text-base">{approval.id.slice(0, 8)}</span>
          <Badge>{STATUS_LABELS[approval.status] ?? approval.status}</Badge>
        </h1>
        <p className="text-muted-foreground mt-1 capitalize">
          Тип: {approval.type} · Сущность: {approval.entityId}
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Детали</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Сумма: </span>
            {(approval.amount ?? 0).toLocaleString("ru-RU")} ₽
          </div>
          <div>
            <span className="text-muted-foreground">Запросил: </span>
            {approval.requester?.name ?? approval.requestedBy}
          </div>
          <div>
            <span className="text-muted-foreground">Запрошено: </span>
            {new Date(approval.requestedAt).toLocaleString("ru-RU")}
          </div>
          {approval.decidedAt && (
            <>
              <div>
                <span className="text-muted-foreground">Согласовал: </span>
                {approval.decider?.name ?? approval.decidedBy}
              </div>
              <div>
                <span className="text-muted-foreground">Решение: </span>
                {new Date(approval.decidedAt).toLocaleString("ru-RU")}
              </div>
            </>
          )}
          {approval.comment && (
            <div>
              <span className="text-muted-foreground">Комментарий: </span>
              {approval.comment}
            </div>
          )}
        </CardContent>
      </Card>

      {isPending && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Решение (PROC-30)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="decidedBy">Согласует (user id)</Label>
              <Input id="decidedBy" value={decidedBy} onChange={(e) => setDecidedBy(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comment">Комментарий</Label>
              <Input
                id="comment"
                placeholder="комментарий к решению"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleDecide("approved")} disabled={busy}>
                <CheckIcon className="size-4" /> Одобрить
              </Button>
              <Button variant="outline" onClick={() => handleDecide("rejected")} disabled={busy}>
                <XIcon className="size-4" /> Отклонить
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isPending && (
        <p className="text-sm text-muted-foreground">
          Заявка уже {STATUS_LABELS[approval.status]}. {approval.status === "approved" ? "Счёт готов к оплате (PROC-31)." : ""}
        </p>
      )}
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/procurement/approvals"
      className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
    >
      <ArrowLeftIcon className="size-4 mr-1" /> К списку заявок
    </Link>
  )
}
