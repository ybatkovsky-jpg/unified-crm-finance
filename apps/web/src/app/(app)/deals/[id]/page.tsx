"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit2, Save, X, History, Link as LinkIcon, Calendar, User, DollarSign, Building2, FileText, File, Download, Trash2, Upload, Package, ChevronDown, Plus, ListTodo, Clock, AlertCircle, CheckCircle2, MessageSquare } from "lucide-react"
import { dealsApi, ApiClientError } from "@/lib/api/deals"
import { pipelinesApi } from "@/lib/api/pipelines"
import { filesApi } from "@/lib/api/files"
import { contractsApi } from "@/lib/api/contracts"
import { createTask, getTasks, updateTask, type TaskData } from "@/lib/api/tasks"
import { getLeadSources } from "@/lib/api/lead-source"
import { getLossReasonLabel } from "@/lib/loss-reasons"
import type { DealData, DealStageData, FileUploadFile, LeadSourceData } from "@/lib/api/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useMe } from "@/components/layout/use-me"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DealHistoryTimeline } from "@/components/deals/deal-history-timeline"
import { DealComments } from "@/components/deals/deal-comments"
import { FileUpload } from "@/components/shared/file-upload"
import { FilePreview, useFilePreview } from "@/components/shared/file-preview"

const TASK_STATUS_LABELS: Record<string, string> = {
  todo: "К выполнению",
  in_progress: "В работе",
  done: "Готово",
  failed: "Провалена",
  cancelled: "Отменена",
}

const TASK_STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  todo: "secondary",
  in_progress: "default",
  done: "outline",
  failed: "destructive",
  cancelled: "outline",
}

const TASK_PRIORITY_LABELS: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("ru-RU")
}

function formatDateTime(d: string | Date): string {
  const date = new Date(d)
  return date.toLocaleDateString("ru-RU") + " " + date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
}

