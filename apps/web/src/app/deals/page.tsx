"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCwIcon } from "lucide-react"
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

  // Fetch pipeline and its stages from the pipeline API
  const fetchPipeline = useCallback(async () => {
    try {
      const pipelinesResponse = await pipelinesApi.getPipelines()
      if (pipelinesResponse.data.length === 0) {
        console.warn("No active pipelines found")
        return null
      }

      // Use the first active pipeline
      const pipeline = pipelinesResponse.data[0]
      setPipelineId(pipeline.id)

      // Fetch pipeline with stages
      const pipelineWithStages = await pipelinesApi.getPipeline(pipeline.id)
      setStages(pipelineWithStages.data.DealStage)

      return pipeline.id
    } catch (err) {
      console.warn("Failed to fetch pipeline, falling back to default:", err)
      // Fallback to hardcoded ID if API fails
      setPipelineId("default-pipeline-id")
      return null
    }
  }, [])

  const fetchDeals = useCallback(
    async (status: StatusFilter) => {
      setLoading(true)
      setError(null)
      try {
        // First fetch pipeline to get stages
        const fetchedPipelineId = await fetchPipeline()
        if (!fetchedPipelineId && !pipelineId) {
          // If pipeline fetch failed, still try to load deals
          console.warn("Pipeline not loaded, loading deals anyway")
        }

        // Then fetch deals
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
          setError("Failed to load deals. Please try again.")
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
      // For now, use a dummy user ID - in real app this comes from session
      const response = await dealsApi.moveDeal(dealId, {
        stageId: toStageId,
        changedBy: currentUserId, // TODO: Get from auth session
      })

      // Update local state with the full deal from API (includes relations)
      setDeals((prev) =>
        prev.map((deal) =>
          deal.id === dealId ? response.data : deal
        )
      )
    } catch (err) {
      console.error("Failed to move deal:", err)
      // Refetch to restore correct state from server
      fetchDeals(statusFilter)
    } finally {
      setMovingDealId(null)
    }
  }

  const handleRetry = () => {
    fetchDeals(statusFilter)
  }

  // Get first stage for creating new deals
  const firstStageId = stages.length > 0 ? stages[0].id : ""
  // TODO: Get from auth session when implemented
  const currentUserId = "current-user-id"

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Сделки</h1>
        {firstStageId && (
          <CreateDealModal
            pipelineId={pipelineId}
            firstStageId={firstStageId}
            onCreate={() => fetchDeals(statusFilter)}
          />
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <FilterBar
            statusFilter={statusFilter}
            onStatusChange={(value) => setStatusFilter(value as StatusFilter)}
            onRefresh={() => fetchDeals(statusFilter)}
            loading={loading}
          />
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading deals...</span>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={handleRetry}>
                <RefreshCwIcon className="size-4" />
                <span className="ml-1.5">Retry</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && stages.length > 0 && (
        <KanbanBoard
          deals={deals}
          stages={stages}
          onMoveDeal={handleMoveDeal}
        />
      )}

      {!loading && !error && stages.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              No pipeline stages found. Please run the seed script.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
