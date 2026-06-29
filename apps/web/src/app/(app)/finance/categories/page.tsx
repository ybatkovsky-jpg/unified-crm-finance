"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { RefreshCwIcon, PencilIcon, Trash2Icon } from "lucide-react"

import { categoriesApi, ApiClientError } from "@/lib/api/categories"
import type { CategoryData, CategoryListParams } from "@/lib/api/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CategoryForm } from "@/components/finance/category-form"

type TypeFilter = "all" | "income" | "expense"
type StatusFilter = "all" | "active" | "inactive"

export default function CategoryListPage() {
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchCategories = useCallback(async (type: TypeFilter, status: StatusFilter) => {
    setLoading(true)
    setError(null)
    try {
      const params: CategoryListParams = {}

      if (type !== "all") params.type = type

      if (status === "all") {
        params.includeInactive = true
      } else if (status === "active") {
        params.isActive = true
      } else if (status === "inactive") {
        params.isActive = false
      }

      const response = await categoriesApi.getCategories(
        Object.keys(params).length > 0 ? params : undefined
      )
      setCategories(response.data)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to load categories. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories(typeFilter, statusFilter)
  }, [typeFilter, statusFilter, fetchCategories])

  const handleRetry = () => {
    fetchCategories(typeFilter, statusFilter)
  }

  const handleEdit = (cat: CategoryData) => {
    setEditingCategory(cat)
  }

  const handleDelete = async (cat: CategoryData) => {
    if (!window.confirm(`Deactivate category "${cat.name}"?`)) return
    setDeletingId(cat.id)
    try {
      await categoriesApi.deleteCategory(cat.id)
      fetchCategories(typeFilter, statusFilter)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to delete category.")
      }
    } finally {
      setDeletingId(null)
    }
  }

  // Build depth map for nested display
  const depthMap = useMemo(() => {
    const map = new Map<string, number>()
    const idSet = new Set(categories.map((c) => c.id))

    const getDepth = (cat: CategoryData): number => {
      const cached = map.get(cat.id)
      if (cached !== undefined) return cached

      if (!cat.parentId || !idSet.has(cat.parentId)) {
        map.set(cat.id, 0)
        return 0
      }

      const parent = categories.find((c) => c.id === cat.parentId)
      if (!parent) {
        map.set(cat.id, 0)
        return 0
      }

      const depth = getDepth(parent) + 1
      map.set(cat.id, depth)
      return depth
    }

    for (const cat of categories) {
      getDepth(cat)
    }
    return map
  }, [categories])

  // Build parent name lookup
  const parentNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const cat of categories) {
      map.set(cat.id, cat.name)
    }
    return map
  }, [categories])

  const renderTypeBadge = (type: string) => {
    return (
      <Badge variant={type === "income" ? "default" : "secondary"}>
        {type === "income" ? "Income" : "Expense"}
      </Badge>
    )
  }

  const renderStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "outline"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <Button onClick={() => setCreateOpen(true)}>Create</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Type</label>
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  if (value) setTypeFilter(value as TypeFilter)
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  if (value) setStatusFilter(value as StatusFilter)
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading categories...</span>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={handleRetry}>
                <RefreshCwIcon className="size-4" />
                <span className="ml-1.5">Retry</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && categories.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              No categories found
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead className="w-[80px]">Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => {
                const depth = depthMap.get(cat.id) ?? 0
                const parentName = cat.parentId
                  ? parentNameMap.get(cat.parentId) ?? "\—"
                  : "\—"

                return (
                  <TableRow key={cat.id}>
                    <TableCell>
                      <span style={{ paddingLeft: `${depth * 24}px` }}>
                        {depth > 0 && "\└ "}
                        {cat.name}
                      </span>
                    </TableCell>
                    <TableCell>{renderTypeBadge(cat.type)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {parentName}
                    </TableCell>
                    <TableCell>{cat.order}</TableCell>
                    <TableCell>{renderStatusBadge(cat.isActive)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => handleEdit(cat)}
                          title="Edit"
                        >
                          <PencilIcon className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(cat)}
                          disabled={deletingId === cat.id || !cat.isActive}
                          title={cat.isActive ? "Deactivate" : "Already inactive"}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CategoryForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          setCreateOpen(false)
          fetchCategories(typeFilter, statusFilter)
        }}
      />

      <CategoryForm
        open={!!editingCategory}
        onOpenChange={(open) => {
          if (!open) setEditingCategory(null)
        }}
        onSuccess={() => {
          setEditingCategory(null)
          fetchCategories(typeFilter, statusFilter)
        }}
        category={editingCategory}
      />
    </div>
  )
}
