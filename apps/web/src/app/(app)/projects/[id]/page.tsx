"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit2, Save, X, Link as LinkIcon, Calendar, User, DollarSign, Building2, FileText, Users, Layers, Package, Upload, CheckCircle2, Wrench, Truck, ShieldCheck, FileCheck, Gift, CreditCard } from "lucide-react"
import { projectsApi, ApiClientError } from "@/lib/api/projects"
import { filesApi } from "@/lib/api/files"
import type { ProjectData, FileUploadFile, ClosureReadiness } from "@/lib/api/types"
import { ProjectGantt } from "@/components/projects/project-gantt"
import { ProductionList } from "@/components/projects/production-list"
import { CreateProductionModal } from "@/components/projects/create-production-modal"
import { InstallationList } from "@/components/projects/installation-list"
import { CreateInstallationModal } from "@/components/projects/create-installation-modal"
import { ChangeOrderList } from "@/components/projects/change-order-list"
import { CreateChangeOrderModal } from "@/components/projects/create-change-order-modal"
import { CreateMeasurementTask } from "@/components/projects/create-measurement-task"
import { StageManager } from "@/components/projects/stage-manager"
import { AcceptanceActCard } from "@/components/projects/acceptance-act-card"
import { DesignerBonusCard } from "@/components/projects/designer-bonus-card"
import { ProjectPaymentsCard } from "@/components/projects/project-payments-card"
import { BOMSection } from "@/components/procurement/bom-section"
import { BudgetWidget } from "@/components/finance/budget-widget"
import { StatusHistoryCard } from "@/components/projects/status-history-card"
import { useMe } from "@/components/layout/use-me"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { FileUpload } from "@/components/shared/file-upload"
import { FilePreview, useFilePreview } from "@/components/shared/file-preview"

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("ru-RU")
}

