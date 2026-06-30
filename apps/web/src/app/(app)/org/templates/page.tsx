"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCwIcon, PlusIcon, Trash2Icon, CalendarClockIcon, PowerIcon } from "lucide-react"
import { ApiClientError } from "@/lib/api/shared"
import {
  getTemplates, createTemplate, updateTemplate, deleteTemplate,
  getFunctions,
  type TemplateData, type FunctionData,
} from "@/lib/api/org"
import { useMe } from "@/components/layout/use-me"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RruleBuilder } from "./rrule-builder"

const PRIORITY_LABELS: Record<string, string> = {
  low: "Низкий", medium: "Средний", high: "Высокий", urgent: "Срочный",
}
const PRIORITY_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "outline", medium: "secondary", high: "default", urgent: "destructive",
}
const STRATEGY_LABELS: Record<string, string> = {
  function_responsible: "Ответственный функции",
  function_head: "Руководитель функции",
  fixed: "Конкретный сотрудник",
  unassigned: "Без исполнителя",
}

interface UserOption { id: string; name: string; email: string }

export default function OrgTemplatesPage() {
  const { me, loading: meLoading } = useMe()
  const [templates, setTemplates] = useState<TemplateData[]>([])
  const [functions, setFunctions] = useState<FunctionData[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isDirector = !!me?.roleCodes?.includes("director")

  // Состояние формы.
  const [editId, setEditId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [functionId, setFunctionId] = useState<string>("")
  const [rrule, setRrule] = useState<string | null>(null)
  const [dtStart, setDtStart] = useState("")
  const [until, setUntil] = useState<string | null>(null)
  const [strategy, setStrategy] = useState("function_responsible")
  const [fixedAssigneeId, setFixedAssigneeId] = useState<string>("")

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [t, f] = await Promise.all([getTemplates(), getFunctions()])
      setTemplates(t.data)
      setFunctions(f.data)
      if (isDirector) {
        const ur = await fetch("/api/users")
        if (ur.ok) { const uj = await ur.json(); setUsers(uj.data ?? []) }
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить шаблоны.")
    } finally { setLoading(false) }
  }, [isDirector])

  useEffect(() => { if (!meLoading) fetchData() }, [fetchData, meLoading])

  const resetForm = () => {
    setEditId(null); setTitle(""); setDescription(""); setPriority("medium")
    setFunctionId(""); setRrule(null); setDtStart(new Date().toISOString().slice(0, 10))
    setUntil(null); setStrategy("function_responsible"); setFixedAssigneeId("")
  }

  const openCreate = () => {
    resetForm()
    setOpen(true)
  }

  const openEdit = (t: TemplateData) => {
    setEditId(t.id); setTitle(t.title); setDescription(t.description ?? "")
    setPriority(t.priority); setFunctionId(t.functionId ?? "")
    setRrule(t.rrule); setDtStart(new Date(t.dtStart).toISOString().slice(0, 10))
    setUntil(t.dtEnd ? new Date(t.dtEnd).toISOString().slice(0, 10) : null)
    setStrategy(t.assigneeStrategy); setFixedAssigneeId(t.fixedAssigneeId ?? "")
    setOpen(true)
  }

  const handleSave = async () => {
    if (!title.trim() || !dtStart) return
    setBusy(true)
    try {
      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        functionId: functionId || null,
        rrule,
        dtStart: new Date(dtStart).toISOString(),
        dtEnd: until ? new Date(until).toISOString() : null,
        assigneeStrategy: strategy,
        fixedAssigneeId: strategy === "fixed" ? fixedAssigneeId : null,
      }
      if (editId) {
        await updateTemplate(editId, body)
      } else {
        await createTemplate(body)
      }
      setOpen(false)
      await fetchData()
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Ошибка сохранения")
    } finally { setBusy(false) }
  }

  const handleToggleActive = async (t: TemplateData) => {
    setBusy(true)
    try {
      await updateTemplate(t.id, { isActive: !t.isActive })
      await fetchData()
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Ошибка")
    } finally { setBusy(false) }
  }

  const handleDelete = async (t: TemplateData) => {
    if (!confirm(`Удалить шаблон «${t.title}»? Созданные задачи останутся.`)) return
    setBusy(true)
    try {
      await deleteTemplate(t.id)
      await fetchData()
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Ошибка")
    } finally { setBusy(false) }
  }

  if (meLoading || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center py-12">
          <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Загрузка...</span>
        </div>
      </div>
    )
  }

  if (!isDirector) {
    return (
      <div className="container mx-auto p-6">
        <Card><CardContent className="pt-6">
          <p className="text-center text-muted-foreground py-8">
            Управление шаблонами доступно только директору.
          </p>
        </CardContent></Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Шаблоны задач</h1>
          <p className="text-sm text-muted-foreground">
            Разовые и повторяющиеся задачи функций. Инстансы создаются автоматически по наступлению срока.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCwIcon className="size-4" /><span className="ml-1.5">Обновить</span>
          </Button>
          <Button onClick={openCreate}>
            <PlusIcon className="size-4" /><span className="ml-1.5">Новый шаблон</span>
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive"><CardContent className="pt-6">
          <p className="text-destructive text-sm">{error}</p>
        </CardContent></Card>
      )}

      {templates.length === 0 ? (
        <Card><CardContent className="pt-6">
          <p className="text-center text-muted-foreground py-8">
            Нет шаблонов. Создайте первый — например, повторяющуюся задачу «Оплата налогов».
          </p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {templates.map((t) => {
            const fn = t.OrgFunction
            return (
              <Card key={t.id} className={!t.isActive ? "opacity-60" : ""}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium leading-snug cursor-pointer hover:underline" onClick={() => openEdit(t)}>
                      {t.title}
                    </h4>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => handleToggleActive(t)} title={t.isActive ? "Остановить" : "Запустить"}>
                        <PowerIcon className={`size-4 ${t.isActive ? "text-emerald-600" : "text-muted-foreground"}`} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(t)}>
                        <Trash2Icon className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {t.description && <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={PRIORITY_VARIANTS[t.priority] ?? "secondary"}>
                      {PRIORITY_LABELS[t.priority] ?? t.priority}
                    </Badge>
                    {fn && (
                      <Badge variant="outline">
                        {fn.Department?.name ? `${fn.Department.name} → ` : ""}{fn.name}
                      </Badge>
                    )}
                    <Badge variant={t.rrule ? "default" : "outline"} className="gap-1">
                      <CalendarClockIcon className="size-3" />
                      {t.rrule ? "Повторяется" : "Разовая"}
                    </Badge>
                    {!t.isActive && <Badge variant="secondary">Остановлен</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Исполнитель: {STRATEGY_LABELS[t.assigneeStrategy] ?? t.assigneeStrategy}</span>
                    {t.User_TaskTemplate_fixedAssigneeToUser && (
                      <span>→ {t.User_TaskTemplate_fixedAssigneeToUser.name}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Диалог создания/редактирования */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Редактировать шаблон" : "Новый шаблон задачи"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="t-title">Название *</Label>
              <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Напр. Оплата налогов, Реклама: запуск кампании" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="t-desc">Описание</Label>
              <Textarea id="t-desc" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Детали задачи" rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Функция</Label>
                <Select value={functionId} onValueChange={(v) => setFunctionId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Без функции" /></SelectTrigger>
                  <SelectContent>
                    {functions.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.Department?.name ? `${f.Department.name} → ` : ""}{f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Приоритет</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v ?? "medium")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="t-dtstart">Дата начала / срок (для разовой) *</Label>
              <Input id="t-dtstart" type="date" value={dtStart} onChange={(e) => setDtStart(e.target.value)} />
            </div>

            <RruleBuilder
              value={rrule}
              onChange={setRrule}
              dtStart={dtStart ? new Date(dtStart).toISOString() : new Date().toISOString()}
              until={until ?? undefined}
              onUntilChange={setUntil}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Исполнитель</Label>
                <Select value={strategy} onValueChange={(v) => setStrategy(v ?? "function_responsible")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STRATEGY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {strategy === "fixed" && (
                <div className="space-y-1.5">
                  <Label>Сотрудник</Label>
                  <Select value={fixedAssigneeId} onValueChange={(v) => setFixedAssigneeId(v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                    <SelectContent>
                      {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Отмена</DialogClose>
            <Button onClick={handleSave} disabled={busy || !title.trim() || !dtStart}>
              {busy ? "Сохранение..." : editId ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
