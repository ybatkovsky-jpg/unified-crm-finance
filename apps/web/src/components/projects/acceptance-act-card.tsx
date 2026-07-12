"use client"

import { useState, useEffect, useCallback } from "react"
import { FileCheck, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { acceptanceActsApi, ApiClientError } from "@/lib/api/acceptance-act"
import { useMe } from "@/components/layout/use-me"
import type { AcceptanceActData, AcceptanceSignMethod } from "@/lib/api/types"

interface AcceptanceActCardProps {
  projectId: string
  /** Тип контрагента: "company" → юрлицо (менеджер), иначе физлицо (монтажник). */
  contactType?: string | null
  onUpdate?: () => void
}

const SIGNER_TYPE_LABEL: Record<string, string> = {
  individual: "Физлицо — подписывает монтажник на объекте",
  legal: "Юрлицо — подписывает менеджер (ЭДО/бумага)",
}

export function AcceptanceActCard({ projectId, contactType, onUpdate }: AcceptanceActCardProps) {
  const { me } = useMe()
  const [act, setAct] = useState<AcceptanceActData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signOpen, setSignOpen] = useState(false)
  const [signMethod, setSignMethod] = useState<AcceptanceSignMethod>("paper")
  const [signing, setSigning] = useState(false)

  const expectedSignerType = contactType === "company" ? "legal" : "individual"

  const fetchAct = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await acceptanceActsApi.getAcceptanceAct(projectId)
      setAct(response.data)
      if (response.data?.signMethod) {
        setSignMethod(response.data.signMethod)
      }
    } catch (err) {
      console.error("Failed to fetch acceptance act:", err)
      setError("Не удалось загрузить акт приёмки")
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchAct()
  }, [fetchAct])

  const handleCreate = async () => {
    setError(null)
    try {
      const response = await acceptanceActsApi.createAcceptanceAct(projectId)
      setAct(response.data)
      onUpdate?.()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Не удалось создать акт приёмки")
      }
    }
  }

  const handleSign = async () => {
    if (!act) return
    setSigning(true)
    setError(null)
    try {
      const response = await acceptanceActsApi.signAcceptanceAct(act.id, {
        signedById: me?.id || "system",
        signMethod,
      })
      setAct(response.data)
      setSignOpen(false)
      onUpdate?.()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Не удалось подписать акт")
      }
    } finally {
      setSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={fetchAct}>
          Попробовать снова
        </Button>
      </div>
    )
  }

  // Акт ещё не создан
  if (!act) {
    return (
      <div className="text-center py-6">
        <FileCheck className="size-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Акт приёмки не создан</p>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          {SIGNER_TYPE_LABEL[expectedSignerType]}
        </p>
        <Button size="sm" onClick={handleCreate}>
          Создать акт приёмки
        </Button>
      </div>
    )
  }

  const isSigned = act.status === "signed"

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">Акт #{act.number}</span>
          <Badge variant={isSigned ? "secondary" : "outline"}>
            {isSigned ? "Подписан" : "Черновик"}
          </Badge>
          {act.signerType && (
            <Badge variant="outline">
              {act.signerType === "legal" ? "Юрлицо" : "Физлицо"}
            </Badge>
          )}
        </div>
        {!isSigned && (
          <Dialog open={signOpen} onOpenChange={setSignOpen}>
            <DialogTrigger
              render={
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Check className="size-3 mr-1" />
                  Подписать акт
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Подписать акт приёмки</DialogTitle>
                <DialogDescription>
                  {SIGNER_TYPE_LABEL[act.signerType || expectedSignerType]}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 py-2">
                <label className="text-sm font-medium">Способ подписи</label>
                <Select value={signMethod} onValueChange={(v) => setSignMethod((v ?? "paper") as AcceptanceSignMethod)} items={{ paper: "Бумага", edo: "ЭДО" }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paper">Бумага</SelectItem>
                    <SelectItem value="edo">ЭДО</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSignOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={handleSign} disabled={signing} className="bg-green-600 hover:bg-green-700">
                  {signing ? "Подписываем..." : "Подписать"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {isSigned && act.signedAt && (
          <span>Подписан: {new Date(act.signedAt).toLocaleDateString("ru-RU")}</span>
        )}
        {act.signMethod && (
          <span>Способ: {act.signMethod === "edo" ? "ЭДО" : "Бумага"}</span>
        )}
        {act.SignedBy && <span>Подписал: {act.SignedBy.name}</span>}
      </div>

      {act.notes && <p className="text-xs text-muted-foreground">{act.notes}</p>}

      {!isSigned && (
        <p className="text-xs text-muted-foreground">
          {SIGNER_TYPE_LABEL[act.signerType || expectedSignerType]}
        </p>
      )}
    </div>
  )
}
