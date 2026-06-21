"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit2, Save, X, History, Link as LinkIcon, Calendar, User, DollarSign, Building2 } from "lucide-react"
import { dealsApi, ApiClientError } from "@/lib/api/deals"
import type { DealData } from "@/lib/api/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [deal, setDeal] = useState<DealData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    title: "",
    amount: "",
    currency: "RUB",
    expectedCloseDate: "",
    description: "",
    lossReason: "",
  })

  const unwrapParams = useCallback(async () => {
    return await params
  }, [params])

  const fetchDeal = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await dealsApi.getDeal(id)
      setDeal(response.data)
      setEditForm({
        title: response.data.title,
        amount: response.data.amount.toString(),
        currency: response.data.currency,
        expectedCloseDate: response.data.expectedCloseDate
          ? new Date(response.data.expectedCloseDate).toISOString().split('T')[0]
          : "",
        description: response.data.description || "",
        lossReason: response.data.lossReason || "",
      })
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to load deal. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    unwrapParams().then(({ id }) => {
      fetchDeal(id)
    })
  }, [unwrapParams, fetchDeal])

  const handleSave = async () => {
    if (!deal) return

    setSaving(true)
    setError(null)

    try {
      const response = await dealsApi.updateDeal(deal.id, {
        title: editForm.title,
        amount: parseFloat(editForm.amount) || 0,
        currency: editForm.currency,
        expectedCloseDate: editForm.expectedCloseDate || undefined,
        description: editForm.description || undefined,
        lossReason: editForm.lossReason || undefined,
      })

      setDeal(response.data)
      setIsEditing(false)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to save deal. Please try again.")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (deal) {
      setEditForm({
        title: deal.title,
        amount: deal.amount.toString(),
        currency: deal.currency,
        expectedCloseDate: deal.expectedCloseDate
          ? new Date(deal.expectedCloseDate).toISOString().split('T')[0]
          : "",
        description: deal.description || "",
        lossReason: deal.lossReason || "",
      })
    }
    setIsEditing(false)
    setError(null)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading deal...</div>
        </div>
      </div>
    )
  }

  if (error && !deal) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="size-4" />
                <span className="ml-1.5">Go Back</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!deal) return null

  const stageColor = deal.stage.color || "#94a3b8"
  const isWon = deal.stage.isWonStage
  const isLost = deal.stage.isLostStage

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{deal.title}</h1>
              <Badge
                style={{
                  backgroundColor: stageColor,
                  color: "#fff",
                }}
              >
                {deal.stage.name}
              </Badge>
              {isWon && <Badge variant="default">Выиграна</Badge>}
              {isLost && <Badge variant="destructive">Проиграна</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {deal.number} · {deal.pipeline.name}
            </p>
          </div>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 className="size-4" />
            <span className="ml-1.5">Изменить</span>
          </Button>
        )}
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Детали сделки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="title">Название</Label>
                    <Input
                      id="title"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Сумма</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="currency">Валюта</Label>
                      <Select
                        value={editForm.currency}
                        onValueChange={(value) => setEditForm({ ...editForm, currency: value })}
                      >
                        <SelectTrigger id="currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RUB">RUB</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="expectedCloseDate">Ожидаемая дата закрытия</Label>
                    <Input
                      id="expectedCloseDate"
                      type="date"
                      value={editForm.expectedCloseDate}
                      onChange={(e) => setEditForm({ ...editForm, expectedCloseDate: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={4}
                    />
                  </div>

                  {isLost && (
                    <div className="grid gap-2">
                      <Label htmlFor="lossReason">Причина проигрыша</Label>
                      <Textarea
                        id="lossReason"
                        value={editForm.lossReason}
                        onChange={(e) => setEditForm({ ...editForm, lossReason: e.target.value })}
                        rows={2}
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} disabled={saving}>
                      <Save className="size-4" />
                      <span className="ml-1.5">{saving ? "Saving..." : "Save"}</span>
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="size-4" />
                      <span className="ml-1.5">Cancel</span>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Сумма</p>
                        <p className="font-medium">
                          {deal.amount.toLocaleString("ru-RU")} {deal.currency}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ожидаемое закрытие</p>
                        <p className="font-medium">
                          {deal.expectedCloseDate
                            ? new Date(deal.expectedCloseDate).toLocaleDateString("ru-RU")
                            : "\u2014"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {deal.actualCloseDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Фактическое закрытие</p>
                        <p className="font-medium">
                          {new Date(deal.actualCloseDate).toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                    </div>
                  )}

                  {deal.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Описание</p>
                      <p className="text-sm">{deal.description}</p>
                    </div>
                  )}

                  {deal.lossReason && (
                    <div>
                      <p className="text-xs text-destructive mb-1">Причина проигрыша</p>
                      <p className="text-sm">{deal.lossReason}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Related */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="size-4" />
                Связанные сущности
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Контакт</p>
                  {deal.contact ? (
                    <a
                      href={`/crm/contacts/${deal.contact.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {deal.contact.type === "company"
                        ? deal.contact.companyName
                        : [deal.contact.lastName, deal.contact.firstName]
                            .filter(Boolean)
                            .join(" ")}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">\u2014</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Менеджер</p>
                  {deal.manager ? (
                    <p className="text-sm font-medium">{deal.manager.name || "\u2014"}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">\u2014</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stage Info */}
          <Card>
            <CardHeader>
              <CardTitle>Этап</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="p-3 rounded-lg text-center text-white font-medium"
                style={{ backgroundColor: stageColor }}
              >
                {deal.stage.name}
              </div>
              {deal.stage.probability > 0 && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Вероятность: {deal.stage.probability}%
                </p>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Метаданные</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Создана</span>
                <span>{new Date(deal.createdAt).toLocaleDateString("ru-RU")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Обновлена</span>
                <span>{new Date(deal.updatedAt).toLocaleDateString("ru-RU")}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
