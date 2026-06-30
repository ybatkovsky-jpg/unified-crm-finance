"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

import { categoriesApi, ApiClientError } from "@/lib/api/categories"
import type { CategoryData, CategoryCreateInput, CategoryUpdateInput } from "@/lib/api/types"
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

interface CategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  category?: CategoryData | null
}

export function CategoryForm({ open, onOpenChange, onSuccess, category }: CategoryFormProps) {
  const isEditing = !!category
  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [parentId, setParentId] = useState<string | null>(null)
  const [order, setOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Parent candidates for the select dropdown (loaded once)
  const [parentOptions, setParentOptions] = useState<CategoryData[]>([])
  const [parentsLoading, setParentsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      // Load categories for parent select
      setParentsLoading(true)
      categoriesApi
        .getCategories({ includeInactive: false })
        .then((res) => {
          setParentOptions(res.data)
        })
        .catch(() => {
          // Non-critical: parent select just won't show options
        })
        .finally(() => setParentsLoading(false))

      if (category) {
        setName(category.name)
        setType(category.type)
        setParentId(category.parentId ?? null)
        setOrder(category.order)
        setIsActive(category.isActive)
      } else {
        resetForm()
      }
    }
  }, [open, category])

  const resetForm = () => {
    setName("")
    setType("")
    setParentId(null)
    setOrder(0)
    setIsActive(true)
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!name.trim()) {
      setFormError("Name is required")
      return
    }
    if (!type) {
      setFormError("Type is required")
      return
    }

    setSubmitting(true)
    try {
      if (isEditing && category) {
        const input: CategoryUpdateInput = {
          name: name.trim(),
          type: type as "income" | "expense",
          parentId: parentId ?? null,
          order,
          isActive,
        }
        await categoriesApi.updateCategory(category.id, input)
      } else {
        const input: CategoryCreateInput = {
          name: name.trim(),
          type: type as "income" | "expense",
          parentId: parentId ?? null,
          order,
          isActive,
        }
        await categoriesApi.createCategory(input)
      }
      resetForm()
      onSuccess()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message)
      } else {
        setFormError("Не удалось сохранить категорию. Пожалуйста, попробуйте снова.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  // Filter parent options: exclude self when editing (prevent self-reference)
  const filteredParentOptions = isEditing && category
    ? parentOptions.filter((c) => c.id !== category.id)
    : parentOptions

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Редактировать категорию" : "Создать категорию"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update category details."
              : "Add a new income or expense category."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <div className="grid gap-4 py-2">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Category name"
                required
              />
            </div>

            {/* Type and Order */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">
                  Type <span className="text-destructive">*</span>
                </Label>
                <Select value={type} onValueChange={(value) => { if (value) setType(value) }}>
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
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(e.target.value ? parseInt(e.target.value) : 0)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Parent */}
            <div className="grid gap-2">
              <Label htmlFor="parentId">Родительская категория</Label>
              {parentsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Загрузка категорий...
                </div>
              ) : (
                <Select
                  value={parentId ?? "__none__"}
                  onValueChange={(value) => {
                    setParentId(value === "__none__" ? null : value)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Нет родителя (верхний уровень)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="__none__">Нет родителя (верхний уровень)</SelectItem>
                      {filteredParentOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.type})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Active toggle (edit only) */}
            {isEditing && (
              <div className="grid gap-2">
                <Label htmlFor="isActive">Status</Label>
                <Select
                  value={isActive ? "active" : "inactive"}
                  onValueChange={(value) => setIsActive(value === "active")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
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
