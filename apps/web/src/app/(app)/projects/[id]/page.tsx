"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit2, Save, X, Link as LinkIcon, Calendar, User, DollarSign, Building2, FileText, Users, Layers, Package, Upload, CheckCircle2, Wrench, Truck } from "lucide-react"
import { projectsApi, ApiClientError } from "@/lib/api/projects"
import { filesApi } from "@/lib/api/files"
import type { ProjectData, FileUploadFile } from "@/lib/api/types"
import { ProjectGantt } from "@/components/projects/project-gantt"
import { ProductionList } from "@/components/projects/production-list"
import { CreateProductionModal } from "@/components/projects/create-production-modal"
import { InstallationList } from "@/components/projects/installation-list"
import { CreateInstallationModal } from "@/components/projects/create-installation-modal"
import { ChangeOrderList } from "@/components/projects/change-order-list"
import { CreateChangeOrderModal } from "@/components/projects/create-change-order-modal"
import { BOMSection } from "@/components/procurement/bom-section"
import { BudgetWidget } from "@/components/finance/budget-widget"
import { StatusHistoryCard } from "@/components/projects/status-history-card"
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
  if (!date) return "\—"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("ru-RU")
}

function formatCurrency(amount: number | null | undefined, currency: string = "RUB"): string {
  if (amount == null) return "\—"
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
        setError("Failed to upload specification file.")
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

  const handleCompleteProject = async () => {
    if (!project) return

    setCompletingProject(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Use a hardcoded user ID for now - in a real app this would come from auth
      const userId = "system"

      const response = await projectsApi.completeProject(project.id, userId)

      // Show success message
      setSuccessMessage("Проект успешно закрыт. Связанная сделка также закрыта.")

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
              {project.externalNumber || "\—"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button onClick={() => setIsEditing(true)}>
                <Edit2 className="size-4" />
                <span className="ml-1.5">\И\з\м\е\н\и\т\ь</span>
              </Button>

              {canCompleteProject && (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={<Button variant="default" className="bg-green-600 hover:bg-green-700">
                      <CheckCircle2 className="size-4" />
                      <span className="ml-1.5">\П\о\д\п\и\с\а\т\ь \а\к\т \и \з\а\к\р\ы\т\ь \п\р\о\е\к\т</span>
                    </Button>}
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>\З\а\к\р\ы\т\ь \п\р\о\е\к\т?</AlertDialogTitle>
                      <AlertDialogDescription>
                        \В\ы \у\в\е\р\е\н\ы, \ч\т\о \х\о\т\и\т\е \п\о\д\п\и\с\а\т\ь \а\к\т \и \з\а\к\р\ы\т\ь \п\р\о\е\к\т? \В\с\е \э\т\а\п\ы \п\р\о\е\к\т\а \з\а\в\е\р\ш\е\н\ы. \С\в\я\з\а\н\н\а\я \с\д\е\л\к\а \т\а\к\ж\е \б\у\д\е\т \з\а\к\р\ы\т\а.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        render={<Button variant="outline">\О\т\м\е\н\а</Button>}
                      />
                      <AlertDialogAction
                        render={<Button onClick={handleCompleteProject} disabled={completingProject} className="bg-green-600 hover:bg-green-700">
                          {completingProject ? "\З\а\к\р\ы\т\и\е..." : "\П\о\д\п\и\с\а\т\ь \а\к\т"}
                        </Button>}
                      />
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="size-4" />
                <span className="ml-1.5">{saving ? "Saving..." : "\С\о\х\р\а\н\и\т\ь"}</span>
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="size-4" />
                <span className="ml-1.5">\О\т\м\е\н\а</span>
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
              <CardTitle>\Д\е\т\а\л\и \п\р\о\е\к\т\а</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="name">\Н\а\з\в\а\н\и\е</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="externalNumber">\Н\о\м\е\р \п\р\о\е\к\т\а</Label>
                    <Input
                      id="externalNumber"
                      value={editForm.externalNumber}
                      onChange={(e) => setEditForm({ ...editForm, externalNumber: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="status">\С\т\а\т\у\с</Label>
                      <Select
                        value={editForm.status}
                        onValueChange={(value) => setEditForm({ ...editForm, status: value ?? "lead" })}
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lead">\Л\и\д</SelectItem>
                          <SelectItem value="active">\А\к\т\и\в\н\ы\й</SelectItem>
                          <SelectItem value="completed">\З\а\в\е\р\ш\ё\н</SelectItem>
                          <SelectItem value="paused">\П\а\у\з\а</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="currency">\В\а\л\ю\т\а</Label>
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
                      <Label htmlFor="contractAmount">\С\у\м\м\а \к\о\н\т\р\а\к\т\а</Label>
                      <Input
                        id="contractAmount"
                        type="number"
                        value={editForm.contractAmount}
                        onChange={(e) => setEditForm({ ...editForm, contractAmount: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="marginTarget">\М\а\р\ж\а (%)</Label>
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
                      <Label htmlFor="startDate">\Д\а\т\а \н\а\ч\а\л\а</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={editForm.startDate}
                        onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="endDate">\Д\а\т\а \о\к\о\н\ч\а\н\и\я</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={editForm.endDate}
                        onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">\О\п\и\с\а\н\и\е</Label>
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
                        <p className="text-xs text-muted-foreground">\С\у\м\м\а \к\о\н\т\р\а\к\т\а</p>
                        <p className="font-medium">
                          {formatCurrency(Number(project.contractAmount), project.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">\Д\а\т\а \н\а\ч\а\л\а</p>
                        <p className="font-medium">{formatDate(project.startDate)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">\Д\а\т\а \о\к\о\н\ч\а\н\и\я</p>
                        <p className="font-medium">{formatDate(project.endDate)}</p>
                      </div>
                    </div>

                    {project.marginTarget != null && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">\М\а\р\ж\а</p>
                          <p className="font-medium">{project.marginTarget}%</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {project.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">\О\п\и\с\а\н\и\е</p>
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
                \Э\т\а\п\ы \п\р\о\е\к\т\а
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

          {/* BOM Specification */}
          <BOMSection projectId={project.id} />

          {/* Budget */}
          <BudgetWidget projectId={project.id} />

          {/* File Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="size-4" />
                \Ф\а\й\л\ы \п\р\о\е\к\т\а
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">\Т\е\х\н\и\ч\е\с\к\и\е \с\п\е\ц\и\ф\и\к\а\ц\и\и</Label>
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
                            {specFile.mimeType || 'Unknown type'} • {(specFile.size / 1024).toFixed(1)} KB
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
                    <p className="text-sm text-muted-foreground">\Ф\а\й\л\ы \н\е \п\р\и\к\р\е\п\л\е\н\ы</p>
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
                \С\в\я\з\а\н\н\ы\е \с\у\щ\н\о\с\т\и
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">\К\л\и\е\н\т</p>
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
                    <p className="text-sm text-muted-foreground">\—</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">\М\е\н\е\д\ж\е\р</p>
                  {project.manager ? (
                    <p className="text-sm font-medium">{project.manager.name || "\—"}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">\—</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">\С\д\е\л\к\а</p>
                  {project.deal ? (
                    <a
                      href={`/deals/${project.deal.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {project.deal.title}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">\—</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">\К\о\н\т\р\а\к\т</p>
                  {project.contract ? (
                    <a
                      href={`/contracts/${project.contract.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {project.contract.title}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">\—</p>
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
                \К\о\м\а\н\д\а
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
                          {member.User?.name || member.User?.email || "\—"}
                        </p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">\Н\е\т \ч\л\е\н\о\в \к\о\м\а\н\д\ы</p>
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

          {/* Status History */}
          <StatusHistoryCard projectId={project.id} />
        </div>
      </div>
    </div>
  )
}