function isOverdue(t: TaskData): boolean {
  if (!t.dueDate) return false
  if (["done", "cancelled", "failed"].includes(t.status)) return false
  return new Date(t.dueDate) < new Date()
}

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { me, isAdmin } = useMe()
  const [deal, setDeal] = useState<DealData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const [editForm, setEditForm] = useState({
    title: "",
    amount: "",
    currency: "RUB",
    expectedCloseDate: "",
    description: "",
    lossReason: "",
    sourceId: "",
  })
  const [drawingFiles, setDrawingFiles] = useState<FileUploadFile[]>([])
  const [actFiles, setActFiles] = useState<FileUploadFile[]>([])
  const [uploadingDrawing, setUploadingDrawing] = useState(false)
  const [uploadingAct, setUploadingAct] = useState(false)
  const filePreview = useFilePreview()

  // Pipeline stages for the inline stage selector.
  const [stages, setStages] = useState<DealStageData[]>([])
  const [movingStage, setMovingStage] = useState(false)
  // History section is collapsed by default (per UX decision).
  const [historyOpen, setHistoryOpen] = useState(false)
  const [leadSources, setLeadSources] = useState<LeadSourceData[]>([])

  // Tasks state
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState<string | null>(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskSaving, setTaskSaving] = useState(false)
  const [taskBusy, setTaskBusy] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
    priority: "medium",
    assigneeId: "",
  })
  const [users, setUsers] = useState<Array<{ id: string; name: string | null; email: string }>>([])

  const unwrapParams = useCallback(async () => {
    return await params
  }, [params])

  const fetchDeal = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await dealsApi.getDeal(id)
      setDeal(response.data)
      setEditForm({
        title: response.data.title,
        amount: response.data.amount.toString(),
        currency: response.data.currency,
        expectedCloseDate: response.data.expectedCloseDate
          ? new Date(response.data.expectedCloseDate).toISOString().split('T')[0]
          : "",
        description: response.data.description || "",
        lossReason: response.data.lossReason || "",
        sourceId: response.data.source?.id || "",
      })

      // Load pipeline stages for the inline stage selector.
      if (response.data.pipelineId) {
        try {
          const pipeline = await pipelinesApi.getPipeline(response.data.pipelineId)
          setStages((pipeline.data as unknown as { DealStage?: DealStageData[] }).DealStage ?? [])
        } catch {
          setStages([])
        }
      }

      // Load file data for attachments
      if (response.data.drawingFile) {
        setDrawingFiles([{
          id: response.data.drawingFile.id,
          file: new (globalThis as any).File([], response.data.drawingFile.fileName, { type: response.data.drawingFile.mimeType || 'application/octet-stream' }),
          progress: 100,
          status: 'success',
        }])
      }
      if (response.data.actFile) {
        setActFiles([{
          id: response.data.actFile.id,
          file: new (globalThis as any).File([], response.data.actFile.fileName, { type: response.data.actFile.mimeType || 'application/octet-stream' }),
          progress: 100,
          status: 'success',
        }])
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Не удалось загрузить сделку. Пожалуйста, попробуйте снова.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch tasks for this deal
  const fetchTasks = useCallback(async (dealId: string) => {
    setTasksLoading(true)
    setTasksError(null)
    try {
      // Fetch tasks via direct API call with dealId filter
      const res = await fetch(`/api/tasks?dealId=${dealId}`)
      if (!res.ok) throw new Error("Не удалось загрузить задачи")
      const json = await res.json()
      setTasks(json.data ?? [])
    } catch (err) {
      setTasksError(err instanceof Error ? err.message : "Не удалось загрузить задачи")
    } finally {
      setTasksLoading(false)
    }
  }, [])

  useEffect(() => {
    unwrapParams().then(({ id }) => {
      fetchDeal(id)
      fetchTasks(id)
    })
  }, [unwrapParams, fetchDeal, fetchTasks])

  // Load users for task assignee dropdown
  useEffect(() => {
    if (taskDialogOpen && users.length === 0) {
      fetch("/api/users/list")
        .then((r) => r.json())
        .then((d: { data?: typeof users }) => setUsers(d.data ?? []))
        .catch(() => {})
    }
  }, [taskDialogOpen, users.length])

  // Move deal to a different stage via /move (records history, server derives actor).
  const handleMoveStage = async (stageId: string) => {
    if (!deal || deal.stageId === stageId) return
    setMovingStage(true)
    setError(null)
    try {
      const response = await dealsApi.moveDeal(deal.id, { stageId })
      setDeal(response.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось сменить этап.")
    } finally {
      setMovingStage(false)
    }
  }

  const handleSave = async () => {
    if (!deal) return

    setSaving(true)
    setError(null)

    try {
      const response = await dealsApi.updateDeal(deal.id, {
        title: editForm.title,
        amount: parseFloat(editForm.amount) || 0,
        currency: editForm.currency,
        expectedCloseDate: editForm.expectedCloseDate || undefined,
        description: editForm.description || undefined,
        lossReason: editForm.lossReason || undefined,
        sourceId: editForm.sourceId || undefined,
      })

      setDeal(response.data)
      setIsEditing(false)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Не удалось сохранить сделку. Пожалуйста, попробуйте снова.")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (deal) {
      setEditForm({
        title: deal.title,
        amount: deal.amount.toString(),
        currency: deal.currency,
        expectedCloseDate: deal.expectedCloseDate
          ? new Date(deal.expectedCloseDate).toISOString().split('T')[0]
          : "",
        description: deal.description || "",
        lossReason: deal.lossReason || "",
        sourceId: deal.source?.id || "",
      })
    }
    setIsEditing(false)
    setError(null)
  }

  const handleConvertToContract = async () => {
    if (!deal) return

    setConverting(true)
    setError(null)

    try {
      const response = await contractsApi.convertDeal(deal.id, {
        title: deal.title,
        amount: Number(deal.amount),
        currency: deal.currency,
        startDate: new Date().toISOString().split('T')[0],
      })

      // Navigate to the newly created contract
      router.push(`/contracts/${response.data.contract.id}`)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Не удалось конвертировать сделку в контракт.")
      }
    } finally {
      setConverting(false)
    }
  }

  const handleCreateProject = async () => {
    if (!deal) return
    if (deal.projectId) {
      router.push(`/projects/${deal.projectId}`)
      return
    }

    setCreatingProject(true)
    setError(null)

    try {
      const res = await fetch(`/api/deals/${deal.id}/create-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: deal.title, contactId: deal.contactId }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || `HTTP ${res.status}`)
      }

      const { data: project } = await res.json()
      router.push(`/projects/${project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать проект.')
    } finally {
      setCreatingProject(false)
    }
  }

  // Task handlers
  const handleCreateTask = async () => {
    if (!deal || !newTask.title.trim()) return
    setTaskSaving(true)
    setError(null)
    try {
      let dueDateStr: string | undefined = undefined
      if (newTask.dueDate) {
        const timeStr = newTask.dueTime || "23:59"
        dueDateStr = new Date(`${newTask.dueDate}T${timeStr}:00`).toISOString()
      }
      await createTask({
        title: newTask.title.trim(),
        description: newTask.description.trim() || undefined,
        type: "general",
        priority: newTask.priority,
        dueDate: dueDateStr,
        dealId: deal.id,
        assigneeId: newTask.assigneeId || undefined,
      })
      setTaskDialogOpen(false)
      setNewTask({ title: "", description: "", dueDate: "", dueTime: "", priority: "medium", assigneeId: "" })
      await fetchTasks(deal.id)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось создать задачу")
    } finally {
      setTaskSaving(false)
    }
  }

  const handleTaskDone = async (taskId: string) => {
    setTaskBusy(true)
    try {
      await updateTask(taskId, { status: "done" })
      await fetchTasks(deal!.id)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось обновить задачу")
    } finally {
      setTaskBusy(false)
    }
  }

  const handleUploadDrawing = async (fileItem: FileUploadFile) => {
    setUploadingDrawing(true)
    try {
      const response = await filesApi.uploadFile({
        file: fileItem.file,
        entityType: 'deal',
        entityId: deal?.id || 'temp',
      })

      if (deal) {
        await dealsApi.updateDeal(deal.id, { drawingFileId: response.data.id })
        const updatedResponse = await dealsApi.getDeal(deal.id)
        setDeal(updatedResponse.data)
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Не удалось загрузить чертёж.")
      }
      throw err
    } finally {
      setUploadingDrawing(false)
    }
  }

  const handleUploadAct = async (fileItem: FileUploadFile) => {
    setUploadingAct(true)
    try {
      const response = await filesApi.uploadFile({
        file: fileItem.file,
        entityType: 'deal',
        entityId: deal?.id || 'temp',
      })

      if (deal) {
        await dealsApi.updateDeal(deal.id, { actFileId: response.data.id })
        const updatedResponse = await dealsApi.getDeal(deal.id)
        setDeal(updatedResponse.data)
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Не удалось загрузить акт.")
      }
      throw err
    } finally {
      setUploadingAct(false)
    }
  }

  const handleRemoveDrawing = async () => {
    if (!deal) return
    try {
      await dealsApi.updateDeal(deal.id, { drawingFileId: null })
      setDrawingFiles([])
      const updatedResponse = await dealsApi.getDeal(deal.id)
      setDeal(updatedResponse.data)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Не удалось удалить чертёж.")
      }
    }
  }

  const handleRemoveAct = async () => {
    if (!deal) return
    try {
      await dealsApi.updateDeal(deal.id, { actFileId: null })
      setActFiles([])
      const updatedResponse = await dealsApi.getDeal(deal.id)
      setDeal(updatedResponse.data)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Не удалось удалить акт.")
      }
    }
  }

  const handlePreviewFile = async (fileId: string, fileName: string) => {
    try {
      const response = await filesApi.getFile(fileId)
      filePreview.openPreview({
        fileName,
        fileUrl: response.data.downloadUrl,
        mimeType: response.data.file.mimeType || undefined,
      })
    } catch (err) {
      setError("Не удалось загрузить файл для предпросмотра.")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Загрузка сделки...</div>
        </div>
      </div>
    )
  }

  if (error && !deal) {
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

  if (!deal) return null

  const stageColor = deal.stage?.color || "#94a3b8"
  const isWon = deal.stage?.isWonStage
  const isLost = deal.stage?.isLostStage

  const activeTasks = tasks.filter((t) => !["done", "cancelled"].includes(t.status))

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{deal.title}</h1>
            <Badge
              style={{
                backgroundColor: stageColor,
                color: "#fff",
              }}
            >
              {deal.stage.name}
            </Badge>
            {isWon && <Badge variant="default">Выиграна</Badge>}
            {isLost && <Badge variant="destructive">Проиграна</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {deal.number} · {deal.pipeline.name}
            {deal.source && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {deal.source.name}
              </Badge>
            )}
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content — двухколоночный макет */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ===== ЛЕВАЯ КОЛОНКА: информация ===== */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Детали сделки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="title">Название</Label>
                    <Input
                      id="title"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Сумма</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="currency">Валюта</Label>
                      <Select
                        value={editForm.currency}
                        onValueChange={(value) => setEditForm({ ...editForm, currency: value ?? "RUB" })}
                        items={{ RUB: "RUB", USD: "USD", EUR: "EUR" }}
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

                  <div className="grid gap-2">
                    <Label htmlFor="expectedCloseDate">Ожидаемая дата закрытия</Label>
                    <Input
                      id="expectedCloseDate"
                      type="date"
                      value={editForm.expectedCloseDate}
                      onChange={(e) => setEditForm({ ...editForm, expectedCloseDate: e.target.value })}
                    />
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

                  <div className="grid gap-2">
                    <Label htmlFor="source">Источник</Label>
                      <Select
                        value={editForm.sourceId}
                        onValueChange={(value) => setEditForm({ ...editForm, sourceId: value ?? "" })}
                        items={Object.fromEntries(leadSources.map((ls) => [ls.id, ls.name]))}
                      >
                        <SelectTrigger id="source">
                          <SelectValue placeholder="Выберите источник..." />
                        </SelectTrigger>
                        <SelectContent>
                          {leadSources.map((ls) => (
                            <SelectItem key={ls.id} value={ls.id}>
                              {ls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>

                  {isLost && (
                    <div className="grid gap-2">
                      <Label htmlFor="lossReason">Причина проигрыша</Label>
                      <Textarea
                        id="lossReason"
                        value={editForm.lossReason}
                        onChange={(e) => setEditForm({ ...editForm, lossReason: e.target.value })}
                        rows={2}
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} disabled={saving}>
                      <Save className="size-4" />
                      <span className="ml-1.5">{saving ? "Сохранение..." : "Сохранить"}</span>
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="size-4" />
                      <span className="ml-1.5">Отмена</span>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Сумма</p>
                        <p className="font-medium">
                          {deal.amount.toLocaleString("ru-RU")} {deal.currency}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ожидаемое закрытие</p>
                        <p className="font-medium">
                          {deal.expectedCloseDate
                            ? new Date(deal.expectedCloseDate).toLocaleDateString("ru-RU")
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {deal.actualCloseDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Фактическое закрытие</p>
                        <p className="font-medium">
                          {new Date(deal.actualCloseDate).toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                    </div>
                  )}

                  {deal.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Описание</p>
                      <p className="text-sm">{deal.description}</p>
                    </div>
                  )}

                  {deal.source && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Источник</p>
                      <p className="text-sm">{deal.source.name}</p>
                    </div>
                  )}

                  {deal.lossReason && (
                    <div>
                      <p className="text-xs text-destructive mb-1">Причина проигрыша</p>
                      <p className="text-sm">{getLossReasonLabel(deal.lossReason)}</p>
                    </div>
                  )}
                </>
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
                  <p className="text-xs text-muted-foreground">Контакт</p>
                  {deal.contact ? (
                    <a
                      href={`/crm/contacts/${deal.contact.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {deal.contact.type === "company"
                        ? deal.contact.companyName
                        : [deal.contact.lastName, deal.contact.firstName]
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
                  {deal.manager ? (
                    <p className="text-sm font-medium">{deal.manager.name || "—"}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deal History — collapsible (collapsed by default) */}
          <Card>
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 p-6 pb-0 text-left"
              aria-expanded={historyOpen}
            >
              <CardTitle className="flex items-center gap-2">
                <History className="size-4" />
                История изменений
                {deal.history && deal.history.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{deal.history.length}</Badge>
                )}
              </CardTitle>
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform ${historyOpen ? "rotate-180" : ""}`}
              />
            </button>
            {historyOpen && (
              <CardContent className="pt-4">
                <DealHistoryTimeline history={deal.history} />
              </CardContent>
            )}
          </Card>

          {/* File Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File className="size-4" />
                Файлы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Drawing File */}
              <div>
                <Label className="text-sm font-medium">Чертёж</Label>
                <p className="text-xs text-muted-foreground mb-3">Прикрепите файл чертежа к сделке</p>

                {deal.drawingFile ? (
                  <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                    <div className="flex items-center gap-3">
                      <File className="size-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{deal.drawingFile.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {(deal.drawingFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handlePreviewFile(deal.drawingFile!.id, deal.drawingFile!.fileName)}
                        title="Предпросмотр"
                      >
                        <Download className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleRemoveDrawing}
                        disabled={uploadingDrawing}
                        title="Удалить"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <FileUpload
                    accept=".pdf,.dwg,.dxf,image/*"
                    multiple={false}
                    maxFiles={1}
                    files={drawingFiles}
                    onFilesChange={setDrawingFiles}
                    onUpload={handleUploadDrawing}
                    disabled={uploadingDrawing}
                  />
                )}
              </div>

              {/* Acceptance Act File */}
              <div>
                <Label className="text-sm font-medium">Акт приёма-сдачи</Label>
                <p className="text-xs text-muted-foreground mb-3">Прикрепите акт приёма-сдачи к сделке</p>

                {deal.actFile ? (
                  <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                    <div className="flex items-center gap-3">
                      <File className="size-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{deal.actFile.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {(deal.actFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handlePreviewFile(deal.actFile!.id, deal.actFile!.fileName)}
                        title="Предпросмотр"
                      >
                        <Download className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleRemoveAct}
                        disabled={uploadingAct}
                        title="Удалить"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <FileUpload
                    accept=".pdf,.doc,.docx,image/*"
                    multiple={false}
                    maxFiles={1}
                    files={actFiles}
                    onFilesChange={setActFiles}
                    onUpload={handleUploadAct}
                    disabled={uploadingAct}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===== ПРАВАЯ КОЛОНКА: действия ===== */}
        <div className="space-y-6">
          {/* Stage Info — inline selector */}
          <Card>
            <CardHeader>
              <CardTitle>Этап</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={deal.stageId}
                onValueChange={(value) => value && handleMoveStage(value)}
                disabled={movingStage || stages.length === 0}
                items={Object.fromEntries(stages.map((s) => [s.id, s.name]))}
              >
                <SelectTrigger className="w-full">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: stageColor }}
                    />
                    <SelectValue placeholder="Выберите этап" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: stage.color || "#94a3b8" }}
                        />
                        {stage.name}
                        {stage.isWonStage && <Badge variant="secondary" className="ml-1 text-[10px]">выиграно</Badge>}
                        {stage.isLostStage && <Badge variant="outline" className="ml-1 text-[10px]">потеряно</Badge>}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {deal.stage.probability > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Вероятность: {deal.stage.probability}%
                </p>
              )}
              {movingStage && (
                <p className="text-xs text-center text-muted-foreground">Смена этапа…</p>
              )}
            </CardContent>
          </Card>

          {/* Действия */}
          {!isEditing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="size-4" />
                  Действия
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {(isAdmin || deal.managerId === me?.id) && (
                  <Button onClick={() => { setIsEditing(true); getLeadSources().then(r => setLeadSources(r.data)).catch(() => {}) }}>
                    <Edit2 className="size-4" />
                    <span className="ml-1.5">Изменить</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!deal) return
                    setCreatingProject(true)
                    setError(null)
                    try {
                      const res = await fetch(`/api/deals/${deal.id}/convert-to-project`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: deal.title, contactId: deal.contactId }),
                      })
                      if (!res.ok) {
                        const errData = await res.json().catch(() => ({}))
                        throw new Error(errData.message || `HTTP ${res.status}`)
                      }
                      const { data: result } = await res.json()
                      router.push(`/projects/${result.project.id}`)
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Не удалось создать проект и договор.')
                    } finally {
                      setCreatingProject(false)
                    }
                  }}
                  disabled={creatingProject || !!deal.projectId}
                >
                  <Package className="size-4" />
                  <span className="ml-1.5">
                    {creatingProject ? "Создание..." : deal.projectId ? "Открыть проект" : "Создать проект и договор"}
                  </span>
                </Button>
                <Button variant="outline" onClick={() => setTaskDialogOpen(true)}>
                  <Plus className="size-4" />
                  <span className="ml-1.5">Добавить задачу</span>
                </Button>
                <Button variant="outline" onClick={handleConvertToContract} disabled={converting}>
                  <FileText className="size-4" />
                  <span className="ml-1.5">{converting ? "Конвертация..." : "В контракт"}</span>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tasks Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTodo className="size-4" />
                  Задачи по сделке
                  {activeTasks.length > 0 && (
                    <Badge variant="secondary" className="text-[10px]">{activeTasks.length} активных</Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setTaskDialogOpen(true)}>
                  <Plus className="size-3.5" />
                  <span className="ml-1">Добавить</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasksLoading && (
                <div className="text-center py-4 text-muted-foreground text-sm">Загрузка задач...</div>
              )}
              {tasksError && (
                <div className="text-center py-4 text-destructive text-sm">{tasksError}</div>
              )}
              {!tasksLoading && !tasksError && tasks.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <ListTodo className="size-8 mx-auto mb-2 opacity-40" />
                  Нет задач по этой сделке. Нажмите «Добавить», чтобы создать первую задачу.
                </div>
              )}
              {!tasksLoading && !tasksError && tasks.length > 0 && (
                <div className="space-y-2">
                  {tasks.map((t) => {
                    const overdue = isOverdue(t)
                    const assignee = (t as any).User_Task_assigneeIdToUser
                    return (
                      <div
                        key={t.id}
                        className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${
                          t.status === "done" ? "opacity-60 bg-muted/30" : ""
                        } ${overdue ? "border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20" : ""}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${t.status === "done" ? "line-through" : ""}`}>
                              {t.title}
                            </span>
                            <Badge variant={TASK_STATUS_VARIANTS[t.status] ?? "outline"} className="text-[10px]">
                              {TASK_STATUS_LABELS[t.status] ?? t.status}
                            </Badge>
                            {overdue && (
                              <Badge variant="destructive" className="text-[10px]">
                                <AlertCircle className="size-3 mr-0.5" />
                                Просрочена
                              </Badge>
                            )}
                          </div>
                          {t.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {t.dueDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {formatDateTime(t.dueDate)}
                              </span>
                            )}
                            {assignee && (
                              <span className="flex items-center gap-1">
                                <User className="size-3" />
                                {assignee.name || assignee.email}
                              </span>
                            )}
                            <Badge variant="outline" className="text-[10px]">
                              {TASK_PRIORITY_LABELS[t.priority] ?? t.priority}
                            </Badge>
                          </div>
                        </div>
                        {t.status !== "done" && t.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={taskBusy}
                            onClick={() => handleTaskDone(t.id)}
                            className="shrink-0"
                          >
                            <CheckCircle2 className="size-3.5" />
                            <span className="ml-1 text-xs">Готово</span>
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Комментарии */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="size-4" />
                Комментарии
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DealComments dealId={deal.id} />
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Метаданные</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Создана</span>
                <span>{new Date(deal.createdAt).toLocaleDateString("ru-RU")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Обновлена</span>
                <span>{new Date(deal.updatedAt).toLocaleDateString("ru-RU")}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setNewTask({ title: "", description: "", dueDate: "", dueTime: "", priority: "medium", assigneeId: "" })
        }
        setTaskDialogOpen(open)
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListTodo className="size-5" />
              Новая задача
            </DialogTitle>
            <DialogDescription>
              Создать задачу для сделки «{deal.title}»
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Название *</Label>
              <Input
                id="task-title"
                placeholder="Название задачи"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-desc">Описание</Label>
              <Textarea
                id="task-desc"
                placeholder="Описание задачи..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="task-date">Дата дедлайна</Label>
                <Input
                  id="task-date"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-time">Время</Label>
                <Input
                  id="task-time"
                  type="time"
                  value={newTask.dueTime}
                  onChange={(e) => setNewTask({ ...newTask, dueTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Приоритет</Label>
              <Select
                value={newTask.priority}
                onValueChange={(v) => v && setNewTask({ ...newTask, priority: v })}
                items={{ low: "Низкий", medium: "Средний", high: "Высокий" }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите приоритет" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Низкий</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="high">Высокий</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Исполнитель</Label>
              <Select
                value={newTask.assigneeId}
                onValueChange={(v) => v && setNewTask({ ...newTask, assigneeId: v })}
                items={Object.fromEntries(users.map((u) => [u.id, u.name ?? u.email]))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите исполнителя" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name ?? u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateTask} disabled={taskSaving || !newTask.title.trim()}>
              {taskSaving ? "Создание..." : "Создать задачу"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog */}
      <FilePreview
        open={filePreview.open}
        onOpenChange={filePreview.setOpen}
        fileName={filePreview.file?.fileName}
        fileUrl={filePreview.file?.fileUrl}
        mimeType={filePreview.file?.mimeType}
      />
    </div>
  )
}
