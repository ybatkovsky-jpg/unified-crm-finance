"use client"

import { useState, useEffect, useCallback } from "react"
import {
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
} from "lucide-react"

import { budgetsApi, ApiClientError } from "@/lib/api/budgets"
import { categoriesApi } from "@/lib/api/categories"
import type { BudgetData, CategoryData } from "@/lib/api/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface BudgetWidgetProps {
  projectId: string
}

export function BudgetWidget({ projectId }: BudgetWidgetProps) {
  const [budgets, setBudgets] = useState<BudgetData[]>([])
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formOpen, setFormOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetData | null>(null)
  const [formCategoryId, setFormCategoryId] = useState("")
  const [formPeriod, setFormPeriod] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formNote, setFormNote] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [budgetsRes, categoriesRes] = await Promise.all([
        budgetsApi.getBudgets({ projectId }),
        categoriesApi.getCategories(),
      ])
      setBudgets(budgetsRes.data)
      setCategories(categoriesRes.data)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to load budgets.")
      }
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Group budgets by period
  const groupedBudgets = budgets.reduce(
    (acc, b) => {
      const period = b.period || "Other"
      if (!acc[period]) acc[period] = []
      acc[period].push(b)
      return acc
    },
    {} as Record<string, BudgetData[]>
  )

  // Sorted periods (most recent first)
  const sortedPeriods = Object.keys(groupedBudgets).sort((a, b) =>
    b.localeCompare(a)
  )

  const openCreate = () => {
    setEditingBudget(null)
    setFormCategoryId("")
    setFormPeriod("")
    setFormAmount("")
    setFormNote("")
    setFormError(null)
    setFormOpen(true)
  }

  const openEdit = (budget: BudgetData) => {
    setEditingBudget(budget)
    setFormCategoryId(budget.categoryId)
    setFormPeriod(budget.period)
    setFormAmount(String(budget.amount))
    setFormNote(budget.note ?? "")
    setFormError(null)
    setFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formCategoryId) {
      setFormError("Category is required")
      return
    }
    if (!formPeriod) {
      setFormError("Period is required")
      return
    }
    if (!formAmount || isNaN(Number(formAmount)) || Number(formAmount) <= 0) {
      setFormError("Amount must be a positive number")
      return
    }

    setSubmitting(true)
    try {
      if (editingBudget) {
        await budgetsApi.updateBudget(editingBudget.id, {
          categoryId: formCategoryId,
          period: formPeriod,
          amount: Number(formAmount),
          note: formNote || null,
        })
      } else {
        await budgetsApi.createBudget({
          projectId,
          categoryId: formCategoryId,
          period: formPeriod,
          amount: Number(formAmount),
          note: formNote || null,
        })
      }
      setFormOpen(false)
      fetchData()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message)
      } else {
        setFormError("Failed to save budget.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (budget: BudgetData) => {
    if (!window.confirm(`Delete budget "${budget.period}"?`)) return
    setDeletingId(budget.id)
    try {
      await budgetsApi.deleteBudget(budget.id)
      fetchData()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to delete budget.")
      }
    } finally {
      setDeletingId(null)
    }
  }

  const getCategoryName = (categoryId: string): string => {
    const cat = categories.find((c) => c.id === categoryId)
    return cat?.name ?? categoryId
  }

  const getCategoryType = (categoryId: string): string => {
    const cat = categories.find((c) => c.id === categoryId)
    return cat?.type ?? "expense"
  }

  const getPeriodLabel = (period: string): string => {
    // period formats: "2026", "2026-Q1", "2026-01"
    if (period.includes("-Q")) {
      const [year, quarter] = period.split("-Q")
      return `Q${quarter} ${year}`
    }
    if (period.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = period.split("-")
      const date = new Date(Number(year), Number(month) - 1, 1)
      return date.toLocaleDateString("ru-RU", { year: "numeric", month: "long" })
    }
    return period
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
    }).format(amount)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="size-4" />
              Бюджет проекта
            </CardTitle>
            <Button variant="outline" size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              <span className="ml-1.5">Добавить</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="size-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Загрузка...</span>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
              <Button variant="outline" size="sm" className="ml-2" onClick={fetchData}>
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && budgets.length === 0 && (
            <p className="text-muted-foreground text-sm py-4 text-center">
              Бюджет не установлен. Добавьте бюджет по категориям и периодам.
            </p>
          )}

          {!loading && !error && budgets.length > 0 && (
            <div className="space-y-4">
              {/* Total */}
              <div className="rounded-lg bg-muted p-3 text-center">
                <span className="text-sm text-muted-foreground">Общий бюджет: </span>
                <span className="font-semibold">{formatCurrency(totalBudget)}</span>
              </div>

              {/* By period */}
              {sortedPeriods.map((period) => (
                <div key={period} className="space-y-1.5">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {getPeriodLabel(period)}
                  </h4>
                  <div className="space-y-1">
                    {groupedBudgets[period].map((budget) => (
                      <div
                        key={budget.id}
                        className="flex items-center justify-between rounded-lg border px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge
                            variant={
                              getCategoryType(budget.categoryId) === "income"
                                ? "default"
                                : "secondary"
                            }
                            className="shrink-0"
                          >
                            {getCategoryType(budget.categoryId) === "income"
                              ? "Доход"
                              : "Расход"}
                          </Badge>
                          <span className="text-sm truncate">
                            {getCategoryName(budget.categoryId)}
                          </span>
                          {budget.note && (
                            <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                              — {budget.note}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-medium">
                            {formatCurrency(budget.amount)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => openEdit(budget)}
                            title="Edit"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(budget)}
                            disabled={deletingId === budget.id}
                            title="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? "Редактировать бюджет" : "Добавить бюджет"}
            </DialogTitle>
            <DialogDescription>
              {editingBudget
                ? "Измените параметры бюджета."
                : "Укажите категорию, период и сумму."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {formError && (
              <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {formError}
              </div>
            )}

            <div className="grid gap-4">
              {/* Category */}
              <div className="grid gap-2">
                <Label htmlFor="category">
                  Категория <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formCategoryId}
                  onValueChange={(v) => { if (v) setFormCategoryId(v) }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {categories
                        .filter((c) => c.isActive)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.type === "income" ? "Доход" : "Расход"})
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Period */}
              <div className="grid gap-2">
                <Label htmlFor="period">
                  Период <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formPeriod}
                  onValueChange={(v) => { if (v) setFormPeriod(v) }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите период" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="2026">2026 (год)</SelectItem>
                      <SelectItem value="2026-Q1">Q1 2026</SelectItem>
                      <SelectItem value="2026-Q2">Q2 2026</SelectItem>
                      <SelectItem value="2026-Q3">Q3 2026</SelectItem>
                      <SelectItem value="2026-Q4">Q4 2026</SelectItem>
                      <SelectItem value="2026-01">Январь 2026</SelectItem>
                      <SelectItem value="2026-02">Февраль 2026</SelectItem>
                      <SelectItem value="2026-03">Март 2026</SelectItem>
                      <SelectItem value="2026-04">Апрель 2026</SelectItem>
                      <SelectItem value="2026-05">Май 2026</SelectItem>
                      <SelectItem value="2026-06">Июнь 2026</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="grid gap-2">
                <Label htmlFor="amount">
                  Сумма <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="any"
                />
              </div>

              {/* Note */}
              <div className="grid gap-2">
                <Label htmlFor="note">Примечание</Label>
                <Input
                  id="note"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Например: закупка материалов"
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={submitting}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {submitting
                  ? "Сохранение..."
                  : editingBudget
                  ? "Сохранить"
                  : "Добавить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
