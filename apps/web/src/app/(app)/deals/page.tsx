"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCwIcon, Plus, Search, Star, Trash2 } from "lucide-react"
import { dealsApi, ApiClientError } from "@/lib/api/deals"
import { pipelinesApi } from "@/lib/api/pipelines"
import type { DealData, DealStageData } from "@/lib/api/types"
import { KanbanBoard } from "@/components/deals/kanban-board"
import { FilterBar } from "@/components/deals/filter-bar"
import { CreateDealModal } from "@/components/deals/create-deal-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LOSS_REASONS } from "@/lib/loss-reasons"
import { useMe } from "@/components/layout/use-me"

type StatusFilter = "all" | "open" | "closed"

export default function DealsPage() {
  const { me, isAdmin } = useMe()
  const [deals, setDeals] = useState<DealData[]>([])
  const [stages, setStages] = useState<DealStageData[]>([])
  const [pipelineId, setPipelineId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [movingDealId, setMovingDealId] = useState<string | null>(null)
  const [lossDialog, setLossDialog] = useState<{
    dealId: string
    toStageId: string
    title: string
  } | null>(null)
  const [lossReason, setLossReason] = useState("")

  // ── Сохранённые представления (localStorage) ──
  const [search, setSearch] = useState("")
  const [savedViews, setSavedViews] = useState<{ name: string; status: StatusFilter; search: string }[]>([])
  const [activeView, setActiveView] = useState("")

  useEffect(() => {
    try {
      const raw = localStorage.getItem("deals_saved_views")
      if (raw) setSavedViews(JSON.parse(raw))
    } catch {
      /* ignore */
    }
  }, [])

  const persistViews = (views: { name: string; status: StatusFilter; search: string }[]) => {
    setSavedViews(views)
    try {
      localStorage.setItem("deals_saved_views", JSON.stringify(views))
    } catch {
      /* ignore */
    }
  }

  const saveView = () => {
    const name = window.prompt("Название представления:", "")
    if (!name || !name.trim()) return
    const view = { name: name.trim(), status: statusFilter, search }
    persistViews([...savedViews.filter((v) => v.name !== view.name), view])
    setActiveView(view.name)
  }

  const applyView = (name: string) => {
    const v = savedViews.find((x) => x.name === name)
    if (!v) return
    setStatusFilter(v.status)
    setSearch(v.search)
    setActiveView(name)
  }

  const deleteView = () => {
    if (!activeView) return
    if (!window.confirm(`Удалить представление «${activeView}»?`)) return
    persistViews(savedViews.filter((v) => v.name !== activeView))
    setActiveView("")
  }

  const filteredDeals = search.trim()
    ? deals.filter((d) => `${d.title} ${d.number ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()))
    : deals

  const fetchPipeline = useCallback(async () => {
    try {
      const pipelinesResponse = await pipelinesApi.getPipelines()
      if (pipelinesResponse.data.length === 0) {
        console.warn("No active pipelines found")
        return null
      }
      const pipeline = pipelinesResponse.data[0]
      setPipelineId(pipeline.id)
      const pipelineWithStages = await pipelinesApi.getPipeline(pipeline.id)
      setStages(pipelineWithStages.data.DealStage)
      return pipeline.id
    } catch (err) {
      console.warn("Failed to fetch pipeline, falling back to default:", err)
      setPipelineId("default-pipeline-id")
      return null
    }
  }, [])

  const fetchDeals = useCallback(
    async (status: StatusFilter) => {
      setLoading(true)
      setError(null)
      try {
        const fetchedPipelineId = await fetchPipeline()
        if (!fetchedPipelineId && !pipelineId) {
          console.warn("Pipeline not loaded, loading deals anyway")
        }
        const params: Record<string, string> = {}
        if (status !== "all") params.status = status
        const response = await dealsApi.getDeals(
          Object.keys(params).length > 0 ? params : undefined
        )
        setDeals(response.data)
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message)
        } else {
          setError("Не удалось загрузить сделки. Пожалуйста, попробуйте снова.")
        }
      } finally {
        setLoading(false)
      }
    },
    [fetchPipeline, pipelineId]
  )

  useEffect(() => {
    fetchDeals(statusFilter)
  }, [statusFilter, fetchDeals])

  const doMoveDeal = async (dealId: string, toStageId: string, lossReason?: string) => {
    setMovingDealId(dealId)
    try {
      const response = await dealsApi.moveDeal(dealId, {
        stageId: toStageId,
        changedBy: me?.id ?? "",
        ...(lossReason ? { lossReason } : {}),
      })
      setDeals((prev) =>
        prev.map((deal) =>
          deal.id === dealId ? response.data : deal
        )
      )
    } catch (err) {
      // «Уже на этой стадии» — не ошибка (гонка перетаскивания), тихо обновляем.
      if (!(err instanceof ApiClientError && err.statusCode === 400 && /already in the target stage/i.test(err.message))) {
        console.error("Failed to move deal:", err)
      }
      fetchDeals(statusFilter)
    } finally {
      setMovingDealId(null)
    }
  }

  const handleMoveDeal = async (dealId: string, toStageId: string) => {
    // Защита от лишнего запроса: сделка уже на этой стадии — ничего не делаем.
    const existing = deals.find((d) => d.id === dealId)
    if (existing?.stageId === toStageId) {
      return
    }

    // Перемещение в «проигранную» стадию требует причину отказа.
    const targetStage = stages.find((s) => s.id === toStageId)
    if (targetStage?.isLostStage) {
      setLossReason("")
      setLossDialog({ dealId, toStageId, title: existing?.title ?? "Сделка" })
      return
    }

    await doMoveDeal(dealId, toStageId)
  }

  const confirmLossMove = async () => {
    if (!lossDialog || !lossReason) return
    const { dealId, toStageId } = lossDialog
    setLossDialog(null)
    await doMoveDeal(dealId, toStageId, lossReason)
  }

  const handleRetry = () => {
    fetchDeals(statusFilter)
  }

  const firstStageId = stages.length > 0 ? stages[0].id : ""

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Загрузка сделок...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={handleRetry}>
          <RefreshCwIcon className="size-4" />
          <span className="ml-1.5">Повторить</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Сделки</h1>
          <FilterBar
            statusFilter={statusFilter}
            onStatusChange={(value) => setStatusFilter(value as StatusFilter)}
            onRefresh={() => fetchDeals(statusFilter)}
            loading={loading}
          />
          <div className="relative">
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по сделке…"
              className="pl-8 w-48"
            />
          </div>
          <Button variant="outline" size="sm" onClick={saveView}>
            <Star className="size-4" />
            <span className="ml-1.5">Сохранить</span>
          </Button>
          {savedViews.length > 0 && (
            <select
              value={activeView}
              onChange={(e) => e.target.value && applyView(e.target.value)}
              className="rounded-md border bg-transparent px-2 py-1.5 text-sm"
            >
              <option value="">Представления…</option>
              {savedViews.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          )}
          {activeView && (
            <Button variant="ghost" size="icon" onClick={deleteView} title="Удалить представление">
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
        {/* Создание сделок — только администратор */}
        {firstStageId && isAdmin && (
          <CreateDealModal
            pipelineId={pipelineId}
            firstStageId={firstStageId}
            onCreate={() => fetchDeals(statusFilter)}
          />
        )}
      </div>

      {/* Kanban — fills remaining height */}
      <div className="flex-1 min-h-0 px-6 pb-4">
        {stages.length > 0 ? (
          <KanbanBoard
            deals={filteredDeals}
            stages={stages}
            onMoveDeal={handleMoveDeal}
          />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground py-8">
                Этапы воронки не найдены. Пожалуйста, запустите скрипт начального заполнения.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Диалог причины проигрыша при переносе в «проигранную» стадию */}
      <AlertDialog open={!!lossDialog} onOpenChange={() => setLossDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сделка проиграна</AlertDialogTitle>
            <AlertDialogDescription>
              Укажите причину отказа для сделки «{lossDialog?.title}».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <Select
              value={lossReason}
              onValueChange={(value) => setLossReason(value ?? "")}
              items={Object.fromEntries(
                LOSS_REASONS.map((r) => [r.code, r.label])
              )}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите причину..." />
              </SelectTrigger>
              <SelectContent>
                {LOSS_REASONS.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <Button onClick={confirmLossMove} disabled={!lossReason}>
              Переместить
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
