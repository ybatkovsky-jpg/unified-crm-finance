"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon } from "lucide-react"

import { projectsApi, ApiClientError } from "@/lib/api/projects"
import type { ProjectData } from "@/lib/api/types"
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
  if (amount == null) return "\u2014"
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currency,
  }).format(amount)
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "\u2014"
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
  if (!project.manager) return "\u2014"
  return project.manager.name || project.manager.email || "\u2014"
}

function getContactName(project: ProjectData): string {
  if (!project.contact) return "\u2014"
  if (project.contact.type === "company") {
    return project.contact.companyName || "\u2014"
  }
  return [project.contact.lastName, project.contact.firstName]
    .filter(Boolean)
    .join(" ") || "\u2014"
}

type ManagerOption = {
  id: string
  name: string
}

function extractManagerOptions(projects: ProjectData[]): ManagerOption[] {
  const managersMap = new Map<string, ManagerOption>()

  for (const project of projects) {
    if (project.manager) {
      const name = project.manager.name || project.manager.email || `\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C ${project.manager.id}`

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
        setError("Failed to load projects. Please try again.")
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
        <h1 className="text-2xl font-semibold">\u041F\u0440\u043E\u0435\u043A\u0442\u044B</h1>
        <CreateProjectModal onCreate={handleProjectCreated} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">\u0421\u0442\u0430\u0442\u0443\u0441</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  if (value) setStatusFilter(value as StatusFilter)
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="\u0412\u0441\u0435 \u0441\u0442\u0430\u0442\u0443\u0441\u044B" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">\u0412\u0441\u0435 \u0441\u0442\u0430\u0442\u0443\u0441\u044B</SelectItem>
                    <SelectItem value="lead">\u041B\u0438\u0434</SelectItem>
                    <SelectItem value="active">\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0439</SelectItem>
                    <SelectItem value="completed">\u0417\u0430\u0432\u0435\u0440\u0448\u0451\u043D</SelectItem>
                    <SelectItem value="paused">\u041F\u0430\u0443\u0437\u0430</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">\u041C\u0435\u043D\u0435\u0434\u0436\u0435\u0440</label>
              <Select
                value={managerFilter}
                onValueChange={(value) => {
                  if (value) setManagerFilter(value)
                }}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="\u0412\u0441\u0435 \u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440\u044B" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">\u0412\u0441\u0435 \u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440\u044B</SelectItem>
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
          <span className="ml-2 text-muted-foreground">Loading projects...</span>
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

      {!loading && !error && projects.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              No projects found
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>\u041D\u043E\u043C\u0435\u0440</TableHead>
                <TableHead>\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435</TableHead>
                <TableHead>\u0421\u0442\u0430\u0442\u0443\u0441</TableHead>
                <TableHead>\u041C\u0435\u043D\u0435\u0434\u0436\u0435\u0440</TableHead>
                <TableHead>\u041A\u043B\u0438\u0435\u043D\u0442</TableHead>
                <TableHead>\u0414\u0430\u0442\u0430 \u043D\u0430\u0447\u0430\u043B\u0430</TableHead>
                <TableHead>\u0414\u0430\u0442\u0430 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F</TableHead>
                <TableHead>\u0421\u0443\u043C\u043C\u0430 \u043A\u043E\u043D\u0442\u0440\u0430\u043A\u0442\u0430</TableHead>
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
                      {project.externalNumber || "\u2014"}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
