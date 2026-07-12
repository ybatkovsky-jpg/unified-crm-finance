"use client"

import { useState, useEffect } from "react"
import { Ruler, Loader2, CheckCircle2 } from "lucide-react"
import { createTask, ApiClientError } from "@/lib/api/tasks"
import { parseJson } from "@/lib/api/shared"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

interface Props {
  projectId: string
  projectName: string
  contactId?: string | null
  /** "measurement_1" or "measurement_2" */
  measurementType: "measurement_1" | "measurement_2"
}

const LABELS: Record<Props["measurementType"], { title: string; desc: string }> = {
  measurement_1: {
    title: "Замер #1 (предварительный)",
    desc: "Выезд менеджера-дизайнера на объект для снятия размеров и фото. Бесплатный.",
  },
  measurement_2: {
    title: "Замер #2 (полный)",
    desc: "Выезд технолога + монтажника на объект для детального замера и расчёта выпилов. Бесплатный.",
  },
}

export function CreateMeasurementTask({ projectId, projectName, contactId, measurementType }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [assigneeId, setAssigneeId] = useState<string>("")
  const [users, setUsers] = useState<Array<{ id: string; name: string | null; email: string }>>([])

  const info = LABELS[measurementType]

  // Загрузка списка исполнителей для выбора.
  useEffect(() => {
    if (open && users.length === 0) {
      fetch("/api/users/list")
        .then((r) => r.json())
        .then((d: { data?: typeof users }) => setUsers(d.data ?? []))
        .catch(() => {})
    }
  }, [open, users.length])

  const handleCreate = async () => {
    setSaving(true)
    setError(null)
    try {
      await createTask({
        title: `${info.title} — ${projectName}`,
        description: description || `Выезд на объект по проекту «${projectName}». ${info.desc}`,
        type: measurementType,
        priority: "high",
        dueDate: dueDate || undefined,
        projectId,
        contactId: contactId ?? undefined,
        assigneeId: assigneeId || undefined,
        createdBy: "system",
      })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось создать задачу")
    } finally {
      setSaving(false)
    }
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      setSuccess(false)
      setError(null)
      setDescription("")
      setDueDate("")
      setAssigneeId("")
    }
    setOpen(open)
  }

  const icon = measurementType === "measurement_1" ? (
    <Ruler className="size-4" />
  ) : (
    <Ruler className="size-4" />
  )

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {icon}
        <span className="ml-1.5">
          {measurementType === "measurement_1" ? "Замер #1" : "Замер #2"}
        </span>
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {icon}
              {info.title}
            </DialogTitle>
            <DialogDescription>{info.desc}</DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 className="size-10 text-green-600" />
              <p className="text-sm text-muted-foreground">
                Задача «{info.title}» создана для проекта «{projectName}».
              </p>
              <Button onClick={() => handleClose(false)}>Готово</Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Проект</Label>
                <Input value={projectName} disabled />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="meas-desc">Описание (необязательно)</Label>
                <Textarea
                  id="meas-desc"
                  placeholder={`Детали выезда по проекту «${projectName}»...`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="meas-date">Дата выезда (необязательно)</Label>
                <Input
                  id="meas-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Исполнитель</Label>
                <Select
                  value={assigneeId}
                  onValueChange={(v) => { if (v) setAssigneeId(v) }}
                  items={Object.fromEntries(users.map((u) => [u.id, u.name ?? u.email]))}
                >
                  <SelectTrigger><SelectValue placeholder="Выберите исполнителя" /></SelectTrigger>
                  <SelectContent><SelectGroup>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name ?? u.email}</SelectItem>
                    ))}
                  </SelectGroup></SelectContent>
                </Select>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          {!success && (
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span className="ml-1.5">Создание...</span>
                  </>
                ) : (
                  "Создать задачу"
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
