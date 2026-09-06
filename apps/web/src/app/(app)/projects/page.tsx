"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Package, Trash2 } from "lucide-react"

import { projectsApi, ApiClientError } from "@/lib/api/projects"
import { bomApi } from "@/lib/api/bom"
import type { ProjectData } from "@/lib/api/types"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EntitySearchSelect } from "@/components/ui/entity-search-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CreateProjectModal } from "@/components/projects/create-project-modal"
import { useMe } from "@/components/layout/use-me"

type StatusFilter = "all" | "lead" | "active" | "completed" | "paused"

function formatCurrency(amount: number | null | undefined, currency: string = "RUB"): string {
  if (amount == null) return "—"
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currency,
  }).format(amount)
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("ru-RU")
}

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "active":
      return "default"
    case "completed":
      return "secondary"
    case "lead":
      return "outline"
    case "paused":
      return "outline"
    default:
      return "outline"
  }
}

function getManagerName(project: ProjectData): string {
  if (!project.manager) return "—"
  return project.manager.name || project.manager.email || "—"
}

function getContactName(project: ProjectData): string {
  if (!project.contact) return "—"
  if (project.contact.type === "company") {
    return project.contact.companyName || "—"
  }
  return [project.contact.lastName, project.contact.firstName]
    .filter(Boolean)
    .join(" ") || "—"
}

export default function ProjectsPage() {  const [projects, setProjects] = useState<ProjectData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [managerFilter, setManagerFilter] = useState<string>("all")
  const [coverageMap, setCoverageMap] = useState<Record<string, { total: number; covered: number; bomStatus: string }>>({})
  const { isAdmin } = useMe()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  type CoverageInfo = { total: number; covered: number; bomStatus: string }

  // Fetch BOM coverage for all projects (batch — один запрос вместо N+1)
  useEffect(() => {
    if (projects.length === 0) return
    let cancelled = false

    const fetchCoverage = async () => {
      try {
        const res = await bomApi.getCoverage(projects.map((p) => p.id))
        if (!cancelled) setCoverageMap(res.data ?? {})
      } catch {
        // Ошибка загрузки покрытия — оставляем пустую карту (не блокируем список).
        if (!cancelled) setCoverageMap({})
      }
    }

    fetchCoverage()
    return () => { cancelled = true }
  }, [projects])

  function getCoverageBadge(info?: CoverageInfo) {
    if (!info || info.bomStatus === "none") {
      return <Badge variant="outline" className="text-muted-foreground">Нет спецификации</Badge>
    }
    if (info.bomStatus === "draft") {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:bg-yellow-950">Черновик</Badge>
    }
    if (info.bomStatus === "locked") {
      if (info.total === 0) {
        return <Badge variant="outline" className="text-muted-foreground">Пустая</Badge>
      }
      // For locked BOMs without PR fetch, show as "Заблокирована"
      return <Badge variant="secondary" className="text-blue-600 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950">
        <Package className="size-3 mr-1" />
        Заблокирована
      </Badge>
    }
    return <Badge variant="outline">{info.bomStatus}</Badge>
  }

  const fetchProjects = useCallback(async (status: StatusFilter, managerId: string) => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string> = {}
      if (status !== "all") params.status = status
      if (managerId !== "all") params.managerId = managerId

      const response = await projectsApi.getProjects(
        Object.keys(params).length > 0 ? params : undefined
      )

      setProjects(response.data)
    } catch (err) {
      if (err instanceof ApiClientError) {
        console.error("[Projects] API error:", err.message)
        setError(err.message)
      } else {
        console.error("[Projects] Unexpected error:", err)
        setError("Не удалось загрузить проекты. Пожалуйста, попробуйте снова.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects(statusFilter, managerFilter)
  }, [statusFilter, managerFilter, fetchProjects])

  const handleRetry = () => {
    fetchProjects(statusFilter, managerFilter)
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.size === projects.length ? new Set() : new Set(projects.map((p) => p.id))
    )
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Удалить проект?")) return
    setDeleting(true)
    try {
      await projectsApi.deleteProject(id)
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      await fetchProjects(statusFilter, managerFilter)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось удалить проект.")
    } finally {
      setDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    if (!confirm(`Удалить выбранные проекты (${ids.length})?`)) return
    setDeleting(true)
    try {
      for (const id of ids) {
        await projectsApi.deleteProject(id)
      }
      setSelected(new Set())
      await fetchProjects(statusFilter, managerFilter)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось удалить все проекты.")
    } finally {
      setDeleting(false)
    }
  }

  const handleProjectCreated = (project: any) => {
    void project
    fetchProjects(statusFilter, managerFilter)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Проекты</h1>
        <CreateProjectModal onCreate={handleProjectCreated} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Статус</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  if (value) setStatusFilter(value as StatusFilter)
                }}
                items={{ all: "Все статусы", lead: "Лид", active: "Активный", completed: "Завершён", paused: "Пауза" }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="lead">Лид</SelectItem>
                    <SelectItem value="active">Активный</SelectItem>
                    <SelectItem value="completed">Завершён</SelectItem>
                    <SelectItem value="paused">Пауза</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Менеджер</label>
              <EntitySearchSelect
                type="user"
                value={managerFilter === "all" ? null : managerFilter}
                onValueChange={(v) => setManagerFilter(v ?? "all")}
                placeholder="Все менеджеры"
                className="w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b last:border-b-0 px-4 py-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <ErrorState message={error} onRetry={handleRetry} />
      )}

      {!loading && !error && projects.length === 0 && (
        <EmptyState
          title="Проекты не найдены"
          description="Создайте проект вручную или конвертируйте сделку в проект."
        />
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          {isAdmin && (
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40">
              <span className="text-sm text-muted-foreground">
                {selected.size > 0 ? `Выбрано: ${selected.size}` : "Выберите проекты"}
              </span>
              <Button
                variant="destructive"
                size="sm"
                disabled={selected.size === 0 || deleting}
                onClick={handleBulkDelete}
              >
                <Trash2 className="size-4" />
                <span className="ml-1.5">{deleting ? "Удаление..." : "Удалить выбранные"}</span>
              </Button>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && (
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={projects.length > 0 && selected.size === projects.length}
                      onChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>Номер</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Менеджер</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Дата начала</TableHead>
                <TableHead>Дата окончания</TableHead>
                <TableHead>Сумма контракта</TableHead>
                <TableHead>Спецификация</TableHead>
                {isAdmin && <TableHead className="w-10"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  {isAdmin && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(project.id)}
                        onChange={() => toggleSelect(project.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-mono text-xs">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-primary hover:underline"
                    >
                      {project.externalNumber || "—"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(project.status)}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{getManagerName(project)}</TableCell>
                  <TableCell>{getContactName(project)}</TableCell>
                  <TableCell>{formatDate(project.startDate)}</TableCell>
                  <TableCell>{formatDate(project.endDate)}</TableCell>
                  <TableCell>{formatCurrency(Number(project.contractAmount), project.currency || "RUB")}</TableCell>
                  <TableCell>{getCoverageBadge(coverageMap[project.id])}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProject(project.id)}
                        disabled={deleting}
                        title="Удалить проект"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