function formatCurrency(amount: number | null | undefined, currency: string = "RUB"): string {
  if (amount == null) return "—"
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
  const [installationRefresh, setInstallationRefresh] = useState(0)
  const [changeOrderRefresh, setChangeOrderRefresh] = useState(0)
  const [stageRefresh, setStageRefresh] = useState(0)
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
  const [specFiles, setSpecFiles] = useState<FileUploadFile[]>([])
  const [uploadingSpec, setUploadingSpec] = useState(false)
  const [completingProject, setCompletingProject] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [readiness, setReadiness] = useState<ClosureReadiness | null>(null)
  const [readinessLoading, setReadinessLoading] = useState(false)
  const { me } = useMe()
  const filePreview = useFilePreview()

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

      // Load spec file data if attached
      if (response.data.specFile) {
        setSpecFiles([{
          id: response.data.specFile.id,
          file: new File([], response.data.specFile.fileName, { type: response.data.specFile.mimeType || 'application/octet-stream' }),
          progress: 100,
          status: 'success',
        }])
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        console.error("[ProjectDetail] API error:", err.message)
        setError(err.message)
      } else {
        console.error("[ProjectDetail] Unexpected error:", err)
        setError("Не удалось загрузить проект. Пожалуйста, попробуйте снова.")
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
      const specFileId = specFiles.length > 0 && specFiles[0].status === 'success'
        ? specFiles[0].id
        : null

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
        specFileId: specFileId || undefined,
      })

      setProject(response.data)
      setIsEditing(false)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Не удалось сохранить проект. Пожалуйста, попробуйте снова.")
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
      // Reset spec files to current project state
      if (project.specFile) {
        setSpecFiles([{
          id: project.specFile.id,
          file: new File([], project.specFile.fileName, { type: project.specFile.mimeType || 'application/octet-stream' }),
          progress: 100,
          status: 'success',
        }])
      } else {
        setSpecFiles([])
      }
    }
    setIsEditing(false)
    setError(null)
  }

  const handleUploadSpec = async (fileItem: FileUploadFile) => {
    setUploadingSpec(true)
    try {
      const response = await filesApi.uploadFile({
        file: fileItem.file,
        entityType: 'project',
        entityId: project?.id || 'temp',
      })

      // Update the file item with the actual file ID
      setSpecFiles(prev => prev.map(f =>
        f.id === fileItem.id ? { ...f, id: response.data.id, status: 'success' as const, progress: 100 } : f
      ))
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Не удалось загрузить файл спецификации.")
      }
      throw err
    } finally {
      setUploadingSpec(false)
    }
  }

  const handleRemoveSpec = () => {
    setSpecFiles([])
  }

  // Open the spec file in the preview dialog (fetches its download URL first).
  const handlePreviewSpec = async (fileId: string, fileName: string) => {
    try {
      const response = await filesApi.getFile(fileId)
      filePreview.openPreview({
        fileName,
        fileUrl: response.data.downloadUrl,
        mimeType: response.data.file.mimeType || undefined,
      })
    } catch (err) {
      console.error('[ProjectDetail] Failed to load spec file for preview:', err)
      setError('Не удалось открыть файл спецификации.')
    }
  }

  // Check if all project stages are completed
  const allStagesCompleted = project?.stages?.every(
    (stage) => stage.status === "completed"
  ) ?? false

  // Check if project can be completed (all stages done and not already completed)
  const canCompleteProject = allStagesCompleted && project?.status !== "completed"

  // Загрузить чек-лист готовности к закрытию при открытии диалога.
  const handleOpenCloseDialog = async (open: boolean) => {
    setCloseDialogOpen(open)
    if (open && project) {
      setReadinessLoading(true)
      try {
        const response = await projectsApi.getClosureReadiness(project.id)
        setReadiness(response.data)
      } catch {
        setReadiness(null)
      } finally {
        setReadinessLoading(false)
      }
    }
  }

  const handleCompleteProject = async (overrideUnmet: boolean = false) => {
    if (!project) return

    setCompletingProject(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const userId = me?.id || "system"

      const response = await projectsApi.completeProject(project.id, userId, overrideUnmet)

      setSuccessMessage(
        "Проект успешно закрыт. Установлена гарантия 2 года. Связанная сделка также закрыта."
      )
      setCloseDialogOpen(false)

      // Refresh project data
      await fetchProject(project.id)

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Не удалось закрыть проект. Пожалуйста, попробуйте снова.")
      }
    } finally {
      setCompletingProject(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Загрузка проекта...</div>
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
                <span className="ml-1.5">Назад</span>
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
              {project.externalNumber || "—"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <CreateMeasurementTask
                projectId={project.id}
                projectName={project.name}
                contactId={project.contact?.id}
                measurementType="measurement_2"
              />
              <Button onClick={() => setIsEditing(true)}>
                <Edit2 className="size-4" />
                <span className="ml-1.5">Изменить</span>
              </Button>

              {canCompleteProject && (
                <AlertDialog open={closeDialogOpen} onOpenChange={handleOpenCloseDialog}>
                  <AlertDialogTrigger
                    render={<Button variant="default" className="bg-green-600 hover:bg-green-700">
                      <CheckCircle2 className="size-4" />
                      <span className="ml-1.5">Подписать акт и закрыть проект</span>
                    </Button>}
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Закрыть проект?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Все этапы проекта завершены. Связанная сделка также будет закрыта,
                        а по проекту установлен срок гарантии 2 года.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    {/* Чек-лист готовности к закрытию (PROJ-13) */}
                    <div className="space-y-2 py-1">
                      {readinessLoading && (
                        <p className="text-sm text-muted-foreground">Проверка условий закрытия…</p>
                      )}
                      {!readinessLoading && readiness && (
                        <>
                          {readiness.conditions.map((c) => (
                            <div key={c.key} className="flex items-start gap-2 text-sm">
                              <CheckCircle2
                                className={`size-4 mt-0.5 shrink-0 ${c.met ? "text-green-600" : "text-muted-foreground/40"}`}
                              />
                              <div>
                                <span className={c.met ? "text-foreground" : "text-muted-foreground"}>
                                  {c.label}
                                </span>
                                <span className="block text-xs text-muted-foreground">{c.detail}</span>
                              </div>
                            </div>
                          ))}
                          {!readiness.ready && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 pt-1">
                              Есть невыполненные условия. Можно закрыть принудительно, но это не рекомендуется.
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <AlertDialogFooter>
                      <AlertDialogCancel
                        render={<Button variant="outline">Отмена</Button>}
                      />
                      {readiness && !readiness.ready ? (
                        // Невыполненные условия → две кнопки: обычное закрытие (вернёт 409)
                        // и «закрыть всё равно» с override.
                        <div className="flex gap-2">
                          <AlertDialogAction
                            render={
                              <Button
                                onClick={() => handleCompleteProject(false)}
                                disabled={completingProject}
                                variant="outline"
                              >
                                {completingProject ? "Закрытие…" : "Закрыть"}
                              </Button>
                            }
                          />
                          <AlertDialogAction
                            render={
                              <Button
                                onClick={() => handleCompleteProject(true)}
                                disabled={completingProject}
                                className="bg-amber-600 hover:bg-amber-700"
                              >
                                {completingProject ? "Закрытие…" : "Закрыть всё равно"}
                              </Button>
                            }
                          />
                        </div>
                      ) : (
                        <AlertDialogAction
                          render={
                            <Button
                              onClick={() => handleCompleteProject(false)}
                              disabled={completingProject}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {completingProject ? "Закрытие…" : "Подписать акт"}
                            </Button>
                          }
                        />
                      )}
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="size-4" />
                <span className="ml-1.5">{saving ? "Сохранение..." : "Сохранить"}</span>
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="size-4" />
                <span className="ml-1.5">Отмена</span>
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

      {successMessage && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
              <p className="text-green-700 dark:text-green-300">{successMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Детали проекта</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Название</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="externalNumber">Номер проекта</Label>
                    <Input
                      id="externalNumber"
                      value={editForm.externalNumber}
                      onChange={(e) => setEditForm({ ...editForm, externalNumber: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="status">Статус</Label>
                      <Select
                        value={editForm.status}
                        onValueChange={(value) => setEditForm({ ...editForm, status: value ?? "lead" })}
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lead">Лид</SelectItem>
                          <SelectItem value="active">Активный</SelectItem>
                          <SelectItem value="completed">Завершён</SelectItem>
                          <SelectItem value="paused">Пауза</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="currency">Валюта</Label>
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
                      <Label htmlFor="contractAmount">Сумма контракта</Label>
                      <Input
                        id="contractAmount"
                        type="number"
                        value={editForm.contractAmount}
                        onChange={(e) => setEditForm({ ...editForm, contractAmount: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="marginTarget">Маржа (%)</Label>
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
                      <Label htmlFor="startDate">Дата начала</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={editForm.startDate}
                        onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="endDate">Дата окончания</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={editForm.endDate}
                        onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Описание</Label>
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
                        <p className="text-xs text-muted-foreground">Сумма контракта</p>
                        <p className="font-medium">
                          {formatCurrency(Number(project.contractAmount), project.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Дата начала</p>
                        <p className="font-medium">{formatDate(project.startDate)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Дата окончания</p>
                        <p className="font-medium">{formatDate(project.endDate)}</p>
                      </div>
                    </div>

                    {project.marginTarget != null && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Маржа</p>
                          <p className="font-medium">{project.marginTarget}%</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {project.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Описание</p>
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
                Этапы проекта
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectGantt projectId={project.id} stages={project.stages || []} />
            </CardContent>
          </Card>

          {/* Stage Manager */}
          <StageManager
            projectId={project.id}
            stages={project.stages || []}
            onUpdate={() => {
              setStageRefresh((prev) => prev + 1)
              fetchProject(project.id)
            }}
          />

          {/* Production */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="size-4" />
                  Производство
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

          {/* Installation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="size-4" />
                  Монтаж
                </div>
                <CreateInstallationModal
                  projectId={project.id}
                  onCreate={() => setInstallationRefresh((prev) => prev + 1)}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InstallationList
                key={installationRefresh}
                projectId={project.id}
                onUpdate={() => setInstallationRefresh((prev) => prev + 1)}
              />
            </CardContent>
          </Card>

          {/* Change Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="size-4" />
                  Доп. работы
                </div>
                <CreateChangeOrderModal
                  projectId={project.id}
                  contractId={project.contract?.id}
                  onCreate={() => setChangeOrderRefresh((prev) => prev + 1)}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChangeOrderList
                key={changeOrderRefresh}
                projectId={project.id}
                onUpdate={() => setChangeOrderRefresh((prev) => prev + 1)}
              />
            </CardContent>
          </Card>

          {/* Client Payments 70/30 (FIN-01) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-4" />
                Платежи клиента
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectPaymentsCard
                projectId={project.id}
                onUpdate={() => fetchProject(project.id)}
              />
            </CardContent>
          </Card>

          {/* Acceptance Act (PROJ-12) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="size-4" />
                Акт приёмки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AcceptanceActCard
                projectId={project.id}
                contactType={project.contact?.type ?? null}
                onUpdate={() => fetchProject(project.id)}
              />
            </CardContent>
          </Card>

          {/* Designer Bonus (минимальный след, PROJ-13) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="size-4" />
                Бонус дизайнеру
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DesignerBonusCard
                projectId={project.id}
                onUpdate={() => fetchProject(project.id)}
              />
            </CardContent>
          </Card>

          {/* BOM Specification */}
          <BOMSection projectId={project.id} />

          {/* Budget */}
          <BudgetWidget projectId={project.id} />

          {/* File Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="size-4" />
                Файлы проекта
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Технические спецификации</Label>
                    <div className="mt-2">
                      <FileUpload
                        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf"
                        multiple={false}
                        maxFiles={1}
                        files={specFiles}
                        onFilesChange={setSpecFiles}
                        onUpload={handleUploadSpec}
                        onDelete={handleRemoveSpec}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {project.specFile ? (() => {
                    const specFile = project.specFile
                    return (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{specFile.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {specFile.mimeType || 'Неизвестный тип'} • {(specFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handlePreviewSpec(specFile.id, specFile.fileName)}
                      >
                        <FileText className="size-3.5" />
                      </Button>
                    </div>
                    )
                  })() : (
                    <p className="text-sm text-muted-foreground">Файлы не прикреплены</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="size-4" />
                Связанные сущности
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Клиент</p>
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
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Менеджер</p>
                  {project.manager ? (
                    <p className="text-sm font-medium">{project.manager.name || "—"}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Сделка</p>
                  {project.deal ? (
                    <a
                      href={`/deals/${project.deal.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {project.deal.title}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Контракт</p>
                  {project.contract ? (
                    <a
                      href={`/contracts/${project.contract.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {project.contract.title}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
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
                Команда
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
                          {member.User?.name || member.User?.email || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Нет членов команды</p>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Метаданные</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Создан</span>
                <span>{new Date(project.createdAt).toLocaleDateString("ru-RU")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Обновлён</span>
                <span>{new Date(project.updatedAt).toLocaleDateString("ru-RU")}</span>
              </div>
              {project.completedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Завершён</span>
                  <span>{new Date(project.completedAt).toLocaleDateString("ru-RU")}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warranty (PROJ-14) */}
          {project.warrantyEndDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  Гарантия
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {project.warrantyStartDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Начало</span>
                    <span>{new Date(project.warrantyStartDate).toLocaleDateString("ru-RU")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Окончание</span>
                  <span className="flex items-center gap-2">
                    {new Date(project.warrantyEndDate).toLocaleDateString("ru-RU")}
                    <Badge variant={new Date(project.warrantyEndDate) > new Date() ? "secondary" : "destructive"}>
                      {new Date(project.warrantyEndDate) > new Date() ? "На гарантии" : "Истекла"}
                    </Badge>
                  </span>
                </div>
                {project.warrantyNotes && (
                  <p className="text-xs text-muted-foreground pt-1">{project.warrantyNotes}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status History */}
          <StatusHistoryCard projectId={project.id} />
        </div>
      </div>
    </div>
  )
}
