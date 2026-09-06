"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Printer, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getOffer } from "@/lib/api/offers"
import type { CommercialOfferData } from "@/lib/api/types"

const STATUS_LABEL: Record<string, string> = {
  draft: "Черновик",
  sent: "Отправлено",
  won: "Принято",
  lost: "Отклонено",
}

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(n)
}

export default function OfferPrintPage() {
  const params = useParams<{ id: string }>()
  const [offer, setOffer] = useState<CommercialOfferData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!params?.id) return
    getOffer(params.id)
      .then(setOffer)
      .catch((e) => setError(e instanceof Error ? e.message : "Не удалось загрузить КП"))
  }, [params?.id])

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (!offer) {
    return <div className="container mx-auto p-6 text-muted-foreground">Загрузка…</div>
  }

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between no-print">
        <Link href={`/deals/${offer.dealId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4" />
            <span className="ml-1.5">К сделке</span>
          </Button>
        </Link>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-4" />
          <span className="ml-1.5">Печать / PDF</span>
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-6 p-8">
          <header className="space-y-1">
            <p className="text-sm text-muted-foreground">ООО «ПРО Мебель»</p>
            <h1 className="text-2xl font-semibold">
              Коммерческое предложение № {offer.number}
            </h1>
            <p className="text-sm text-muted-foreground">
              от {new Date(offer.createdAt).toLocaleDateString("ru-RU")}
            </p>
          </header>

          <section className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Наименование</p>
              <p className="text-lg font-medium">{offer.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Сумма</p>
                <p className="text-lg font-semibold">{fmtMoney(offer.amount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Статус</p>
                <Badge variant="secondary">{STATUS_LABEL[offer.status] ?? offer.status}</Badge>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Действительно до</p>
              <p>{offer.validUntil ? new Date(offer.validUntil).toLocaleDateString("ru-RU") : "—"}</p>
            </div>

            {offer.notes && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Примечания</p>
                <p className="whitespace-pre-wrap text-sm">{offer.notes}</p>
              </div>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
