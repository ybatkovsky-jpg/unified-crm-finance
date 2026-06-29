"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit2, Save, X, History, Link as LinkIcon, Calendar, User, DollarSign, Building2, FileText, File, Download, Trash2, Upload, Package, ChevronDown } from "lucide-react"
import { dealsApi, ApiClientError } from "@/lib/api/deals"
import { pipelinesApi } from "@/lib/api/pipelines"
import { filesApi } from "@/lib/api/files"
import { contractsApi } from "@/lib/api/contracts"
import type { DealData, DealStageData, FileUploadFile } from "@/lib/api/types"
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
import { DealHistoryTimeline } from "@/components/deals/deal-history-timeline"
import { FileUpload } from "@/components/shared/file-upload"
import { FilePreview, useFilePreview } from "@/components/shared/file-preview"

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
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
      })

      // Load pipeline stages for the inline stage selector.
      if (response.data.pipelineId) {
        try {
          const pipeline = await pipelinesApi.getPipeline(response.data.pipelineId)
          // Pipeline API returns stages under PascalCase `DealStage` (Prisma shape).
          setStages((pipeline.data as unknown as { DealStage?: DealStageData[] }).DealStage ?? [])
        } catch {
          setStages([])
        }
      }

      // Load file data for attachments
      if (response.data.drawingFile) {
        const fileResponse = await filesApi.getFile(response.data.drawingFile.id)
        setDrawingFiles([{
          id: response.data.drawingFile.id,
          file: new (globalThis as any).File([], response.data.drawingFile.fileName, { type: response.data.drawingFile.mimeType || 'application/octet-stream' }),
          progress: 100,
          status: 'success',
        }])
      }
      if (response.data.actFile) {
        const fileResponse = await filesApi.getFile(response.data.actFile.id)
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
        setError("Failed to load deal. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    unwrapParams().then(({ id }) => {
      fetchDeal(id)
    })
  }, [unwrapParams, fetchDeal])

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
      })

      setDeal(response.data)
      setIsEditing(false)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to save deal. Please try again.")
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

  const handleUploadDrawing = async (fileItem: FileUploadFile) => {
    setUploadingDrawing(true)
    try {
      const response = await filesApi.uploadFile({
        file: fileItem.file,
        entityType: 'deal',
        entityId: deal?.id || 'temp',
      })

      // Update deal with new drawing file ID
      if (deal) {
        await dealsApi.updateDeal(deal.id, { drawingFileId: response.data.id })
        // Refresh deal data
        const updatedResponse = await dealsApi.getDeal(deal.id)
        setDeal(updatedResponse.data)
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to upload drawing file.")
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

      // Update deal with new act file ID
      if (deal) {
        await dealsApi.updateDeal(deal.id, { actFileId: response.data.id })
        // Refresh deal data
        const updatedResponse = await dealsApi.getDeal(deal.id)
        setDeal(updatedResponse.data)
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to upload act file.")
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
      // Refresh deal data
      const updatedResponse = await dealsApi.getDeal(deal.id)
      setDeal(updatedResponse.data)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to remove drawing file.")
      }
    }
  }

  const handleRemoveAct = async () => {
    if (!deal) return
    try {
      await dealsApi.updateDeal(deal.id, { actFileId: null })
      setActFiles([])
      // Refresh deal data
      const updatedResponse = await dealsApi.getDeal(deal.id)
      setDeal(updatedResponse.data)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to remove act file.")
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
      setError("Failed to load file for preview.")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading deal...</div>
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
                <span className="ml-1.5">Go Back</span>
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
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <Button onClick={() => setIsEditing(true)}>
                <Edit2 className="size-4" />
                <span className="ml-1.5">Изменить</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleCreateProject}
                disabled={creatingProject || !!deal.projectId}
              >
                <Package className="size-4" />
                <span className="ml-1.5">
                  {creatingProject ? "Создание..." : deal.projectId ? "В проект" : "В проект"}
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={handleConvertToContract}
                disabled={converting}
              >
                <FileText className="size-4" />
                <span className="ml-1.5">{converting ? "Конвертация..." : "В контракт"}</span>
              </Button>
            </>
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
        {/* Deal Details */}
        <div className="lg:col-span-2 space-y-6">
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
                      <span className="ml-1.5">{saving ? "Saving..." : "Save"}</span>
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="size-4" />
                      <span className="ml-1.5">Cancel</span>
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
                            : "\—"}
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

                  {deal.lossReason && (
                    <div>
                      <p className="text-xs text-destructive mb-1">Причина проигрыша</p>
                      <p className="text-sm">{deal.lossReason}</p>
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
                    <p className="text-sm text-muted-foreground">\—</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Менеджер</p>
                  {deal.manager ? (
                    <p className="text-sm font-medium">{deal.manager.name || "\—"}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">\—</p>
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
                <Label className="text-sm font-medium">Чертеж (Drawing)</Label>
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
                        title="Preview"
                      >
                        <Download className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleRemoveDrawing}
                        disabled={uploadingDrawing}
                        title="Remove"
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
                <Label className="text-sm font-medium">Акт приема-сдачи (Acceptance Act)</Label>
                <p className="text-xs text-muted-foreground mb-3">Прикрепите акт приема-сдачи к сделке</p>

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
                        title="Preview"
                      >
                        <Download className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleRemoveAct}
                        disabled={uploadingAct}
                        title="Remove"
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

        {/* Sidebar */}
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
