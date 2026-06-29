"use client"

import { useState } from "react"
import { CheckCircle2, Play, Loader2, AlertCircle } from "lucide-react"
import { projectsApi, ApiClientError } from "@/lib/api/projects"
import type { ProjectStageData } from "@/lib/api/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  projectId: string
  stages: ProjectStageData[]
  onUpdate: () => void
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  active: "В работе",
  completed: "Завершён",
  blocked: "Заблокирован",
}

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "completed": return "default"
    case "active": return "secondary"
    case "blocked": return "destructive"
    default: return "outline"
  }
}

export function StageManager({ projectId, stages, onUpdate }: Props) {
  const [updatingStageId, setUpdatingStageId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSetStage = async (stageId: string, newStatus: string) => {
    setUpdatingStageId(stageId)
    setError(null)
    try {
      await projectsApi.updateProjectStage(projectId, stageId, {
        status: newStatus,
        ...(newStatus === "completed" ? { completedAt: new Date().toISOString() } : {}),
      } as any)
      onUpdate()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось обновить стадию")
    } finally {
      setUpdatingStageId(null)
    }
  }

  const sortedStages = [...stages].sort((a, b) => a.order - b.order)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Управление стадиями
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 flex items-center gap-1.5 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
            <AlertCircle className="size-3.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-2">
          {sortedStages.map((stage, index) => {
            const isUpdating = updatingStageId === stage.id
            const isPending = stage.status === "pending"
            const isActive = stage.status === "active"
            const isCompleted = stage.status === "completed"
            const canActivate = isPending && (index === 0 || sortedStages[index - 1]?.status === "completed")
            const canComplete = isActive

            return (
              <div
                key={stage.id}
                className={`flex items-center justify-between rounded-md border p-3 transition-colors ${
                  isCompleted ? "border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20" :
                  isActive ? "border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20" :
                  "border-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-6 text-right">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{stage.name}</p>
                    {stage.code && (
                      <p className="text-xs text-muted-foreground">{stage.code}</p>
                    )}
                  </div>
                  <Badge variant={getStatusVariant(stage.status)}>
                    {STATUS_LABELS[stage.status] ?? stage.status}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  {canActivate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetStage(stage.id, "active")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <>
                          <Play className="size-3.5" />
                          <span className="ml-1">Начать</span>
                        </>
                      )}
                    </Button>
                  )}
                  {canComplete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetStage(stage.id, "completed")}
                      disabled={isUpdating}
                      className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950"
                    >
                      {isUpdating ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="size-3.5" />
                          <span className="ml-1">Завершить</span>
                        </>
                      )}
                    </Button>
                  )}
                  {isCompleted && (
                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="size-3" />
                      {stage.completedAt
                        ? new Date(stage.completedAt).toLocaleDateString("ru-RU")
                        : "Завершён"}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
