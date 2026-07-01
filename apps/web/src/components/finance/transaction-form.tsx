"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

import { transactionsApi, ApiClientError } from "@/lib/api/transactions"
import { categoriesApi } from "@/lib/api/categories"
import type { TransactionData, CategoryData } from "@/lib/api/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
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

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  transaction?: TransactionData | null
  defaultCategoryId?: string
}

export function TransactionForm({
  open,
  onOpenChange,
  onSuccess,
  transaction,
  defaultCategoryId,
}: TransactionFormProps) {
  const isEditing = !!transaction
  const [categoryId, setCategoryId] = useState("")
  const [type, setType] = useState("")
  const [date, setDate] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("confirmed")
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [catsLoading, setCatsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setCatsLoading(true)
      categoriesApi
        .getCategories()
        .then((res) => setCategories(res.data))
        .catch(() => {})
        .finally(() => setCatsLoading(false))

      if (transaction) {
        setCategoryId(transaction.categoryId)
        setType(transaction.type)
        setDate(new Date(transaction.date).toISOString().slice(0, 10))
        setAmount(String(transaction.amount))
        setDescription(transaction.description ?? "")
        setStatus(transaction.status)
        setPaymentMethod((transaction.paymentMethod as string) ?? "")
      } else {
        resetForm()
        if (defaultCategoryId) setCategoryId(defaultCategoryId)
      }
    }
  }, [open, transaction, defaultCategoryId])

  const resetForm = () => {
    setCategoryId("")
    setType("")
    setDate(new Date().toISOString().slice(0, 10))
    setAmount("")
    setDescription("")
    setStatus("confirmed")
    setPaymentMethod("")
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!categoryId) { setFormError("Category is required"); return }
    if (!date) { setFormError("Date is required"); return }
    if (!amount || isNaN(Number(amount))) { setFormError("Valid amount is required"); return }
    if (!type) { setFormError("Type is required"); return }

    setSubmitting(true)
    try {
      if (isEditing && transaction) {
        await transactionsApi.updateTransaction(transaction.id, {
          categoryId,
          type: type as "income" | "expense",
          date,
          amount: Number(amount),
          description: description || null,
          status,
        })
      } else {
        await transactionsApi.createTransaction({
          categoryId,
          type: type as "income" | "expense",
          date,
          amount: Number(amount),
          description: description || null,
          status,
          paymentMethod: (paymentMethod || undefined) as "cash" | "bank" | "card" | undefined,
        })
      }
      resetForm()
      onSuccess()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message)
      } else {
        setFormError("Не удалось сохранить транзакцию.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetForm()
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Редактировать транзакцию" : "Создать транзакцию"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update transaction details."
              : "Record a new income or expense transaction."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <div className="grid gap-4 py-2">
            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="category">
                Категория <span className="text-destructive">*</span>
              </Label>
              {catsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Загрузка...
                </div>
              ) : (
                <Select
                  value={categoryId}
                  onValueChange={(v) => { if (v) setCategoryId(v) }}
                  items={Object.fromEntries(
                    categories.filter((c) => c.isActive).map((c) => [c.id, `${c.name} (${c.type})`])
                  )}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {categories.filter((c) => c.isActive).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.type})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Type and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">
                  Type <span className="text-destructive">*</span>
                </Label>
                <Select value={type} onValueChange={(v) => { if (v) setType(v) }} items={{ income: "Income", expense: "Expense" }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Amount and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">
                  Amount <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="any"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => { if (v) setStatus(v) }} items={{ confirmed: "Confirmed", pending: "Pending" }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Transaction description"
              />
            </div>

            {/* Payment method (FIN-03) */}
            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Способ оплаты</Label>
              <Select
                value={paymentMethod || "__none__"}
                onValueChange={(v) => setPaymentMethod(!v || v === "__none__" ? "" : v)}
                items={{ __none__: "Не указан", bank: "Безналичный (банк)", cash: "Наличные", card: "Карта / эквайринг" }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Не указан" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Не указан</SelectItem>
                  <SelectItem value="bank">Безналичный (банк)</SelectItem>
                  <SelectItem value="cash">Наличные</SelectItem>
                  <SelectItem value="card">Карта / эквайринг</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Сохранение..." : isEditing ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
