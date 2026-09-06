"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { EntitySearchSelect } from "@/components/ui/entity-search-select"
import { projectsApi, ApiClientError } from "@/lib/api/projects"
import type { ProjectCreateInput } from "@/lib/api/types"

interface CreateProjectModalProps {
  onCreate?: (project: any) => void
}

const STATUS_OPTIONS = [
  { value: "lead", label: "Лид" },
  { value: "active", label: "Активный" },
  { value: "completed", label: "Завершён" },
  { value: "paused", label: "На паузе" },
]

const CURRENCY_OPTIONS = [
  { value: "RUB", label: "RUB" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
]

export function CreateProjectModal({ onCreate }: CreateProjectModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [externalNumber, setExternalNumber] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("lead")
  const [currency, setCurrency] = useState("RUB")
  const [contractAmount, setContractAmount] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [marginTarget, setMarginTarget] = useState("0.25")
  const [managerId, setManagerId] = useState<string | null>(null)

  // Selected items (searchable selects)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)

  const resetForm = () => {
    setExternalNumber("")
    setName("")
    setDescription("")
    setStatus("lead")
    setCurrency("RUB")
    setContractAmount("")
    setStartDate("")
    setEndDate("")
    setMarginTarget("0.25")
    setManagerId(null)
    setSelectedContactId(null)
    setSelectedContractId(null)
    setSelectedDealId(null)
    setError(null)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      resetForm()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const data: ProjectCreateInput = {
        externalNumber,
        name,
        description: description || undefined,
        contactId: selectedContactId || undefined,
        dealId: selectedDealId || undefined,
        contractId: selectedContractId || undefined,
        managerId: managerId || undefined,
        status,
        currency,
        contractAmount: contractAmount ? parseFloat(contractAmount) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        marginTarget: marginTarget ? parseFloat(marginTarget) : undefined,
      }

      const response = await projectsApi.createProject(data)
      onCreate?.(response.data)
      setOpen(false)
      resetForm()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Не удалось создать проект. Пожалуйста, попробуйте снова.")
      }
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = externalNumber.trim() !== "" && name.trim() !== ""

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        <span className="ml-1.5">Создать проект</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Новый проект</DialogTitle>
            <DialogDescription>
              Создайте новый проект с привязкой к контакту, сделке или договору.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </div>
            )}

            {/* External Number */}
            <div className="grid gap-2">
              <Label htmlFor="externalNumber">Номер проекта *</Label>
              <Input
                id="externalNumber"
                value={externalNumber}
                onChange={(e) => setExternalNumber(e.target.value)}
                placeholder="ПМ-2026-00001"
                required
              />
            </div>

            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Разработка CRM системы"
                required
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Дополнительная информация о проекте..."
                rows={3}
              />
            </div>

            {/* Status & Manager */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Статус</Label>
                <Select value={status} onValueChange={(value) => setStatus(value ?? "lead")} items={Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]))}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="managerId">Ответственный менеджер</Label>
                <EntitySearchSelect
                  id="managerId"
                  type="user"
                  value={managerId}
                  onValueChange={(v) => setManagerId(v)}
                  placeholder="Поиск сотрудника…"
                />
              </div>
            </div>

            {/* Currency & Contract Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="currency">Валюта</Label>
                <Select value={currency} onValueChange={(value) => setCurrency(value ?? "RUB")} items={Object.fromEntries(CURRENCY_OPTIONS.map((o) => [o.value, o.label]))}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contractAmount">Сумма контракта</Label>
                <Input
                  id="contractAmount"
                  type="number"
                  value={contractAmount}
                  onChange={(e) => setContractAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Дата начала</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">Дата окончания</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Margin Target */}
            <div className="grid gap-2">
              <Label htmlFor="marginTarget">Целевая маржа</Label>
              <Input
                id="marginTarget"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={marginTarget}
                onChange={(e) => setMarginTarget(e.target.value)}
                placeholder="0.25"
              />
            </div>

            {/* Contact / Counterparty Search */}
            <div className="grid gap-2">
              <Label>Контакт / Контрагент</Label>
              <EntitySearchSelect
                type="contact"
                value={selectedContactId}
                onValueChange={(v) => setSelectedContactId(v)}
                placeholder="Поиск контакта или компании…"
              />
            </div>

            {/* Deal Search */}
            <div className="grid gap-2">
              <Label>Сделка</Label>
              <EntitySearchSelect
                type="deal"
                value={selectedDealId}
                onValueChange={(v) => setSelectedDealId(v)}
                placeholder="Поиск сделки…"
              />
            </div>

            {/* Contract Search */}
            <div className="grid gap-2">
              <Label>Договор</Label>
              <EntitySearchSelect
                type="contract"
                value={selectedContractId}
                onValueChange={(v) => setSelectedContractId(v)}
                placeholder="Поиск договора…"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !isFormValid}>
              {loading ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
