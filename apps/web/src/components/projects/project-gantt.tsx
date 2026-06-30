"use client"

import { useEffect, useRef, useState } from "react"
import { Timeline } from "vis-timeline/standalone"
import { DataSet } from "vis-data/peer"
import type { ProjectStageData } from "@/lib/api/types"
import { projectsApi } from "@/lib/api/projects"

interface ProjectGanttProps {
  projectId: string
  stages: ProjectStageData[]
}

function getStageStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "#22c55e"
    case "active":
      return "#3b82f6"
    case "pending":
      return "#94a3b8"
    case "blocked":
      return "#ef4444"
    default:
      return "#94a3b8"
  }
}

export function ProjectGantt({ projectId, stages }: ProjectGanttProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const timelineInstance = useRef<any>(null)
  const itemsDataSet = useRef<DataSet<any> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!timelineRef.current || stages.length === 0) return

    console.log("[ProjectGantt] Initializing timeline with", stages.length, "stages")

    // Convert stages to vis-timeline items
    const items = new DataSet(
      stages.map((stage) => ({
        id: stage.id,
        content: stage.name,
        start: stage.startDate ? new Date(stage.startDate) : new Date(),
        end: stage.endDate ? new Date(stage.endDate) : new Date(),
        className: `stage-status-${stage.status || "pending"}`,
        title: `${stage.name} (${stage.code})\nStatus: ${stage.status || "pending"}`,
      }))
    )
    itemsDataSet.current = items

    // Configure timeline options for day-level zoom
    const options = {
      height: "300px",
      min: new Date(Math.min(...stages.map((s) => s.startDate ? new Date(s.startDate).getTime() : Date.now())) - 7 * 24 * 60 * 60 * 1000),
      max: new Date(Math.max(...stages.map((s) => s.endDate ? new Date(s.endDate).getTime() : Date.now())) + 7 * 24 * 60 * 60 * 1000),
      zoomMin: 1000 * 60 * 60 * 24, // 1 day in milliseconds
      zoomMax: 1000 * 60 * 60 * 24 * 30, // 30 days in milliseconds
      moveable: true,
      zoomable: true,
      start: new Date(Math.min(...stages.map((s) => s.startDate ? new Date(s.startDate).getTime() : Date.now()))),
      end: new Date(Math.max(...stages.map((s) => s.endDate ? new Date(s.endDate).getTime() : Date.now()))),
      editable: {
        time: true,
        updateTime: true,
        move: true,
      },
      onMoving: (item: any, callback: (item: any) => void) => {
        console.log("[ProjectGantt] Drag start:", item.id)
        callback(item)
      },
      onMove: (item: any, callback: (item: any) => void) => {
        console.log("[ProjectGantt] Drag move:", item.id, item.start, item.end)
        callback(item)
      },
    }

    try {
      const timeline = new Timeline(timelineRef.current, items, options)
      timelineInstance.current = timeline

      // Handle item move (drag-drop) event
      timeline.on("itemMoved", async (properties: any) => {
        const { item, start, end } = properties
        console.log("[ProjectGantt] Stage dragged:", item.id, "new dates:", start, end)

        setLoading(true)
        setError(null)

        try {
          await projectsApi.updateStage(projectId, item.id as string, {
            startDate: start instanceof Date ? start.toISOString() : String(start),
            endDate: end instanceof Date ? end.toISOString() : String(end),
          })
          console.log("[ProjectGantt] Stage updated successfully")
        } catch (err) {
          console.error("[ProjectGantt] Failed to update stage:", err)
          setError(err instanceof Error ? err.message : "Не удалось обновить этап")
          // Revert the move on error
          if (itemsDataSet.current) {
            const originalItem = stages.find(s => s.id === item.id)
            if (originalItem) {
              itemsDataSet.current.update({
                id: item.id,
                start: originalItem.startDate ? new Date(originalItem.startDate) : new Date(),
                end: originalItem.endDate ? new Date(originalItem.endDate) : new Date(),
              })
            }
          }
        } finally {
          setLoading(false)
        }
      })
    } catch (err) {
      console.error("[ProjectGantt] Failed to initialize timeline:", err)
      setError("Не удалось инициализировать временную шкалу")
    }

    return () => {
      if (timelineInstance.current) {
        timelineInstance.current.destroy()
        timelineInstance.current = null
      }
      if (itemsDataSet.current) {
        itemsDataSet.current = null
      }
    }
  }, [projectId, stages])

  // Inject CSS for stage status colors
  useEffect(() => {
    const styleId = "project-gantt-styles"
    if (document.getElementById(styleId)) return

    const style = document.createElement("style")
    style.id = styleId
    style.textContent = `
      .vis-item .vis-item-content {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      }
      .vis-item.stage-status-completed {
        background-color: ${getStageStatusColor("completed")} !important;
        border-color: ${getStageStatusColor("completed")} !important;
        color: white;
      }
      .vis-item.stage-status-active {
        background-color: ${getStageStatusColor("active")} !important;
        border-color: ${getStageStatusColor("active")} !important;
        color: white;
      }
      .vis-item.stage-status-pending {
        background-color: ${getStageStatusColor("pending")} !important;
        border-color: ${getStageStatusColor("pending")} !important;
        color: white;
      }
      .vis-item.stage-status-blocked {
        background-color: ${getStageStatusColor("blocked")} !important;
        border-color: ${getStageStatusColor("blocked")} !important;
        color: white;
      }
    `
    document.head.appendChild(style)

    return () => {
      const existing = document.getElementById(styleId)
      if (existing) existing.remove()
    }
  }, [])

  if (!stages || stages.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        Нет этапов
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div ref={timelineRef} className="border rounded-lg" />
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block size-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
          Сохранение изменений...
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}
