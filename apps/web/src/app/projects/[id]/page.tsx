"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit2, Save, X, Link as LinkIcon, Calendar, User, DollarSign, Building2, FileText, Users, Layers, Package } from "lucide-react"
import { projectsApi, ApiClientError } from "@/lib/api/projects"
import type { ProjectData } from "@/lib/api/types"
import { ProjectGantt } from "@/components/projects/project-gantt"
import { ProductionList } from "@/components/projects/production-list"
import { CreateProductionModal } from "@/components/projects/create-production-modal"
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

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "\u2014"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("ru-RU")
}

function formatCurrency(amount: number | null | undefined, currency: string = "RUB"): string {
  if (amount == null) return "\u2014"
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currency,
  }).format(amount)
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

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [project, setProject] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [productionRefresh, setProductionRefresh] = useState(0)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    externalNumber: "",
    description: "",
    status: "lead",
    contractAmount: "",
    currency: "RUB",
    startDate: "",
    endDate: "",
    marginTarget: "",
  })

  const unwrapParams = useCallback(async () => {
    return await params
  }, [params])

  const fetchProject = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const startTime = performance.now()
      const response = await projectsApi.getProject(id)
      const duration = performance.now() - startTime

      console.log(`[ProjectDetail] Fetched project in ${duration.toFixed(2)}ms`)

      setProject(response.data)
      setEditForm({
        name: response.data.name,
        externalNumber: response.data.externalNumber || "",
        description: response.data.description || "",
        status: response.data.status,
        contractAmount: response.data.contractAmount?.toString() || "",
        currency: response.data.currency || "RUB",
        startDate: response.data.startDate
          ? new Date(response.data.startDate).toISOString().split('T')[0]
          : "",
        endDate: response.data.endDate
          ? new Date(response.data.endDate).toISOString().split('T')[0]
          : "",
        marginTarget: response.data.marginTarget?.toString() || "",
      })
    } catch (err) {
      if (err instanceof ApiClientError) {
        console.error("[ProjectDetail] API error:", err.message)
        setError(err.message)
      } else {
        console.error("[ProjectDetail] Unexpected error:", err)
        setError("Failed to load project. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    unwrapParams().then(({ id }) => {
      fetchProject(id)
    })
  }, [unwrapParams, fetchProject])

  const handleSave = async () => {
    if (!project) return

    setSaving(true)
    setError(null)

    try {
      const response = await projectsApi.updateProject(project.id, {
        name: editForm.name,
        externalNumber: editForm.externalNumber || undefined,
        description: editForm.description || undefined,
        status: editForm.status,
        contractAmount: parseFloat(editForm.contractAmount) || undefined,
        currency: editForm.currency,
        startDate: editForm.startDate || undefined,
        endDate: editForm.endDate || undefined,
        marginTarget: parseFloat(editForm.marginTarget) || undefined,
      })

      setProject(response.data)
      setIsEditing(false)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to save project. Please try again.")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (project) {
      setEditForm({
        name: project.name,
        externalNumber: project.externalNumber || "",
        description: project.description || "",
        status: project.status,
        contractAmount: project.contractAmount?.toString() || "",
        currency: project.currency || "RUB",
        startDate: project.startDate
          ? new Date(project.startDate).toISOString().split('T')[0]
          : "",
        endDate: project.endDate
          ? new Date(project.endDate).toISOString().split('T')[0]
          : "",
        marginTarget: project.marginTarget?.toString() || "",
      })
    }
    setIsEditing(false)
    setError(null)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading project...</div>
        </div>
      </div>
    )
  }

  if (error && !project) {
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

  if (!project) return null

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
              <h1 className="text-2xl font-semibold">{project.name}</h1>
              <Badge variant={getStatusVariant(project.status)}>
                {project.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {project.externalNumber || "\u2014"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 className="size-4" />
              <span className="ml-1.5">\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C</span>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="size-4" />
                <span className="ml-1.5">{saving ? "Saving..." : "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C"}</span>
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="size-4" />
                <span className="ml-1.5">\u041E\u0442\u043C\u0435\u043D\u0430</span>
              </Button>
            </div>
          )}
        </div>
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
        {/* Project Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>\u0414\u0435\u0442\u0430\u043B\u0438 \u043F\u0440\u043E\u0435\u043A\u0442\u0430</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="name">\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="externalNumber">\u041D\u043E\u043C\u0435\u0440 \u043F\u0440\u043E\u0435\u043A\u0442\u0430</Label>
                    <Input
                      id="externalNumber"
                      value={editForm.externalNumber}
                      onChange={(e) => setEditForm({ ...editForm, externalNumber: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="status">\u0421\u0442\u0430\u0442\u0443\u0441</Label>
                      <Select
                        value={editForm.status}
                        onValueChange={(value) => setEditForm({ ...editForm, status: value ?? "lead" })}
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lead">\u041B\u0438\u0434</SelectItem>
                          <SelectItem value="active">\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0439</SelectItem>
                          <SelectItem value="completed">\u0417\u0430\u0432\u0435\u0440\u0448\u0451\u043D</SelectItem>
                          <SelectItem value="paused">\u041F\u0430\u0443\u0437\u0430</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="currency">\u0412\u0430\u043B\u044E\u0442\u0430</Label>
                      <Select
                        value={editForm.currency}
                        onValueChange={(value) => setEditForm({ ...editForm, currency: value ?? "RUB" })}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="contractAmount">\u0421\u0443\u043C\u043C\u0430 \u043A\u043E\u043D\u0442\u0440\u0430\u043A\u0442\u0430</Label>
                      <Input
                        id="contractAmount"
                        type="number"
                        value={editForm.contractAmount}
                        onChange={(e) => setEditForm({ ...editForm, contractAmount: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="marginTarget">\u041C\u0430\u0440\u0436\u0430 (%)</Label>
                      <Input
                        id="marginTarget"
                        type="number"
                        step="0.1"
                        value={editForm.marginTarget}
                        onChange={(e) => setEditForm({ ...editForm, marginTarget: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startDate">\u0414\u0430\u0442\u0430 \u043D\u0430\u0447\u0430\u043B\u0430</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={editForm.startDate}
                        onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="endDate">\u0414\u0430\u0442\u0430 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={editForm.endDate}
                        onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435</Label>
                    <Textarea
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">\u0421\u0443\u043C\u043C\u0430 \u043A\u043E\u043D\u0442\u0440\u0430\u043A\u0442\u0430</p>
                        <p className="font-medium">
                          {formatCurrency(project.contractAmount, project.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">\u0414\u0430\u0442\u0430 \u043D\u0430\u0447\u0430\u043B\u0430</p>
                        <p className="font-medium">{formatDate(project.startDate)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">\u0414\u0430\u0442\u0430 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F</p>
                        <p className="font-medium">{formatDate(project.endDate)}</p>
                      </div>
                    </div>

                    {project.marginTarget != null && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">\u041C\u0430\u0440\u0436\u0430</p>
                          <p className="font-medium">{project.marginTarget}%</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {project.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435</p>
                      <p className="text-sm">{project.description}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Stages - Gantt Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="size-4" />
                \u042D\u0442\u0430\u043F\u044B \u043F\u0440\u043E\u0435\u043A\u0442\u0430
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectGantt projectId={project.id} stages={project.stages || []} />
            </CardContent>
          </Card>

          {/* Production */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="size-4" />
                  \u041F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0441\u0442\u0432\u043E
                </div>
                <CreateProductionModal
                  projectId={project.id}
                  onCreate={() => setProductionRefresh((prev) => prev + 1)}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductionList
                key={productionRefresh}
                projectId={project.id}
                onUpdate={() => setProductionRefresh((prev) => prev + 1)}
              />
            </CardContent>
          </Card>

          {/* Related */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="size-4" />
                \u0421\u0432\u044F\u0437\u0430\u043D\u043D\u044B\u0435 \u0441\u0443\u0449\u043D\u043E\u0441\u0442\u0438
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">\u041A\u043B\u0438\u0435\u043D\u0442</p>
                  {project.contact ? (
                    <a
                      href={`/crm/contacts/${project.contact.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {project.contact.type === "company"
                        ? project.contact.companyName
                        : [project.contact.lastName, project.contact.firstName]
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
                  <p className="text-xs text-muted-foreground">\u041C\u0435\u043D\u0435\u0434\u0436\u0435\u0440</p>
                  {project.manager ? (
                    <p className="text-sm font-medium">{project.manager.name || "\u2014"}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">\u2014</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">\u0421\u0434\u0435\u043B\u043A\u0430</p>
                  {project.deal ? (
                    <a
                      href={`/deals/${project.deal.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {project.deal.title}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">\u2014</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">\u041A\u043E\u043D\u0442\u0440\u0430\u043A\u0442</p>
                  {project.contract ? (
                    <a
                      href={`/contracts/${project.contract.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {project.contract.title}
                    </a>
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
          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4" />
                \u041A\u043E\u043C\u0430\u043D\u0434\u0430
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.members && project.members.length > 0 ? (
                <div className="space-y-3">
                  {project.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {member.User?.name?.[0] || member.User?.email?.[0] || "?"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {member.User?.name || member.User?.email || "\u2014"}
                        </p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">\u041D\u0435\u0442 \u0447\u043B\u0435\u043D\u043E\u0432 \u043A\u043E\u043C\u0430\u043D\u0434\u044B</p>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>\u041C\u0435\u0442\u0430\u0434\u0430\u043D\u043D\u044B\u0435</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">\u0421\u043E\u0437\u0434\u0430\u043D</span>
                <span>{new Date(project.createdAt).toLocaleDateString("ru-RU")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">\u041E\u0431\u043D\u043E\u0432\u043B\u0451\u043D</span>
                <span>{new Date(project.updatedAt).toLocaleDateString("ru-RU")}</span>
              </div>
              {project.completedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">\u0417\u0430\u0432\u0435\u0440\u0448\u0451\u043D</span>
                  <span>{new Date(project.completedAt).toLocaleDateString("ru-RU")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
