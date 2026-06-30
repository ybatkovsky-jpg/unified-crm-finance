"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon, Package } from "lucide-react"

import { projectsApi, ApiClientError } from "@/lib/api/projects"
import { bomApi } from "@/lib/api/bom"
import type { ProjectData, BOMData } from "@/lib/api/types"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CreateProjectModal } from "@/components/projects/create-project-modal"

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

type ManagerOption = {
  id: string
  name: string
}

function extractManagerOptions(projects: ProjectData[]): ManagerOption[] {
  const managersMap = new Map<string, ManagerOption>()

  for (const project of projects) {
    if (project.manager) {
      const name = project.manager.name || project.manager.email || `Пользователь ${project.manager.id}`

      if (!managersMap.has(project.manager.id)) {
        managersMap.set(project.manager.id, { id: project.manager.id, name })
      }
    }
  }

  return Array.from(managersMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [managerOptions, setManagerOptions] = useState<ManagerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [managerFilter, setManagerFilter] = useState<string>("all")
  const [coverageMap, setCoverageMap] = useState<Record<string, { total: number; covered: number; bomStatus: string }>>({})

  type CoverageInfo = { total: number; covered: number; bomStatus: string }

  // Fetch BOM coverage for all projects
  useEffect(() => {
    if (projects.length === 0) return
    let cancelled = false

    const fetchCoverage = async () => {
      const map: Record<string, CoverageInfo> = {}
      await Promise.all(
        projects.map(async (p) => {
          try {
            // Try to get BOM for the project
            const bomRes = await bomApi.getBOM(p.id)
            const bom: BOMData = bomRes.data
            const items = bom.items ?? []
            // Count covered items (those that appear in any PurchaseRequest)
            // For the list, we use a simpler check: does BOM exist and is it locked?
            // We set total to item count and mark as covered if BOM is locked
            map[p.id] = {
              total: items.length,
              covered: bom.status === "locked" ? items.length : 0,
              bomStatus: bom.status,
            }
          } catch {
            // No BOM for this project
            map[p.id] = { total: 0, covered: 0, bomStatus: "none" }
          }
        })
      )
      if (!cancelled) setCoverageMap(map)
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

      const startTime = performance.now()
      const response = await projectsApi.getProjects(
        Object.keys(params).length > 0 ? params : undefined
      )
      const duration = performance.now() - startTime

      console.log(`[Projects] Fetched ${response.data.length} projects in ${duration.toFixed(2)}ms`)

      setProjects(response.data)
      setManagerOptions(extractManagerOptions(response.data))
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

  const handleProjectCreated = (project: any) => {
    console.log("[Projects] Project created:", project)
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
              <Select
                value={managerFilter}
                onValueChange={(value) => {
                  if (value) setManagerFilter(value)
                }}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Все менеджеры" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Все менеджеры</SelectItem>
                    {managerOptions.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Загрузка проектов...</span>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={handleRetry}>
                <RefreshCwIcon className="size-4" />
                <span className="ml-1.5">Повторить</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && projects.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              Проекты не найдены
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Менеджер</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Дата начала</TableHead>
                <TableHead>Дата окончания</TableHead>
                <TableHead>Сумма контракта</TableHead>
                <TableHead>Спецификация</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
