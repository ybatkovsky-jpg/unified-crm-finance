"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Plus, Trash2, FileText, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getDealOffers, createOffer, updateOffer, deleteOffer } from "@/lib/api/offers"
import type { CommercialOfferData } from "@/lib/api/types"

const STATUS_META: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Черновик", variant: "secondary" },
  sent: { label: "Отправлено", variant: "default" },
  won: { label: "Принято", variant: "outline" },
  lost: { label: "Отклонено", variant: "destructive" },
}

const STATUSES = ["draft", "sent", "won", "lost"]

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(n)
}

export function DealOffersSection({ dealId }: { dealId: string }) {
  const [offers, setOffers] = useState<CommercialOfferData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")

  const fetchOffers = useCallback(async () => {
    try {
      setError(null)
      const list = await getDealOffers(dealId)
      setOffers(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить КП")
    } finally {
      setLoading(false)
    }
  }, [dealId])

  useEffect(() => {
    fetchOffers()
  }, [fetchOffers])

  async function handleCreate() {
    if (!title.trim()) return
    try {
      await createOffer(dealId, {
        title: title.trim(),
        amount: amount ? Number(amount) : 0,
      })
      setTitle("")
      setAmount("")
      setCreating(false)
      await fetchOffers()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось создать КП")
    }
  }

  async function handleStatus(id: string, status: string) {
    try {
      await updateOffer(id, { status })
      await fetchOffers()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось обновить статус")
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Удалить это КП?")) return
    try {
      await deleteOffer(id)
      await fetchOffers()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить КП")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="size-4" />
            Коммерческие предложения
            {offers.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {offers.length}
              </Badge>
            )}
          </span>
          <Button size="sm" variant="outline" onClick={() => setCreating((v) => !v)}>
            <Plus className="size-4" />
            <span className="ml-1.5">Создать КП</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {creating && (
          <div className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
            <div className="min-w-[220px] flex-1 space-y-1">
              <Label htmlFor="offer-title">Название</Label>
              <Input
                id="offer-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="КП эконом / стандарт / премиум"
              />
            </div>
            <div className="w-40 space-y-1">
              <Label htmlFor="offer-amount">Сумма, ₽</Label>
              <Input
                id="offer-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <Button size="sm" onClick={handleCreate} disabled={!title.trim()}>
              Создать
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>
              Отмена
            </Button>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        ) : offers.length === 0 ? (
          <p className="text-sm text-muted-foreground">КП пока нет. Создайте первую версию.</p>
        ) : (
          <ul className="divide-y">
            {offers.map((o) => {
              const meta = STATUS_META[o.status] ?? STATUS_META.draft
              return (
                <li key={o.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-[200px] flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/offers/${o.id}`} className="text-sm font-medium hover:underline">
                        {o.number}
                      </Link>
                      <Badge variant="secondary" className="text-[10px]">
                        v{o.version}
                      </Badge>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{o.title}</p>
                    {o.validUntil && (
                      <p className="text-xs text-muted-foreground">
                        действует до {new Date(o.validUntil).toLocaleDateString("ru-RU")}
                      </p>
                    )}
                  </div>
                  <div className="text-sm font-semibold">{fmtMoney(o.amount)}</div>
                  <select
                    value={o.status}
                    onChange={(e) => handleStatus(o.id, e.target.value)}
                    className="rounded-md border bg-transparent px-2 py-1 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_META[s]?.label ?? s}
                      </option>
                    ))}
                  </select>
                  <Link href={`/offers/${o.id}`} className="text-muted-foreground hover:text-foreground">
                    <ExternalLink className="size-4" />
                  </Link>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(o.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
