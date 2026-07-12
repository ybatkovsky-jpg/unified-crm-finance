"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCwIcon, Plus } from "lucide-react"
import { dealsApi, ApiClientError } from "@/lib/api/deals"
import { pipelinesApi } from "@/lib/api/pipelines"
import type { DealData, DealStageData } from "@/lib/api/types"
import { KanbanBoard } from "@/components/deals/kanban-board"
import { FilterBar } from "@/components/deals/filter-bar"
import { CreateDealModal } from "@/components/deals/create-deal-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type StatusFilter = "all" | "open" | "closed"

export default function DealsPage() {
  const [deals, setDeals] = useState<DealData[]>([])
  const [stages, setStages] = useState<DealStageData[]>([])
  const [pipelineId, setPipelineId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [movingDealId, setMovingDealId] = useState<string | null>(null)

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

  const handleMoveDeal = async (dealId: string, toStageId: string) => {
    setMovingDealId(dealId)
    try {
      const response = await dealsApi.moveDeal(dealId, {
        stageId: toStageId,
        changedBy: currentUserId,
      })
      setDeals((prev) =>
        prev.map((deal) =>
          deal.id === dealId ? response.data : deal
        )
      )
    } catch (err) {
      console.error("Failed to move deal:", err)
      fetchDeals(statusFilter)
    } finally {
      setMovingDealId(null)
    }
  }

  const handleRetry = () => {
    fetchDeals(statusFilter)
  }

  const firstStageId = stages.length > 0 ? stages[0].id : ""
  const currentUserId = "current-user-id"

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
        </div>
        {firstStageId && (
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
            deals={deals}
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
    </div>
  )
}
